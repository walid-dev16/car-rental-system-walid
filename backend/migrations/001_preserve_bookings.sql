-- Upgrade databases created by the original project without changing any rows.

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS available_branches TEXT,
  ADD COLUMN IF NOT EXISTS technical_specifications TEXT,
  ADD COLUMN IF NOT EXISTS safety_features TEXT,
  ADD COLUMN IF NOT EXISTS performance_info TEXT,
  ADD COLUMN IF NOT EXISTS doors INT;

ALTER TABLE public.bookings
  DROP CONSTRAINT bookings_user_id_fkey,
  ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  DROP CONSTRAINT bookings_car_id_fkey,
  ADD CONSTRAINT bookings_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE RESTRICT;
