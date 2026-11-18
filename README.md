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
- Review contact messages and update operational fleet status

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

```text
car-rental-system-walid/
├── backend/
│   ├── migrations/
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
│   │   ├── booking/
│   │   ├── components/
│   │   ├── config/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── docker-compose.yml
```

## User Roles

Three roles have distinct access to the application.

- Admin has full access to cars, users, bookings, and dashboard data
- Staff can access booking operations and staff dashboard features
- Customer can browse cars, make bookings, and view personal reservations

## API Modules

The backend exposes the following route groups.

- `/api/auth`
- `/api/cars`
- `/api/bookings`
- `/api/users`
- `/api/dashboard`
- `/api/contact`

## Application Flow

### Authentication Flow

- A new user registers with first name, last name, email, and password
- The password is hashed in the backend before storage
- On successful login, the backend returns a JWT token and user object
- The frontend stores both values in localStorage
- Protected requests automatically include the token through an Axios interceptor

### Booking Flow

- The user browses available cars
- The user selects a car and enters booking details
- Profile information can be updated during the booking process
- The booking is created with pending status
- Admin or staff can later confirm or cancel the booking
- Active holds and confirmed bookings block overlapping dates. Fleet staff can also mark a car unavailable for operational reasons.

### Admin Workflow

- Open dashboard summary
- Manage cars
- Review and manage bookings
- Review and manage users

## Frontend Notes

- main.jsx is the frontend entry point
- App.jsx defines the application routes
- ProtectedRoute.jsx handles role-based UI access
- api.js centralizes API calls and JWT request handling

## Backend Notes

- index.js is the backend entry point
- db.js handles PostgreSQL connection pooling
- Middleware is separated for authentication and role checking
- `routes/` groups the HTTP handlers by API module
- `migrate.js` applies the SQL files in `migrations/`

## Run locally

Create the private `backend/.env` described below. From the repository root, start the local site and database.

```bash
docker volume create car-rental-system-walid_car_rental_data
docker compose --env-file backend/.env up --build -d
```

Open [AutoLuxe on this computer](http://127.0.0.1:5000). Express serves the built React site and its API together. Both the site and PostgreSQL bind to loopback. To pause the project and retain all data, run `docker compose --env-file backend/.env stop`. Use `docker compose --env-file backend/.env start` to resume.

The named volume is external to Compose. Creating it again reuses it. PostgreSQL initializes only an empty volume with the schema and demo fleet. On startup the API applies pending SQL migrations in one transaction, recording each filename. The application keeps existing bookings, uses known legacy confirmation timestamps to identify booking-derived fleet flags, and preserves ambiguous historical blocks for staff review. An older installation must stop its original database before starting this stack on the same volume.

### Frontend development

With the local stack running, run `npm ci` and `npm run dev` in `frontend`. Open the Vite URL printed in the terminal. Its `/api` requests are proxied to the local API on port 5000. For manual backend development, use the local PostgreSQL instance with an initialized schema, stop the containerized API to free the port, then run `npm ci`, `npm run migrate` and `npm run dev` in `backend`.

### Environment variables

Create a private `backend/.env` with the following settings. Supply two independent, randomly generated secrets for the empty values. Restrict the file to its owner (mode 600).

```dotenv
PORT=5000
PGHOST=127.0.0.1
PGPORT=5555
PGUSER=caradmin
PGDATABASE=car_rental_db
PGPASSWORD=
JWT_SECRET=
```

These host settings connect a manually started API to the Compose database. Inside Compose the API uses the service address `db` on port 5432. When running the API manually, existing environment variables take precedence over backend/.env. Compose also honors exported shell variables before values in its `--env-file`.

For file-based secrets, the API first checks `PGPASSWORD_FILE` and `JWT_SECRET_FILE`, then the corresponding `/run/secrets/app_pgpassword` and `/run/secrets/app_jwt_secret` files, then the environment values. Configure overrides in the API process environment or mount the conventional files into the container. When a selected file is missing, unreadable, or empty, correct it and restart the API. All API instances load their secrets at startup.

On a new database volume the PostgreSQL container sets the initial role password from `PGPASSWORD` through `POSTGRES_PASSWORD`. For an existing volume, change the role password in PostgreSQL, synchronize the private configuration, and verify a new password-authenticated connection before restarting the API. Keep the existing database volume. Changing the JWT signing secret requires users to sign in again after all API instances restart.

### Booking and account settings

Searches can specify both rental times and pickup/return branches. Cars with unknown branches are available for an office-arranged request when no branch is selected. Contact form submissions are stored locally and visible to staff and administrators under Contact messages.

Customer bookings use the signed-in account and the car's stored daily rate per started 24-hour period. Pickup and return use Europe/Berlin branch time. An administrator can enter an agreed total when editing a booking. Three positive integer settings can be supplied in the backend environment.

- `BOOKING_HOLD_HOURS` defaults to 24 hours from creation of a pending request. An expired request stays in the booking history.
- `BOOKING_MAX_PENDING_PER_CUSTOMER` defaults to 3 pending requests per customer.
- `BOOKING_MAX_RENTAL_DAYS` defaults to 30 days for customer self-service.

New passwords require at least 12 characters and at most 72 UTF-8 bytes. Existing passwords continue to work. Authentication uses the user's current role and account status. Limits on login and registration apply per API process in 15-minute windows.

## Testing

Install dependencies with `npm ci` in each package before running its tests. The following commands run from the repository root.

```bash
npm --prefix backend test
npm --prefix frontend test -- --run
npm --prefix frontend run lint
npm --prefix frontend run coverage
```

The frontend uses Vitest and Testing Library. The backend uses the Node.js test runner. The database regression fixture uses a temporary PostgreSQL instance when the local PostgreSQL server tools are installed.

## Highlights

- Full-stack architecture
- Role-based access control
- Reusable React components
- Centralized API handling
- Dockerized setup
- Booking validation logic
- Dashboard summaries for operational management

## Author

[walid-dev16 on GitHub](https://github.com/walid-dev16)

## Note

This project was developed for educational and portfolio purposes.
