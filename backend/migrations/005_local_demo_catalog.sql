-- The demo catalog contains public vehicle specifications and synthetic registrations.
ALTER TABLE cars ADD COLUMN IF NOT EXISTS demo_display_order SMALLINT;

WITH catalog (
  display_order, plate, original_seed_model, brand, model, production_year, category,
  seats, doors, transmission, fuel_type, daily_price, image_url, available_branches,
  description, technical_specifications, safety_features, performance_info
) AS (VALUES
  (1, 'DEMO-1009', 'X5', 'BMW', 'X5', 2025, 'suv', 5, 5, 'automatic', 'petrol', 310.00,
   'https://img.sixt.com/2800/515a4846-a4c1-46f4-8e6c-8031151e5e89.jpg', 'Erfurt, Frankfurt, Hamburg, Berlin, Munich',
   'BMW X5

The BMW X5 represents the highest level of comfort, sporty driving dynamics, and maximum versatility. Whether on long highway journeys, winding country roads, or in urban city traffic, its intelligent xDrive all-wheel-drive system ensures optimal traction and confidence in every situation.

With up to 333 horsepower, state-of-the-art suspension and drivetrain technology, and advanced driver assistance systems, the X5 delivers premium driving comfort at the highest level.

Experience driving pleasure without compromise – discover the BMW X5 now with AutoLuxe.',
   'The BMW X5 sets new standards in the luxury SUV segment, combining cutting-edge technology with first-class comfort. The BMW Live Cockpit Professional with a high-resolution digital display allows intuitive control of all vehicle functions and delivers a seamless digital experience.

For maximum driving comfort, the adaptive suspension automatically adjusts to different road conditions. The optional laser light technology significantly improves visibility during night driving, enhancing overall safety. With its spacious interior and intelligent cargo management system, the BMW X5 is the perfect companion for travel, business trips, and everyday life.',
   'In the BMW X5, state-of-the-art safety technology meets the highest protection standards. In the Euro NCAP crash test, the SUV received a 5-star rating, impressing with its robust body structure and the latest driver assistance systems.

Numerous assistance features are included as standard, such as the lane departure warning, forward collision warning with city braking function, and adaptive cruise control with braking function, enabling a relaxed driving experience even at high speeds. The emergency braking assistant detects pedestrians and vehicles early and initiates emergency braking when necessary to help prevent accidents.',
   'In the BMW X5, state-of-the-art safety technology meets the highest protection standards. In the Euro NCAP crash test, the SUV received a 5-star rating, impressing with its robust body structure and the latest driver assistance systems.

Numerous assistance features are included as standard, such as the lane departure warning, forward collision warning with city braking function, and adaptive cruise control with braking function, enabling a relaxed driving experience even at high speeds. The emergency braking assistant detects pedestrians and vehicles early and initiates emergency braking when necessary to help prevent accidents.'),
  (2, 'DEMO-2001', NULL, 'BMW', 'X3 M40', 2025, 'suv', 5, 5, 'automatic', 'petrol', 200.00,
   'https://img.sixt.com/2800/b9960a32-28eb-4fbe-b779-bb0e992e122a.jpg', 'Erfurt, Frankfurt, Hamburg, Munich, Berlin',
   'BMW X3 M40

The BMW X3 M40 is the ideal SUV for those who want to combine sportiness, comfort, and the latest technology in one vehicle. With its powerful 3.0-liter inline six-cylinder engine, intelligent xDrive all-wheel-drive system, and M Sport braking system, you experience maximum control and dynamic performance on every drive.

Whether for long-distance performance, sporty driving on winding roads, or maximum comfort in everyday life – the X3 M40 adapts perfectly to your needs. With 360 horsepower, precise suspension tuning, and innovative safety features, you enjoy driving pleasure at the highest level.

Discover the BMW X3 M40 now with AutoLuxe – where M Performance meets everyday luxury.',
   'The BMW X3 M40 combines M Performance dynamics with luxurious equipment, delivering an exceptional driving experience. Its 3.0-liter inline six-cylinder engine with TwinPower Turbo technology produces 360 horsepower (265 kW) and a maximum torque of 500 Nm, available between 1,520 and 4,800 rpm.

The 8-speed automatic transmission enables precise and fast gear changes, while the intelligent BMW xDrive all-wheel-drive system ensures optimal traction and stability on any surface.

The Adaptive M suspension automatically adjusts to the driving situation, combining sporty handling with a high level of driving comfort. The M Sport braking system guarantees maximum stopping power during sporty driving, while the 19-inch M light-alloy wheels provide a distinctive design and optimized road grip.',
   'The BMW X3 M40 meets the highest safety standards and has been awarded a 5-star rating in the Euro NCAP crash test. A wide range of intelligent driver assistance systems ensures maximum safety on every journey.

The comprehensive safety concept includes the latest technologies, such as active lane-keeping assistance, forward collision and impact warning systems, as well as emergency braking assistants that support the driver in critical situations.

Thanks to these innovative assistance systems, the X3 M40 is not only a powerful performer but also a reliable companion for everyday driving.',
   'The BMW X3 M40 impresses with outstanding performance that sets new standards in the M Performance class. Acceleration from 0 to 100 km/h in just 4.8 seconds delivers pure sports car feeling, while the electronically limited top speed of 250 km/h guarantees confident performance on the highway.'),
  (3, 'DEMO-1002', '3 Series', 'BMW', '3ER', 2025, 'luxury', 5, 4, 'automatic', 'petrol', 150.00,
   'https://img.sixt.com/2800/c5a6dbe6-7652-41ff-985c-e27313f9ba8c.jpg', 'Erfurt, Frankfurt, Hamburg, Munich, Berlin',
   'The BMW 3 Series combines elegant aesthetics with powerful performance. As a sporty mid-size sedan, it is the perfect choice for drivers who value driving dynamics and comfort. With its advanced engines and innovative technologies, the BMW 3 Series delivers an outstanding driving experience and sets new standards in its class.',
   'The BMW 3 Series stands out with its intuitive technology and modern design. At the center is the large 10.25-inch infotainment display, which allows easy control of all vehicle systems. In addition, the vehicle offers a variety of useful features: for example, you can charge your mobile device wirelessly or open the trunk with a touchless foot gesture. With these innovative features, the BMW 3 Series combines user-friendliness and comfort at the highest level, making it an excellent choice in the mid-size sedan segment.',
   'With the BMW 3 Series, both driver and passengers are always optimally protected. The vehicle is equipped with the latest safety and prevention technologies and has received a 5-star safety rating from Euro NCAP. In addition, features such as lane-keeping assist, blind spot warning, and the driver alert system ensure maximum safety while driving. These advanced safety systems ensure that the BMW 3 Series meets the highest standards in safety and protection, making it a reliable companion on every journey.',
   'The BMW 3 Series features a powerful engine with an output of up to 275 kW (374 hp). With this engine, the vehicle accelerates from 0 to 100 km/h in just 4.4 seconds. Its top speed is 250 km/h, offering outstanding performance on both highways and country roads.'),
  (4, 'DEMO-2002', NULL, 'Audi', 'A3', 2025, 'luxury', 5, 4, 'automatic', 'petrol', 140.00,
   'https://img.sixt.com/2800/c9958fb7-1616-4a2b-be64-74eb601dbe61.jpg', 'Erfurt, Hamburg, Frankfurt, Munich, Berlin',
   'Audi A3 2025

The Audi A3 2025 combines elegant design, advanced technology, and dynamic performance in a compact luxury sedan. With its refined interior, cutting-edge infotainment system, and efficient yet powerful engine options, the Audi A3 delivers an exceptional driving experience. Whether in city traffic or on long highway journeys, it offers the perfect balance of comfort, agility, and modern innovation.',
   'The Audi A3 impresses with its innovative technology and modern design. At the center is the high-resolution Audi Virtual Cockpit with a 10.25-inch infotainment display, allowing intuitive control of all vehicle systems.

In addition, the vehicle offers numerous practical features: your mobile device can be charged wirelessly using the integrated wireless charging tray, and the trunk can be conveniently opened with a touchless foot gesture.

These innovative features guarantee the highest level of comfort and user-friendliness, making the Audi A3 an outstanding choice in its segment.',
   'The Audi A3 impresses with its innovative technology and modern design. At the center is the high-resolution Audi Virtual Cockpit with a 10.25-inch infotainment display, allowing intuitive control of all vehicle systems.

In addition, the vehicle offers numerous practical features: your mobile device can be charged wirelessly using the integrated wireless charging tray, and the trunk can be conveniently opened with a touchless foot gesture.

These innovative features guarantee the highest level of comfort and user-friendliness, making the Audi A3 an outstanding choice in its segment.',
   'The Audi A3 features a powerful engine with an output of up to 225 kW (306 hp). With this engine, the vehicle accelerates from 0 to 100 km/h in an impressive 4.8 seconds. Its top speed is 250 km/h, giving the vehicle outstanding performance on both highways and country roads.'),
  (5, 'DEMO-1013', 'A6 E-Tron', 'Audi', 'A6 E-Tron', 2025, 'luxury', 5, 5, 'automatic', 'electric', 260.00,
   'https://img.sixt.com/2800/bce9f85e-57ce-4959-9b62-19a7e0d7294b.png', 'Frankfurt, Erfurt, Hamburg, Munich, Berlin',
   'Audi A6 e-tron

The Audi A6 e-tron is the perfect choice for those who want to combine forward-thinking technology with sustainable mobility. With its fully electric drivetrain, it offers emission-free driving and an impressive driving range. Its elegant design and high-quality interior ensure a premium driving experience.

With the Audi A6 e-tron from AutoLuxe, you enjoy maximum flexibility without long-term commitment. Thanks to the all-inclusive package that covers maintenance and safety, you can drive completely worry-free. The perfect Audi for demanding drivers – simple, flexible, and premium with AutoLuxe.',
   'The Audi A6 e-tron is built on the innovative Premium Platform Electric (PPE) and impresses with outstanding aerodynamics: the drag coefficient is 0.21 for the Sportback and 0.24 for the Avant – ensuring optimal airflow and maximizing driving range. With a range of up to 756 km, the A6 e-tron proves to be exceptionally efficient and long-lasting.

A true highlight is the 800-volt electrical architecture, which enables ultra-fast charging. In just 21 minutes, the battery can be charged from 10% to 80% – ideal for drivers who want to stay on the move without losing time. This advanced technology makes the Audi A6 e-tron a reliable companion for both everyday driving and long journeys.',
   'Safety is a top priority in the Audi A6 e-tron. It’s no surprise that in 2025 it received the highest rating of five stars from Euro NCAP. The protection scores are particularly impressive: adult occupants are protected at 92%, while children are equally well protected at 91%. Vulnerable road users receive a protection score of 75%, and safety assistance systems achieve an impressive 80%.

With the latest driver assistance systems, the A6 e-tron delivers safety at the highest level—ideal for those who don’t want to compromise, even when choosing electric mobility.',
   'The Audi A6 e-tron represents both driving pleasure and efficiency. With its rear-wheel drive and 210 kW of power (240 kW with Launch Control), the Audi A6 e-tron accelerates from 0 to 100 km/h in 6 seconds and reaches a top speed of 210 km/h.

The perfect Audi for those who appreciate uncompromising performance while also benefiting from the advantages of electric mobility.'),
  (6, 'DEMO-1014', 'CLE', 'Mercedes-Benz', 'CLE', 2025, 'sports', 4, 2, 'automatic', 'petrol', 440.00,
   'https://img.sixt.com/2800/2a352fec-1b42-482e-b97c-c31dfc951a86.png', 'Erfurt, Frankfurt, Hamburg, Berlin, Munich',
   'Mercedes-Benz CLE Cabriolet

The Mercedes-Benz CLE Cabriolet combines sporty elegance with an open-top driving experience and premium comfort. This modern grand tourer impresses with timeless design, a high-quality acoustic soft top, and innovative technology. The fully automatic roof can be opened and closed with ease, while the premium interior ensures a comfortable atmosphere even when driving with the top down.

With powerful mild-hybrid powertrains, the latest driver assistance systems, and the intuitive MBUX infotainment system, the CLE Cabriolet combines driving dynamics and luxury at the highest level. All engine variants feature 48V mild-hybrid technology for improved efficiency and performance.',
   'As standard, the CLE Cabriolet features the MBUX infotainment system, a digital driver display, and a fully automatic acoustic soft top. Optional features include a head-up display, a Burmester 3D surround sound system with 17 speakers and 660 watts, and the DYNAMIC BODY CONTROL suspension with adjustable damping.

The comfort suspension, lowered by 15 mm, ensures a dynamic road presence. Sport seats, the parking package with a 360° camera, and extendable sun visors with LED vanity mirrors are among the equipment highlights.',
   'The CLE Cabriolet offers comprehensive safety technology with Intelligent Drive assistance systems. The parking package with a rearview camera and the optional 360° camera with a virtual bird’s-eye view help when maneuvering.

Active assistance systems such as the emergency braking assistant, lane-keeping assist, and blind spot monitoring ensure the highest level of safety. The robust body structure with multiple airbags provides maximum occupant protection in all driving situations.',
   'The 2025 Mercedes-Benz CLE Cabriolet delivers an impressive balance of performance and efficiency. Powered by advanced turbocharged engines with 48V mild-hybrid technology, it provides smooth acceleration and enhanced driving dynamics. Depending on the model, the CLE Cabriolet produces up to 280 kW (381 hp), allowing it to accelerate from 0 to 100 km/h in approximately 4.4 seconds.

With a top speed electronically limited to 250 km/h, the CLE Cabriolet offers confident performance on both highways and scenic roads. Its refined suspension and rear-wheel-drive dynamics ensure a sporty yet comfortable driving experience, making every open-top journey both thrilling and effortless.'),
  (7, 'DEMO-2003', NULL, 'Mercedes', 'E-Class', 2025, 'luxury', 5, 4, 'automatic', 'petrol', 290.00,
   'https://img.sixt.com/2800/faf37291-6d96-4ea2-b452-b0efe4a1bfa4.png', 'Erfurt, Frankfurt, Hamburg, Berlin, Munich',
   'Mercedes-Benz E-Class

The Mercedes-Benz E-Class is an elegant business sedan that combines comfort, technology, and performance. It stands out with its timeless design, high-quality materials, and the latest driver assistance systems. The spacious interior offers excellent seating comfort for both driver and passengers.

With its balanced driving dynamics, innovative infotainment systems, and extensive safety features, the E-Class is ideal for comfortable long-distance travel. It represents German engineering at the highest level.',
   'The E-Class features the MBUX infotainment system with large touchscreens and voice control “Hey Mercedes.” The digital cockpit offers individually configurable displays. As standard, it includes LED headlights, a navigation system, and smartphone integration.',
   'Mercedes relies on comprehensive safety technology with Intelligent Drive assistance systems. PRE-SAFE systems prepare preventive protective measures in the event of an imminent collision. Emergency braking assist, lane-keeping assist, blind spot monitoring, and adaptive cruise control are available.

The robust body structure with an airbag system and active safety technologies ensures maximum occupant protection in all driving situations.',
   'The Mercedes-Benz E-Class delivers a refined balance of power, efficiency, and driving comfort. Equipped with advanced turbocharged engines and modern hybrid technology, it offers smooth acceleration and impressive efficiency. Depending on the model, the E-Class produces up to 270 kW (367 hp), enabling acceleration from 0 to 100 km/h in around 4.5 seconds.

With a top speed electronically limited to 250 km/h, the E-Class provides confident performance on both highways and long-distance journeys. Its advanced suspension system ensures a comfortable yet dynamic driving experience, making it the perfect luxury sedan for everyday driving and business travel.'),
  (8, 'DEMO-2004', NULL, 'Porsche', '911 Cabrio', 2024, 'luxury', 4, 2, 'automatic', 'petrol', 650.00,
   'https://img.sixt.com/1200/2fce94e8-1824-4b26-83b5-e2720afa5797.jpg', 'Erfurt, Frankfurt, Hamburg, Munich, Berlin',
   'The 2024 Porsche 911 Cabriolet combines iconic design with open-top driving excitement. This luxury sports car delivers an unforgettable driving experience with its powerful engine, precise handling, and premium interior. The soft-top roof opens in seconds, allowing drivers to enjoy the thrill of the road and fresh air while maintaining Porsche’s legendary performance and comfort. Perfect for both city cruising and high-performance driving, the 911 Cabriolet represents the ultimate balance of elegance, technology, and speed from AutoLuxe.',
   'Engine: 3.0L Twin-Turbocharged Flat-6
Transmission: 8-Speed PDK Automatic
Drivetrain: Rear-Wheel Drive / All-Wheel Drive (depending on model)
Horsepower: Up to 443 HP
Torque: 530 Nm
Top Speed: Up to 306 km/h
Fuel Type: Petrol
Seats: 4
Convertible Roof: Fully automatic soft-top
Infotainment: Porsche Communication Management (PCM) with navigation and smartphone integration',
   'Advanced Driver Assistance Systems
Adaptive Cruise Control
Lane Keep Assist
Porsche Stability Management (PSM)
Front and Side Airbags
Rear Parking Sensors and Camera
Automatic Emergency Braking
Blind Spot Monitoring
High-performance braking system for maximum safety and control',
   'The Porsche 911 Cabriolet 2024 offers exceptional performance with a 0-100 km/h acceleration in approximately 3.5–4.5 seconds depending on the model variant. Its twin-turbo flat-six engine delivers instant power, while the advanced suspension and precise steering provide outstanding control and stability at high speeds. The lightweight design, aerodynamic body, and Porsche engineering ensure an exhilarating yet refined driving experience every time you drive with AutoLuxe.'),
  (9, 'DEMO-2005', NULL, 'Bugatti', 'Chiron', 2025, 'sports', 2, 2, 'automatic', 'petrol', 10000.00,
   'https://techsolution.sfo3.cdn.digitaloceanspaces.com/demo/vehicles/LargeImages/1700128799-Bugatti%20Chiron%2001.webp', 'Frankfurt, Munich, Berlin',
   'The 2025 Bugatti Chiron represents the pinnacle of luxury hypercar engineering. Designed with exceptional craftsmanship and extreme performance in mind, the Chiron combines breathtaking speed with unmatched elegance. Its aerodynamic body, handcrafted interior, and cutting-edge technology make it one of the most exclusive and powerful vehicles in the world. Built for those who demand perfection, the Bugatti Chiron delivers an extraordinary driving experience with ultimate comfort and prestige.',
   'Engine: 8.0L Quad-Turbocharged W16
Transmission: 7-Speed Dual-Clutch Automatic
Drivetrain: All-Wheel Drive (AWD)
Horsepower: 1,500 HP
Torque: 1,600 Nm
Top Speed: Up to 420 km/h (electronically limited)
Acceleration (0–100 km/h): 2.4 seconds
Fuel Type: Petrol
Seating Capacity: 2
Body Type: Hyper Sports Coupe
Braking System: Carbon Ceramic Brakes',
   'Advanced Stability Control System
High-performance Carbon Ceramic Brakes
Multiple Airbag System
Traction Control System
Adaptive Suspension for maximum stability
Electronic Stability Program (ESP)
Rear View Camera and Parking Sensors
Advanced Tire Pressure Monitoring System
High-strength carbon fiber chassis for maximum safety',
   'The Bugatti Chiron 2025 delivers extraordinary hypercar performance powered by its iconic quad-turbocharged W16 engine producing 1,500 horsepower. With lightning-fast acceleration from 0 to 100 km/h in just 2.4 seconds and a top speed limited to 420 km/h, the Chiron is engineered for ultimate speed and precision. Its advanced aerodynamics, all-wheel-drive system, and cutting-edge suspension ensure maximum stability, control, and driving excitement at extreme speeds.')
), seeded_matches AS (
  -- Shared cars retain their existing primary keys and booking references.
  SELECT car.id, source.plate
  FROM cars AS car
  JOIN catalog AS source ON car.plate_number = source.plate
   AND car.brand = source.brand AND car.model IN (source.original_seed_model, source.model)
  WHERE source.original_seed_model IS NOT NULL
), refreshed AS (
  UPDATE cars AS car
  SET model = source.model,
      production_year = source.production_year,
      category = source.category,
      seats = source.seats,
      doors = source.doors,
      transmission = source.transmission,
      fuel_type = source.fuel_type,
      daily_price = source.daily_price,
      image_url = CASE WHEN NULLIF(BTRIM(car.image_url), '') IS NULL THEN source.image_url ELSE car.image_url END,
      available_branches = source.available_branches,
      description = source.description,
      technical_specifications = source.technical_specifications,
      safety_features = source.safety_features,
      performance_info = source.performance_info,
      demo_display_order = source.display_order
  FROM seeded_matches AS matched
  JOIN catalog AS source ON source.plate = matched.plate
  WHERE car.id = matched.id AND car.demo_display_order IS NULL
)
INSERT INTO cars (
  plate_number, brand, model, production_year, category, seats, doors, transmission, fuel_type,
  daily_price, image_url, available_branches, description, technical_specifications,
  safety_features, performance_info, demo_display_order
)
SELECT source.plate, source.brand, source.model, source.production_year, source.category, source.seats,
       source.doors, source.transmission, source.fuel_type, source.daily_price, source.image_url,
       source.available_branches, source.description, source.technical_specifications,
       source.safety_features, source.performance_info, source.display_order
FROM catalog AS source
WHERE source.original_seed_model IS NULL
  AND EXISTS (SELECT 1 FROM seeded_matches)
  AND NOT EXISTS (SELECT 1 FROM cars WHERE plate_number = source.plate)
ORDER BY source.display_order
ON CONFLICT (plate_number) DO NOTHING;
