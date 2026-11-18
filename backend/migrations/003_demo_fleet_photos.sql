-- Replace the original demo image defaults while preserving edited fleet photos.
UPDATE cars AS car
SET image_url = photo.bundled_url
FROM (VALUES
  ('DEMO-1001', 'Toyota', 'Corolla', '/fleet/corolla.webp', NULL),
  ('DEMO-1002', 'BMW', '3 Series', '/fleet/bmw-3.webp', NULL),
  ('DEMO-1003', 'Hyundai', 'Tucson', '/fleet/tucson.webp', NULL),
  ('DEMO-1004', 'Mercedes', 'C200', '/fleet/c200.webp', NULL),
  ('DEMO-1005', 'Volkswagen', 'Polo', '/fleet/polo.webp', NULL),
  ('DEMO-1009', 'BMW', 'X5', '/fleet/x5.webp', 'https://img.sixt.com/2800/515a4846-a4c1-46f4-8e6c-8031151e5e89.jpg'),
  ('DEMO-1013', 'Audi', 'A6 E-Tron', '/fleet/a6-e-tron.webp', 'https://img.sixt.com/2800/bce9f85e-57ce-4959-9b62-19a7e0d7294b.png'),
  ('DEMO-1014', 'Mercedes-Benz', 'CLE', '/fleet/cle.webp', 'https://img.sixt.com/2800/2a352fec-1b42-482e-b97c-c31dfc951a86.png')
) AS photo(plate, brand, model, bundled_url, previous_url)
WHERE (car.plate_number, car.brand, car.model) = (photo.plate, photo.brand, photo.model)
  AND (car.image_url IS NULL OR car.image_url ~ '^[[:space:]]*$' OR car.image_url = photo.previous_url);
