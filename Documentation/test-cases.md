# Test Cases

### GeoQR Attend: QR-Based Geo-Tagged Attendance Management System

**Target system:** live backend at `http://localhost:8080` (Spring Boot and MySQL)
**Test method:** requests are sent to the REST API by the script `run-tests.ps1`, which records a PASS or FAIL for each automated case. Cases that need the client application are marked Manual.

---

## 1. Purpose

This document lists 25 test cases that cover authentication, event creation, QR code handling, location verification, proxy detection, analytics, and reports. Expected results were derived from the backend source code (`AuthService`, `AttendanceService`, `GlobalExceptionHandler`), and the distances were calculated independently with the Haversine formula. The Actual result and Status columns are completed only after a case has been run.

---

## 2. Test Environment and Preconditions

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8080` |
| Administrator | `admin@geoqr.com` (ID 1) |
| Student 2 | `student@geoqr.com` |
| Students 3 and 4 | `priya@geoqr.com` and `rahul@geoqr.com`, created by the script in Section 3 |
| Event 1 | "Data Science Lecture", latitude 12.9716, longitude 77.5946, radius 50 m |
| Events 2 to 5 | Past events created by `test-data.sql`, with the same location and radius |

**The tests are stateful.** Attendance records persist in MySQL, and a student can mark each event only once. The order of the cases below is therefore fixed, and the database must be reset by running `test-data.sql` before every run.

**Order of checks in `AttendanceService`.** This decides which error a request receives.

| Order | Check | Error code |
|:-----:|-------|------------|
| 1 | The event exists | `NOT_FOUND` |
| 2 | The student has not already marked attendance | `PROXY_ATTENDANCE` |
| 3 | The distance is within the event radius | `LOCATION_MISMATCH` |
| 4 | The device has not been used for this event | `PROXY_ATTENDANCE` |
| 5 | All checks passed | `SUCCESS` |

Because check 2 runs before check 3, a student who has already marked attendance receives `PROXY_ATTENDANCE` even when submitting from a distant location. Test cases TC-12 to TC-14 therefore use student 3, who never marks attendance during the run.

---

## 3. How to Run

1. Start the backend from IntelliJ.
2. In MySQL Workbench, run `Documentation/test-data.sql`. This resets attendance and events 2 and above.
3. Make sure students 3 and 4 exist as users (one-time step). Run this in Workbench:

```sql
USE geo_attendance;

INSERT IGNORE INTO users (id, name, email, password, role, roll_number, admin_code, created_at)
SELECT 3, 'Priya Sharma', 'priya@geoqr.com', password, role, 'CSE-003', admin_code, NOW()
FROM users WHERE id = 2;

INSERT IGNORE INTO users (id, name, email, password, role, roll_number, admin_code, created_at)
SELECT 4, 'Rahul Verma', 'rahul@geoqr.com', password, role, 'CSE-004', admin_code, NOW()
FROM users WHERE id = 2;

