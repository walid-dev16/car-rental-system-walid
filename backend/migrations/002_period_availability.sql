-- The original confirmation wrote the booking and car timestamps using NOW() in one transaction.
-- Preserve each original status; tag only rows with matching evidence. Leave ambiguous holds manual.

ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS status_from_booking BOOLEAN;
UPDATE public.cars AS c
SET status_from_booking = c.status = 'booked' AND EXISTS (
  SELECT 1 FROM public.bookings AS b
  WHERE b.car_id = c.id AND b.status = 'booked' AND b.updated_at = c.updated_at
)
WHERE c.status_from_booking IS NULL;
ALTER TABLE public.cars
  ALTER COLUMN status_from_booking SET DEFAULT FALSE,
  ALTER COLUMN status_from_booking SET NOT NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pickup_branch VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dropoff_branch VARCHAR(50);
CREATE INDEX IF NOT EXISTS bookings_car_period_idx ON public.bookings (car_id, return_datetime, pickup_datetime);
