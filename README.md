# AutoLuxe Car Rental System

AutoLuxe is a full-stack car rental management system built with React, Node.js, Express, PostgreSQL, and Docker Compose.  
The system supports multiple user roles and provides a complete workflow for browsing cars, creating bookings, and managing fleet and user operations.

## Main Features

### Public Features
- Browse available cars
- View car details
- Filter cars by city, category, transmission, fuel type, seats, and maximum price
- View company information and contact page

### Authentication
- User registration
- User login
- JWT-based authentication
- Role-based protected routes

### Customer Features
- Customer dashboard
- Create booking requests
- View personal bookings
- Update profile information during the booking flow

### Admin Features
- Admin dashboard with summary statistics
- Manage cars: create, edit, and delete
- Manage bookings: confirm, cancel, edit, and delete
- Manage users
- View operational fleet overview

### Staff Features
- Staff dashboard
- View and manage bookings
- Support operational booking workflow

## Technologies Used

### Frontend
- React
- React Router DOM
- Axios
- Tailwind CSS
- Framer Motion
- Vite
- Vitest
- Testing Library

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT
- bcryptjs
- dotenv
- pg

### Dev Tools
- Docker
- Docker Compose
- Git
- GitHub

## Project Structure

```bash
car-rental-system-walid/
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── db.js
│   ├── index.js
│   ├── schema.sql
│   ├── seed.sql
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── config/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── docker-compose.yml

User Roles

The system supports three roles:
	•	admin
	•	staff
	•	customer

Role Access
	•	Admin has full access to cars, users, bookings, and dashboard data
	•	Staff can access booking operations and staff dashboard features
	•	Customer can browse cars, make bookings, and view personal reservations

API Modules

The backend API is organized into the following route groups:
	•	/api/auth
	•	/api/cars
	•	/api/bookings
	•	/api/users
	•	/api/dashboard

Application Flow

Authentication Flow
	•	A new user registers with first name, last name, email, and password
	•	The password is hashed in the backend before storage
	•	On successful login, the backend returns a JWT token and user object
	•	The frontend stores both values in localStorage
	•	Protected requests automatically include the token through an Axios interceptor

Booking Flow
	•	The user browses available cars
	•	The user selects a car and enters booking details
	•	Profile information can be updated during the booking process
	•	The booking is created with pending status
	•	Admin or staff can later confirm or cancel the booking
	•	Car status is updated according to booking state

Admin Workflow
	•	Open dashboard summary
	•	Manage cars
	•	Review and manage bookings
	•	Review and manage users

Frontend Notes
	•	main.jsx is the frontend entry point
	•	App.jsx defines the application routes
	•	ProtectedRoute.jsx handles role-based UI access
	•	api.js centralizes API calls and JWT request handling

Backend Notes
	•	index.js is the backend entry point
	•	db.js handles PostgreSQL connection pooling
	•	Middleware is separated for authentication and role checking
	•	Routes are organized by responsibility:
	•	auth
	•	cars
	•	bookings
	•	users
	•	dashboard

How to Run the Project

Option 1: Docker Compose

From the root directory:
docker-compose up --build

Option 2: Manual Run
Backend:
cd backend
npm install
npm run dev

Frontend:
cd frontend
npm install
npm run dev

Environment Variables

Create a .env file inside the backend folder.

Example:
PORT=5000
JWT_SECRET=your_secret_key
PGHOST=your_host
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database

Testing
Frontend tests were created using Vitest and Testing Library.

Run tests:
cd frontend
npm test

Run coverage:
npm run coverage

Highlights
	•	Full-stack architecture
	•	Role-based access control
	•	Reusable React components
	•	Centralized API handling
	•	Dockerized setup
	•	Booking validation logic
	•	Dashboard summaries for operational management

Author

Walid Rafiq
GitHub: https://github.com/walid-dev16

Note

This project was developed for educational and portfolio purposes.
