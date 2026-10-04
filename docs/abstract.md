# GeoQR Attend: QR-Based Geo-Tagged Attendance Management System

## Project Title
**GeoQR Attend: Secure Location-Based Attendance Management System**

## Abstract
Traditional attendance systems rely on manual roll calls, signature
sheets, or basic digital check-ins. These methods are time-consuming,
prone to human error, and highly vulnerable to proxy attendance, where
one student marks attendance on behalf of another.

This project proposes a QR-Based Geo-Tagged Attendance Management
System that combines three layers of verification to protect
attendance integrity:

1. **QR Code Verification:** Each event generates a unique QR code
   containing the event identifier. Students must scan this code to
   start the attendance process.

2. **Geographical Verification:** Using the Haversine formula, the
   system calculates the distance between the student's GPS
   coordinates and the event location. If the distance exceeds the
   event's allowed radius (default: 50 meters), attendance is rejected
   with a `LocationMismatchException`.

3. **Device Fingerprinting:** Each browser generates a unique device
   identifier stored in local storage. If the same device is used to
   mark attendance for the same event under a different student
   account, the system detects proxy attendance and throws a
   `ProxyAttendanceException`.

The system is built with **Java Spring Boot** for the backend,
**MySQL** for data storage, and **HTML/CSS/JavaScript** for the
frontend. It includes an admin dashboard with attendance analytics,
identification of at-risk students (below 75% attendance), an
attendance trend chart, and downloadable CSV/PDF reports.

**Keywords:** QR Code, Geo-fencing, Haversine Formula, Proxy Detection,
Device Fingerprinting, Attendance Management, Spring Boot, MySQL