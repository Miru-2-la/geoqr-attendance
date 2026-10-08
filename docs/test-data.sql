-- =====================================================================
-- GeoQR Attend: Test Data Script
-- Database : geo_attendance
-- Purpose  : Prepare a repeatable data set for testing analytics and reports.
-- Note     : For a LOCAL test database only. Demo students (ids 3 and 4) are added if missing
-- =====================================================================

USE geo_attendance;

-- ---------------------------------------------------------------------
-- Step 1: Confirm the seeded users.
-- Expected: id 1 = ADMIN, ids 2 to 4 = STUDENT
-- ---------------------------------------------------------------------
SELECT id, name, email, role FROM users ORDER BY id;
-- ---------------------------------------------------------------------
-- Step 1b: Ensure the demo students exist (ids 3 and 4).
-- INSERT IGNORE skips a row if the id or email already exists.
-- Passwords are the documented demo credentials, not real ones.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO users (id, name, email, password, role, roll_number, created_at)
VALUES
  (3, 'Priya Sharma', 'priya@geoqr.com', 'student123', 'STUDENT', 'CS2024002', NOW()),
  (4, 'Rahul Verma',  'rahul@geoqr.com', 'student123', 'STUDENT', 'CS2024003', NOW());
-- ---------------------------------------------------------------------
-- Step 2: Reset attendance and events (event 1 is kept).
-- ---------------------------------------------------------------------
DELETE FROM attendance WHERE id > 0;
DELETE FROM events WHERE id > 1;
ALTER TABLE attendance AUTO_INCREMENT = 1;
ALTER TABLE events AUTO_INCREMENT = 2;
UPDATE events SET event_date = CURDATE() WHERE id = 1;

-- ---------------------------------------------------------------------
-- Step 3: Insert four past events (ids 2 to 5), created by the admin (id 1).
-- ---------------------------------------------------------------------
INSERT INTO events
  (title, description, latitude, longitude, radius_meters,
   event_date, start_time, end_time, created_by, created_at)
VALUES
  ('Web Development', 'Introduction to web technologies',
   12.9716, 77.5946, 50, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:00:00', 1, NOW()),
  ('Database Systems', 'SQL queries and joins',
   12.9716, 77.5946, 50, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '10:00:00', '11:00:00', 1, NOW()),
  ('Object-Oriented Programming', 'Inheritance and polymorphism',
   12.9716, 77.5946, 50, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:00:00', '11:00:00', 1, NOW()),
  ('Data Structures', 'Trees and graphs',
   12.9716, 77.5946, 50, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '10:00:00', '11:00:00', 1, NOW());

-- ---------------------------------------------------------------------
-- Step 4: Insert sample attendance records.
-- Student 2 attends 4 of 5 events (80%), student 3 attends 3 of 5 (60%),
-- student 4 attends 1 of 5 (20%). Event 1 is intentionally left empty so
-- that a live scan can still be demonstrated.
-- Student coordinates differ from the event only in latitude, so each
-- distance equals 111194.93 m per degree multiplied by the latitude offset.
-- ---------------------------------------------------------------------
INSERT INTO attendance
  (event_id, student_id, device_id, student_lat, student_long,
   distance_meters, status, `timestamp`)
VALUES
  -- Event 2 (1 day ago): students 2, 3, 4
  (2, 2, 'sample-device-2', 12.9717, 77.5946, 11.12, 'PRESENT', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:05:00')),
  (2, 3, 'sample-device-3', 12.9718, 77.5946, 22.24, 'PRESENT', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:06:00')),
  (2, 4, 'sample-device-4', 12.9719, 77.5946, 33.36, 'PRESENT', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:07:00')),
  -- Event 3 (2 days ago): students 2, 3
  (3, 2, 'sample-device-2', 12.9717, 77.5946, 11.12, 'PRESENT', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '10:04:00')),
  (3, 3, 'sample-device-3', 12.9720, 77.5946, 44.48, 'PRESENT', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '10:08:00')),
  -- Event 4 (3 days ago): students 2, 3
  (4, 2, 'sample-device-2', 12.9718, 77.5946, 22.24, 'PRESENT', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:03:00')),
  (4, 3, 'sample-device-3', 12.9717, 77.5946, 11.12, 'PRESENT', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:09:00')),
  -- Event 5 (4 days ago): student 2
  (5, 2, 'sample-device-2', 12.9719, 77.5946, 33.36, 'PRESENT', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '10:02:00'));

-- ---------------------------------------------------------------------
-- Verification queries
-- ---------------------------------------------------------------------

-- Expected: 5
SELECT COUNT(*) AS total_events FROM events;

-- Expected: 8
SELECT COUNT(*) AS total_attendance FROM attendance;

-- Attendance percentage per student.
-- Expected: Rahul Verma 20.00, Priya Sharma 60.00, Arun Kumar 80.00
SELECT u.id, u.name, u.roll_number,
       COUNT(DISTINCT a.event_id) AS events_attended,
       (SELECT COUNT(*) FROM events) AS total_events,
       ROUND(COUNT(DISTINCT a.event_id) * 100.0 / (SELECT COUNT(*) FROM events), 2) AS attendance_percentage
FROM users u
LEFT JOIN attendance a ON u.id = a.student_id
WHERE u.role = 'STUDENT'
GROUP BY u.id, u.name, u.roll_number
ORDER BY attendance_percentage ASC;

-- Attendance per event date.
-- Expected counts, oldest date first: 1, 2, 2, 3, 0
SELECT e.event_date, COUNT(a.id) AS attendance_count
FROM events e
LEFT JOIN attendance a ON e.id = a.event_id
GROUP BY e.event_date
ORDER BY e.event_date ASC;