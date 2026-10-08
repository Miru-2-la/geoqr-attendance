# System Flow

### GeoQR Attend: QR-Based Geo-Tagged Attendance Management System

This document describes how data moves through the system, from event creation to the stored attendance record.

---

## 1. System Actors

| Actor | Responsibilities |
|-------|------------------|
| **Administrator** | Creates events, provides the event QR code, views analytics, downloads reports |
| **Student** | Logs in, enters the event identifier, submits attendance, views the result |
| **Backend** | Validates each request through a sequence of security checks and stores valid attendance |

---

## 2. Administrator Flow

```
  Administrator opens the JavaFX client
                  |
                  v
  Logs in with the ADMIN role
                  |
                  v
  Creates an event
  (title, date, time, latitude, longitude, radius)
                  |
                  v
  Backend stores the event and returns the event identifier
                  |
                  v
  Client generates the QR code for the event
                  |
                  v
  Administrator displays the QR code to students
```

---

## 3. Student Flow

```
  Student opens the JavaFX client
                  |
                  v

  Logs in with the STUDENT role
                  |
                  v

  Enters the event identifier
                  |
                  v

  Client collects the student's coordinates
  and the device identifier
                  |
                  v

  Client sends POST /api/scan to the backend
                  |
                  v

  Client displays the success or error message
```

---

## 4. Backend Validation Flow

On receiving a scan request, the backend performs four checks in the following order.

```
  Receive POST /api/scan
          |
          v
          
  CHECK 1: Does the event exist?
          |-- No  --> ResourceNotFoundException   (NOT_FOUND)
          v  Yes

  CHECK 2: Has this student already marked attendance for the event?
          |-- Yes --> ProxyAttendanceException    (PROXY_ATTENDANCE)
          v  No

  CHECK 3: Is the distance within the event radius? (Haversine formula)
          |-- No  --> LocationMismatchException   (LOCATION_MISMATCH)
          v  Yes

  CHECK 4: Has this device already been used for this event?
          |-- Yes --> ProxyAttendanceException    (PROXY_ATTENDANCE)
          v  No

  Store the attendance record in the database
          |
          v
          
  Return the success response to the client
```

---

## 5. Error Reference

| Situation | Exception | Error Code | HTTP Status |
|-----------|-----------|------------|:-----------:|
| Event identifier does not exist | `ResourceNotFoundException` | `NOT_FOUND` | 404 |
| Student is outside the permitted radius | `LocationMismatchException` | `LOCATION_MISMATCH` | 400 |
| Same device used for a different student | `ProxyAttendanceException` | `PROXY_ATTENDANCE` | 400 |
| Same student submits twice | `ProxyAttendanceException` | `PROXY_ATTENDANCE` | 400 |
| Any unexpected failure | `Exception` | `INTERNAL_ERROR` | 500 |

Every error is returned in the same format:

```json
{
  "status": "ERROR",
  "message": "Description of the problem",
  "errorCode": "LOCATION_MISMATCH"
}
```

---

## 6. Scan Request (Client to Backend)

```json
{
  "eventId": 1,
  "studentId": 2,
  "studentLat": 12.9716,
  "studentLong": 77.5946,
  "deviceId": "example-device-id"
}
```

| Field | Description |
|-------|-------------|
| `eventId` | Identifier of the event, taken from the QR code or entered by the student |
| `studentId` | Identifier of the logged-in student |
| `studentLat`, `studentLong` | Coordinates submitted by the client |
| `deviceId` | Identifier that distinguishes the device in use |

---

## 7. System Layers

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Presentation** | JavaFX desktop application | Login, event management, attendance submission, dashboard |
| **Application** | Spring Boot REST API | Validation and business logic |
| **Data** | MySQL | Storage of users, events, and attendance records |