-- Bootstrap a fresh database. Existing data is preserved.
BEGIN;
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,

  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,

  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),

  password_hash TEXT NOT NULL,

  role VARCHAR(20) NOT NULL DEFAULT 'customer',

  street_address VARCHAR(150),
  city VARCHAR(80),
  postal_code VARCHAR(20),
  country_code VARCHAR(2),

  driving_license_number VARCHAR(50),
  license_issue_date DATE,
  license_expiry_date DATE,
  license_image_url TEXT,

  account_status VARCHAR(20) NOT NULL DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cars (
  id BIGSERIAL PRIMARY KEY,

  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  production_year INT NOT NULL,

  category VARCHAR(30) NOT NULL, -- sedan / suv / luxury

  plate_number VARCHAR(20) UNIQUE NOT NULL,

  seats INT NOT NULL,
  transmission VARCHAR(20) NOT NULL,
  fuel_type VARCHAR(20) NOT NULL,

  daily_price NUMERIC(10,2) NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'available',
  status_from_booking BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  description TEXT,
  available_branches TEXT,
  technical_specifications TEXT,
  safety_features TEXT,
  performance_info TEXT,
  doors INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE RESTRICT,

  pickup_datetime TIMESTAMP NOT NULL,
  return_datetime TIMESTAMP NOT NULL,
  pickup_branch VARCHAR(50),
  dropoff_branch VARCHAR(50),

  total_price NUMERIC(10,2) NOT NULL,
  extra_fee NUMERIC(10,2) DEFAULT 0,

  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash', -- cash at office

  notes TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS bookings_car_period_idx ON bookings (car_id, return_datetime, pickup_datetime);
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id BIGSERIAL PRIMARY KEY,
  sender_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMIT;
