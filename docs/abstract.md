# GeoQR Attend

### QR-Based Geo-Tagged Attendance Management System

**Course:** CSC, Second Year (4 Credits)

---

## Abstract

Traditional attendance methods such as roll calls and signature sheets are time-consuming and vulnerable to proxy attendance, in which one student marks presence on behalf of another. This project presents GeoQR Attend, an attendance management system that verifies attendance through three independent layers. First, each event is assigned a unique identifier that is encoded in a QR code. Second, the Haversine formula computes the distance between the student's submitted coordinates and the event location, and attendance is rejected when this distance exceeds the permitted radius of 50 meters. Third, device fingerprinting binds a unique device identifier to each attendance record, so that the same device cannot be used for more than one student at the same event. The backend is implemented in Spring Boot with a MySQL database, and the client is a JavaFX desktop application. An administrator dashboard provides analytics, identification of students with attendance below 75%, and downloadable reports.

**Keywords:** QR Code, Geo-fencing, Haversine Formula, Device Fingerprinting, Attendance Management, Spring Boot, JavaFX, MySQL

---

## System at a Glance

| Aspect | Description |
|--------|-------------|
| **Verification Layer 1** | QR code identifies the attendance event |
| **Verification Layer 2** | Haversine geo-fence with a default radius of 50 meters |
| **Verification Layer 3** | Device fingerprinting detects proxy attendance |
| **Backend** | Java Spring Boot REST API |
| **Database** | MySQL |
| **Client** | JavaFX desktop application |
| **Analytics** | At-risk identification (below 75%), attendance trend, CSV and PDF reports |