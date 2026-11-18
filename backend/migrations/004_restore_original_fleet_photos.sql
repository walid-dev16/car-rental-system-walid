-- Use the corresponding local fleet photos only while the demo vehicles have migration 003 defaults.
UPDATE cars AS car
SET image_url = photo.original_url
FROM (VALUES
  ('DEMO-1002', 'BMW', '3 Series', '/fleet/bmw-3.webp', 'https://img.sixt.com/2800/c5a6dbe6-7652-41ff-985c-e27313f9ba8c.jpg'),
  ('DEMO-1009', 'BMW', 'X5', '/fleet/x5.webp', 'https://img.sixt.com/2800/515a4846-a4c1-46f4-8e6c-8031151e5e89.jpg'),
  ('DEMO-1013', 'Audi', 'A6 E-Tron', '/fleet/a6-e-tron.webp', 'https://img.sixt.com/2800/bce9f85e-57ce-4959-9b62-19a7e0d7294b.png'),
  ('DEMO-1014', 'Mercedes-Benz', 'CLE', '/fleet/cle.webp', 'https://img.sixt.com/2800/2a352fec-1b42-482e-b97c-c31dfc951a86.png')
) AS photo(plate, brand, model, replacement_url, original_url)
WHERE (car.plate_number, car.brand, car.model, car.image_url)
    = (photo.plate, photo.brand, photo.model, photo.replacement_url);
