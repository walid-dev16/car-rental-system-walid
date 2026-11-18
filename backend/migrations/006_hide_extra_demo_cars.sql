ALTER TABLE cars ADD COLUMN IF NOT EXISTS is_listed BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE cars
SET is_listed = FALSE
WHERE is_listed AND (plate_number, brand, model) IN (
  ('DEMO-1001', 'Toyota', 'Corolla'),
  ('DEMO-1003', 'Hyundai', 'Tucson'),
  ('DEMO-1004', 'Mercedes', 'C200'),
  ('DEMO-1005', 'Volkswagen', 'Polo')
);
