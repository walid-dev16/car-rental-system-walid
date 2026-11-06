-- Only an empty fleet receives the original project's fictional demo cars.
-- No users, credentials, personal data or real reservations are seeded.
WITH inserted AS (
INSERT INTO cars
  (id, brand, model, production_year, category, plate_number, seats, transmission,
   fuel_type, daily_price, status, image_url, available_branches, description)
SELECT id, brand, model, production_year, category, plate_number, seats,
       transmission, fuel_type, daily_price, status, image_url,
       'Erfurt, Berlin, Frankfurt, Munich, Hamburg',
       'Educational demo vehicle. No real rental or payment is processed.'
FROM (VALUES
  (1, 'Toyota', 'Corolla', 2022, 'economy', 'DEMO-1001', 5, 'automatic', 'petrol', 45.00, 'available', NULL),
  (2, 'BMW', '3 Series', 2021, 'sedan', 'DEMO-1002', 5, 'automatic', 'diesel', 85.00, 'available', NULL),
  (3, 'Hyundai', 'Tucson', 2023, 'suv', 'DEMO-1003', 5, 'automatic', 'petrol', 95.00, 'maintenance', NULL),
  (4, 'Mercedes', 'C200', 2022, 'luxury', 'DEMO-1004', 5, 'automatic', 'petrol', 120.00, 'available', NULL),
  (5, 'Volkswagen', 'Polo', 2020, 'economy', 'DEMO-1005', 5, 'manual', 'petrol', 38.00, 'available', NULL),
  (9, 'BMW', 'X5', 2025, 'suv', 'DEMO-1009', 5, 'automatic', 'diesel', 310.00, 'available', 'https://img.sixt.com/2800/515a4846-a4c1-46f4-8e6c-8031151e5e89.jpg'),
  (13, 'Audi', 'A6 E-Tron', 2025, 'luxury', 'DEMO-1013', 5, 'automatic', 'electric', 260.00, 'available', 'https://img.sixt.com/2800/bce9f85e-57ce-4959-9b62-19a7e0d7294b.png'),
  (14, 'Mercedes-Benz', 'CLE', 2025, 'luxury', 'DEMO-1014', 4, 'automatic', 'petrol', 280.00, 'available', 'https://img.sixt.com/2800/2a352fec-1b42-482e-b97c-c31dfc951a86.png')
) AS demo(id, brand, model, production_year, category, plate_number, seats,
          transmission, fuel_type, daily_price, status, image_url)
WHERE NOT EXISTS (SELECT 1 FROM cars)
RETURNING id
)
SELECT setval(pg_get_serial_sequence('cars', 'id'), MAX(id), true)
FROM inserted HAVING COUNT(*) > 0;
