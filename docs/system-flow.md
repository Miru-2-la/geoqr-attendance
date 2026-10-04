# 🔄 System Flow: GeoQR Attend

This document explains how data moves through the system, step by step.

---

## 👥 Who Uses the System

| Role | What they do |
|------|--------------|
| 🧑‍🏫 **Admin** | Creates events, shows the QR code, views analytics, downloads reports |
| 🎓 **Student** | Logs in, scans the QR code, gets a success or error result |
| ⚙️ **Backend** | Validates every scan using 3 layers of security |

---

## 🧑‍🏫 Admin Flow

```
  Admin opens app
        │
        ▼
  Logs in (ADMIN role)
        │
        ▼
  Creates event (title, date, time, latitude, longitude, radius)
        │
        ▼
  Backend saves event, returns event ID
        │
        ▼
  Frontend generates QR code from the event ID
        │
        ▼
  Admin shows QR code to students
```

---

## 🎓 Student Flow

```
  Student opens app
        │
        ▼
  Logs in (STUDENT role)
        │
        ▼
  Opens scanner page, taps "Start Scanning"
        │
        ▼
  Scans the QR code  ──►  extracts the event ID
        │
        ▼
  Browser reads GPS location (latitude, longitude)
        │
        ▼
  Browser gets its device ID from localStorage
        │
        ▼
  Sends POST /api/scan to the backend
        │
        ▼
  Shows ✅ success or ❌ error message
```

---

## ⚙️ Backend Flow (The 3 Security Layers)

When the backend receives a scan, it runs these checks **in this exact order**:

```
  Receive POST /api/scan
        │
        ▼
  CHECK 1: Does the event exist?
        │── NO ──► ❌ ResourceNotFoundException  (NOT_FOUND)
        ▼ YES
  CHECK 2: Has this student already marked attendance?
        │── YES ─► ❌ ProxyAttendanceException   (PROXY_ATTENDANCE)
        ▼ NO
  CHECK 3: Is the student within the allowed radius? (Haversine)
        │── NO ──► ❌ LocationMismatchException  (LOCATION_MISMATCH)
        ▼ YES
  CHECK 4: Has this device already been used for this event?
        │── YES ─► ❌ ProxyAttendanceException   (PROXY_ATTENDANCE)
        ▼ NO
  ✅ Save attendance to the database
        │
        ▼
  Return success response to the frontend
```

---

## 🚨 Error Reference

| Situation | Exception | Error Code | HTTP Status |
|-----------|-----------|------------|-------------|
| Event ID does not exist | `ResourceNotFoundException` | `NOT_FOUND` | 404 |
| Student too far away | `LocationMismatchException` | `LOCATION_MISMATCH` | 400 |
| Same device, different student | `ProxyAttendanceException` | `PROXY_ATTENDANCE` | 400 |
| Same student scans twice | `ProxyAttendanceException` | `PROXY_ATTENDANCE` | 400 |
| Anything unexpected | `Exception` | `INTERNAL_ERROR` | 500 |

All errors come back in the same format:

```json
{
  "status": "ERROR",
  "message": "Human-readable explanation",
  "errorCode": "LOCATION_MISMATCH"
}
```

---

## 📦 The Scan Request (Frontend ➜ Backend)

```json
{
  "eventId": 1,
  "studentId": 2,
  "studentLat": 12.9716,
  "studentLong": 77.5946,
  "deviceId": "dev-abc123xyz456"
}
```

| Field | Meaning |
|-------|---------|
| `eventId` | Read from the QR code |
| `studentId` | From the logged-in user |
| `studentLat`, `studentLong` | Student's GPS position |
| `deviceId` | Random ID stored in the browser's localStorage |

---

## 🧩 System Layers

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| 🖥️ **Presentation** | HTML, CSS, JavaScript | Login, dashboard, scanner |
| ⚙️ **Application** | Spring Boot REST API | Validation and business logic |
| 🗄️ **Data** | MySQL | Stores users, events, attendance |