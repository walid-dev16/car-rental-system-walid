import axios from 'axios';
import { clearSession } from '../auth/session.js';
import { bookingAuthLink } from '../booking/bookingNavigation.js';

/* Shared Axios instance for all frontend API requests */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

API.interceptors.response.use(undefined, (error) => {
  const token = localStorage.getItem('token');
  if (error.response?.status === 401 && token &&
      error.config?.headers?.Authorization === `Bearer ${token}` &&
      !error.config.url?.startsWith('/auth/')) {
    clearSession();
    localStorage.setItem('session_expired_message', 'Session expired. Please login again.');
    const { pathname, search } = window.location;
    window.location.assign(/^\/booking\/\d+$/.test(pathname)
      ? bookingAuthLink('/login', pathname + search) : '/login');
  }
  return Promise.reject(error);
});

/* Attach JWT token automatically to protected requests */
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

/* Centralized API service functions */
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);

export const fetchCars = () => API.get('/cars');
export const fetchAvailableCars = (params) => API.get('/cars/available', { params });
export const addCar = (carData) => API.post('/cars', carData);
export const editCar = (id, carData) => API.put(`/cars/${id}`, carData);
export const updateCarStatus = (id, status) =>
  API.patch(`/cars/${id}/status`, { status });
export const deleteCar = (id) => API.delete(`/cars/${id}`);

export const createBooking = (bookingData) => API.post('/bookings', bookingData);
export const fetchMyBookings = () => API.get('/bookings/my');

export const dashboardSummary = () => API.get('/dashboard/summary');
export const updateProfile = (profileData) => API.put('/users/profile', profileData);

export default API;
