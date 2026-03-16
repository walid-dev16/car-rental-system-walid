import axios from 'axios';

/* Shared Axios instance for all frontend API requests */
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
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
export const fetchAvailableCars = () => API.get('/cars/available');
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