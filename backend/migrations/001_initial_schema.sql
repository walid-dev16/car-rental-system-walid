-- Non-destructive initialization. Never run the legacy schema.sql reset file
-- against a deployed database. Existing tables and rows are retained.
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cars (
  id BIGSERIAL PRIMARY KEY,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  production_year INT NOT NULL,
  category VARCHAR(30) NOT NULL,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  seats INT NOT NULL,
  transmission VARCHAR(20) NOT NULL,
  fuel_type VARCHAR(20) NOT NULL,
  daily_price NUMERIC(10,2) NOT NULL CHECK (daily_price > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  image_url TEXT,
  description TEXT,
  available_branches TEXT,
  technical_specifications TEXT,
  safety_features TEXT,
  performance_info TEXT,
  doors INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Also reconcile a database previously initialized from the original DDL.
ALTER TABLE cars ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS available_branches TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS technical_specifications TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS safety_features TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS performance_info TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS doors INT;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ NOT NULL,
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price > 0),
  extra_fee NUMERIC(10,2) DEFAULT 0,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (return_datetime > pickup_datetime)
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS bookings_car_interval_idx
  ON bookings (car_id, pickup_datetime, return_datetime);
CREATE INDEX IF NOT EXISTS bookings_user_pending_idx
  ON bookings (user_id, status, expires_at);
