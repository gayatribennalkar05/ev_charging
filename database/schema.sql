-- ============================================
-- EV Charging Slot Booking System - MySQL Schema
-- Run this in phpMyAdmin or MySQL CLI
-- ============================================

CREATE DATABASE IF NOT EXISTS ev_charging;
USE ev_charging;

-- Drop tables if they exist (fresh start)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS stations;

-- ============================================
-- STATIONS TABLE
-- ============================================
CREATE TABLE stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  total_slots INT NOT NULL DEFAULT 4,
  charger_type VARCHAR(50) NOT NULL DEFAULT 'Type 2 AC',
  power_kw INT NOT NULL DEFAULT 22,
  price_per_hour DECIMAL(6,2) NOT NULL DEFAULT 50.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
);

-- ============================================
-- TIME SLOTS TABLE
-- ============================================
CREATE TABLE time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_slot (station_id, slot_date, start_time),
  INDEX idx_station_date (station_id, slot_date),
  INDEX idx_is_booked (is_booked)
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_token VARCHAR(64) NOT NULL UNIQUE,
  slot_id INT NOT NULL,
  station_id INT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(150) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL,
  user_ip VARCHAR(45) NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL,
  FOREIGN KEY (slot_id) REFERENCES time_slots(id),
  FOREIGN KEY (station_id) REFERENCES stations(id),
  INDEX idx_booking_token (booking_token),
  INDEX idx_user_ip_date (user_ip, slot_date),
  INDEX idx_status (status),
  INDEX idx_slot_date (slot_date)
);

-- ============================================
-- IP RATE LIMITING TABLE
-- ============================================
CREATE TABLE ip_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_window (window_start)
);

-- ============================================
-- SEED DATA - Stations
-- ============================================
INSERT INTO stations (name, location, total_slots, charger_type, power_kw, price_per_hour) VALUES
('Green Valley EV Hub',     'MG Road, Bangalore',       4, 'Type 2 AC',   22, 45.00),
('Tech Park Charging Point', 'Whitefield, Bangalore',   6, 'CCS DC Fast',  50, 80.00),
('Central Mall EV Station',  'Koramangala, Bangalore',  3, 'Type 2 AC',   22, 40.00),
('Airport EV Centre',        'Hebbal, Bangalore',       8, 'CHAdeMO DC',  62, 95.00),
('Eco Park Charger',         'Indiranagar, Bangalore',  4, 'Type 2 AC',   22, 50.00);

-- ============================================
-- STORED PROCEDURE: Generate slots for a date
-- ============================================
DELIMITER //
CREATE PROCEDURE generate_slots_for_date(IN target_date DATE)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE s_id INT;
  DECLARE s_slots INT;
  DECLARE cur CURSOR FOR SELECT id, total_slots FROM stations WHERE is_active = 1;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO s_id, s_slots;
    IF done THEN LEAVE read_loop; END IF;

    -- Generate hourly slots from 06:00 to 22:00
    INSERT IGNORE INTO time_slots (station_id, slot_date, start_time, end_time)
    VALUES
      (s_id, target_date, '06:00:00', '07:00:00'),
      (s_id, target_date, '07:00:00', '08:00:00'),
      (s_id, target_date, '08:00:00', '09:00:00'),
      (s_id, target_date, '09:00:00', '10:00:00'),
      (s_id, target_date, '10:00:00', '11:00:00'),
      (s_id, target_date, '11:00:00', '12:00:00'),
      (s_id, target_date, '12:00:00', '13:00:00'),
      (s_id, target_date, '13:00:00', '14:00:00'),
      (s_id, target_date, '14:00:00', '15:00:00'),
      (s_id, target_date, '15:00:00', '16:00:00'),
      (s_id, target_date, '16:00:00', '17:00:00'),
      (s_id, target_date, '17:00:00', '18:00:00'),
      (s_id, target_date, '18:00:00', '19:00:00'),
      (s_id, target_date, '19:00:00', '20:00:00'),
      (s_id, target_date, '20:00:00', '21:00:00'),
      (s_id, target_date, '21:00:00', '22:00:00');
  END LOOP;
  CLOSE cur;
END //
DELIMITER ;

-- Generate slots for the next 14 days
CALL generate_slots_for_date(CURDATE());
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 1 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 2 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 3 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 4 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 5 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 6 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 7 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 8 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 9 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 10 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 11 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 12 DAY));
CALL generate_slots_for_date(DATE_ADD(CURDATE(), INTERVAL 13 DAY));

SELECT 'Database setup complete!' AS message;
SELECT COUNT(*) AS total_slots_created FROM time_slots;