SELECT id, name, email, role FROM users ORDER BY id;
```

4. In the VS Code terminal, run:

```
powershell -ExecutionPolicy Bypass -File Documentation\run-tests.ps1
```

5. Copy the Actual and Status values from the printed table into the tables below.
6. Perform the Manual case in the client application and record the result.

---

## 4. Haversine Reference Values

Calculated independently with R = 6,371,000 m for points that start at the event location (12.9716, 77.5946).

| Student position | Distance | Radius | Outcome |
|------------------|:--------:|:------:|---------|
| 12.97160, 77.5946 | 0.00 m | 50 m | Inside |
| 12.97200, 77.5946 | 44.48 m | 50 m | Inside |
| 12.97210, 77.5946 | 55.60 m | 50 m | Outside |
| 12.97610, 77.5946 | 500.38 m | 50 m | Outside |
| 12.97160, 77.5996 | 541.79 m | 50 m | Outside |
| (0, 0) to (1, 0), sanity check | 111,194.93 m | not applicable | Equals R multiplied by pi over 180 |

---

## 5. Test Cases

### 5.1 Authentication

| ID | Scenario | Input | Expected result | Actual result | Status |
|----|----------|-------|-----------------|---------------|--------|
| TC-01 | Valid administrator login | `POST /api/auth/login`, administrator credentials, role ADMIN | HTTP 200, status `SUCCESS`, a token, user role `ADMIN` | | PASS |
| TC-02 | Valid student login | `POST /api/auth/login`, student credentials, role STUDENT | HTTP 200, status `SUCCESS`, a token, user role `STUDENT` | | PASS |
| TC-03 | Wrong password | Administrator email with an incorrect password | HTTP 404, `NOT_FOUND` | | PASS |
| TC-04 | Correct credentials, wrong role | Administrator credentials with role STUDENT | HTTP 404, `NOT_FOUND` | | PASS |

### 5.2 Event Creation

| ID | Scenario | Input | Expected result | Actual result | Status |
|----|----------|-------|-----------------|---------------|--------|
| TC-05 | Create an event with valid data | `POST /api/events` with title, location, radius 50, date and times | HTTP 200 or 201, status `SUCCESS`, the new event identifier | | PASS |
| TC-06 | Retrieve the created event | `GET /api/events/{id}` for the new event | HTTP 200, the title matches the one submitted | | PASS |
| TC-07 | List all events | `GET /api/events` | HTTP 200, the list contains event 1 and the new event | | PASS |

### 5.3 QR Code Generation and Validation

| ID | Scenario | Input | Expected result | Actual result | Status |
|----|----------|-------|-----------------|---------------|--------|
| TC-08 | QR code is generated for a new event (Manual) | Create an event in the client application | A QR code is displayed, and its content is the event identifier | | Not run |
| TC-09 | QR code with an unknown event identifier | `POST /api/scan` with event 99999 | HTTP 404, `NOT_FOUND`, message "Invalid QR code - Event not found" | | PASS |

### 5.4 Location Verification (radius 50 m)

| ID | Scenario | Input | Expected result | Actual result | Status |
|----|----------|-------|-----------------|---------------|--------|
| TC-10 | Valid scan at the event location | Student 2, device `dev-A`, 0 m from event 1 | HTTP 200, attendance status `PRESENT`, distance 0 m | | PASS |
| TC-11 | Boundary: inside the radius | Student 4, device `dev-C`, 44.48 m from event 1 | HTTP 200, `PRESENT`, distance about 44.48 m | | PASS |
| TC-12 | Boundary: outside the radius | Student 3, device `dev-B`, 55.60 m from event 1 | HTTP 400, `LOCATION_MISMATCH` | | PASS |
| TC-13 | Far away (north) | Student 3, device `dev-B`, 500.38 m from event 1 | HTTP 400, `LOCATION_MISMATCH`, message states 500 m away | | PASS |
| TC-14 | Far away (east, longitude only) | Student 3, device `dev-B`, 541.79 m from event 1 | HTTP 400, `LOCATION_MISMATCH` | | PASS |

### 5.5 Proxy and Duplicate Detection

| ID | Scenario | Input | Expected result | Actual result | Status |
|----|----------|-------|-----------------|---------------|--------|
| TC-15 | Same device, different student | Student 3 at the event location, device `dev-A` (already used by student 2) | HTTP 400, `PROXY_ATTENDANCE`, message begins "Proxy detected" | | PASS |
| TC-16 | Same student scans twice | Student 2 at the event location, new device `dev-X` | HTTP 400, `PROXY_ATTENDANCE`, message states attendance is already marked | | PASS |
| TC-17 | Duplicate check precedes the location check | Student 2, 500 m away, new device `dev-Y` | HTTP 400, `PROXY_ATTENDANCE` (not `LOCATION_MISMATCH`) | | PASS |
| TC-18 | Device reuse at a different event is allowed | Student 4 at event 3, device `dev-A` (used only at event 1) | HTTP 200, `PRESENT` | | PASS |

### 5.6 Analytics

| ID | Scenario | Input | Expected result | Actual result | Status |
|----|----------|-------|-----------------|---------------|--------|
| TC-19 | At-risk students are identified | `GET /api/analytics/at-risk` after TC-10 to TC-18 | HTTP 200, the list contains students 3 and 4 and does not contain student 2 | | PASS |
| TC-20 | Attendance trend | `GET /api/analytics/trend` | HTTP 200, at least five data points, each with a date and a count | | PASS |
| TC-21 | Attendance count for event 1 | `GET /api/attendance/count/1` | HTTP 200, count equals 2 (TC-10 and TC-11) | | PASS |

### 5.7 Reports

| ID | Scenario | Input | Expected result | Actual result | Status |
|----|----------|-------|-----------------|---------------|--------|
| TC-22 | CSV report download | `GET /api/reports/csv` | HTTP 200, content type `text/csv`, header row beginning `ID,Event ID` | | PASS |
| TC-23 | CSV report contains this run's records | `GET /api/reports/csv` | The text includes devices `dev-A` and `dev-C` | | PASS |
| TC-24 | PDF report endpoint responds | `GET /api/reports/pdf` | HTTP 200, content type `application/pdf` | | PASS |
| TC-25 | PDF report is a valid PDF file | `GET /api/reports/pdf` | The content begins with `%PDF` | | Not run |

| TC-25 | PDF report is a valid PDF file | `GET /api/reports/pdf` | The content begins with `%PDF` | The content is plain text and does not begin with `%PDF` (see Known Issue K-1) | Fail |

---

## 6. Summary

| Category | Total | Passed | Failed | Not run |
|----------|:-----:|:------:|:------:|:-------:|
| Authentication | 4 | 4 | 0 | 0 |
| Event creation | 3 | 3 | 0 | 0 |
| QR code generation and validation | 2 | 1 | 0 | 1 |
| Location verification | 5 | 5 | 0 | 0 |
| Proxy and duplicate detection | 4 | 4 | 0 | 0 |
| Analytics | 3 | 3 | 0 | 0 |
| Reports | 4 | 3 | 1 | 0 |
| **Total** | **25** | **23** | **1** | **1** |

---

## 7. Exception to Response Mapping

All errors use one format: `{"status":"ERROR","message":"...","data":null,"errorCode":"..."}`.

| Exception | HTTP | Error code | Triggered by |
|-----------|:----:|------------|--------------|
| `LocationMismatchException` | 400 | `LOCATION_MISMATCH` | Distance greater than the event radius |
| `ProxyAttendanceException` | 400 | `PROXY_ATTENDANCE` | Duplicate student or reused device |
| `ResourceNotFoundException` | 404 | `NOT_FOUND` | Unknown event, failed login, wrong role |
| Any other `Exception` | 500 | `INTERNAL_ERROR` | Missing fields, database errors |

---

## 8. Known Issues

These were identified by reviewing the backend source and should be confirmed against the running system before presentation.

| ID | Severity | Finding | Suggested fix |
|----|----------|---------|---------------|
| K-1 | High | The PDF report is plain text sent with the content type `application/pdf`, so a PDF viewer cannot open it. | Generate the report with a PDF library such as OpenPDF and return bytes |
| K-2 | Medium | A duplicate scan by the same student returns `PROXY_ATTENDANCE`, the same code as a real proxy attempt. | Add a separate `ALREADY_MARKED` error code |
| K-3 | Medium | Missing request fields cause a `NullPointerException` and a generic HTTP 500 instead of a 400. | Add `@NotNull` to the `ScanRequest` fields and `@Valid` to the controller |
| K-4 | Low | A failed login returns 404 instead of 401. | Add an authentication exception mapped to 401 |
| K-5 | Low | The data seeder creates only the administrator and student 2, so students 3 and 4 exist only after the SQL step in Section 3. | Seed all students, or keep the SQL step |
| K-6 | Low | Passwords are stored and compared as plain text, and the login token is not verified on later requests. | Hash passwords with BCrypt and validate tokens |

---

## 9. Supporting Unit Test (Optional)

The Haversine implementation can also be verified without the database. Save the following as `src/test/java/com/geoqr/attendance/util/GeoUtilsTest.java` in the backend project and run `mvnw test`. This adds a new file only and does not change any existing code.

```java
package com.geoqr.attendance.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GeoUtilsTest {

    private static final double LAT = 12.9716, LON = 77.5946;

    @Test void samePointIsZero() {
        assertEquals(0.0, GeoUtils.getDistance(LAT, LON, LAT, LON), 0.001);
    }

    @Test void oneDegreeOfLatitudeIsAbout111km() {
        assertEquals(111194.93, GeoUtils.getDistance(0, 0, 1, 0), 1.0);
    }

    @Test void farPointIsAbout500m() {
        assertEquals(500.38, GeoUtils.getDistance(LAT, LON, 12.9761, LON), 0.5);
    }

    @Test void insideAndOutsideTheFence() {
        assertTrue(GeoUtils.getDistance(LAT, LON, 12.97200, LON) < 50);
        assertTrue(GeoUtils.getDistance(LAT, LON, 12.97210, LON) > 50);
    }

    @Test void distanceIsSymmetric() {
        double ab = GeoUtils.getDistance(LAT, LON, 12.9761, 77.6000);
        double ba = GeoUtils.getDistance(12.9761, 77.6000, LAT, LON);
        assertEquals(ab, ba, 1e-6);
    }
}
```