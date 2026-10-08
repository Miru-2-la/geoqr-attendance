# Review 2 Testing Checklist

### GeoQR Attend: Core Prototype Verification

**Review focus:** core working prototype, object-oriented design, database, API, and security logic.

**How to use this checklist.** Change `[ ]` to `[x]` only after the item has been observed working. Items marked **(client)** depend on the JavaFX client.

---

## 1. Test Environment

| Component | Detail |
|-----------|--------|
| Backend | Spring Boot REST API at `http://localhost:8080` |
| Database | MySQL, schema `geo_attendance` |
| Client | JavaFX desktop application |
| Demo event | Identifier 1, "Data Science Lecture", latitude 12.9716, longitude 77.5946, radius 50 meters |
| Demo accounts | One administrator (identifier 1) and three students (identifiers 2, 3, and 4) |

---

## 2. Authentication

- [ ] Administrator login succeeds with the role ADMIN
- [ ] Student login succeeds with the role STUDENT
- [ ] A wrong password is rejected with the message "Invalid email or password"
- [ ] A wrong role is rejected with the message "Invalid role selected"
- [ ] The client opens the administrator screen for ADMIN and the student screen for STUDENT (client)

---

## 3. Event Creation and QR Code

- [ ] An event can be created with title, date, time, latitude, longitude, and radius (client)
- [ ] The event is saved and its identifier is returned
- [ ] `GET /api/events` lists the new event
- [ ] A QR code carrying the event identifier is generated (client)

---

## 4. Attendance Submission

- [ ] The student provides the event identifier (client)
- [ ] The client sends the event identifier, student identifier, coordinates, and device identifier to `POST /api/scan` (client)
- [ ] A valid request returns `SUCCESS` and the record appears in the database
- [ ] `GET /api/attendance/recent` lists the new record
- [ ] The client displays a clear success message (client)

---

## 5. Location Verification

- [ ] A request within 50 meters is accepted
- [ ] A request about 500 meters away is rejected with `LOCATION_MISMATCH`
- [ ] The client displays the distance message returned by the backend (client)
- [ ] The distance calculation matches the values in `haversine-verification.md`

---

## 6. Custom Exceptions

- [ ] `LocationMismatchException` returns `LOCATION_MISMATCH` with HTTP status 400
- [ ] `ProxyAttendanceException` returns `PROXY_ATTENDANCE` with HTTP status 400 for a reused device
- [ ] `ProxyAttendanceException` returns `PROXY_ATTENDANCE` for a repeated student submission
- [ ] `ResourceNotFoundException` returns `NOT_FOUND` with HTTP status 404 for event 99999
- [ ] Every error uses the same structure: `status`, `message`, and `errorCode`

---

## 7. Object-Oriented Design and Database

- [ ] Inheritance: `Admin` and `Student` extend `User`
- [ ] Polymorphism: `CSVReportGenerator` and `PDFReportGenerator` implement `ReportGenerator`
- [ ] The three tables `users`, `events`, and `attendance` exist in MySQL
- [ ] Insert and select operations are demonstrated
- [ ] The composite index `idx_event_device` is present (`SHOW INDEX FROM attendance`)

---

## 8. Demonstration Sequence

The sequence below shows the complete attendance flow and every security check. The order matters because each step depends on the state left by the one before it.

| Step | Action | Expected Result |
|:----:|--------|-----------------|
| 1 | An event is created and its QR code is displayed | Event identifier returned, QR code generated |
| 2 | A request is sent from about 500 meters away | `LOCATION_MISMATCH` |
| 3 | A valid request is sent for student 2 using device `demo-device-1` | `SUCCESS`, record stored |
| 4 | A request is sent for student 3 using the same device `demo-device-1` | `PROXY_ATTENDANCE` (device reuse) |
| 5 | A request is sent again for student 2 using a new device | `PROXY_ATTENDANCE` (duplicate) |
| 6 | A request is sent for event 99999 | `NOT_FOUND` |
| 7 | The stored attendance record is shown in the database | One record for student 2 at event 1 |

---

## 9. Resetting the Demo Event

Run the following before repeating the demonstration, so that the live submission can be shown again.

```sql
USE geo_attendance;
DELETE FROM attendance WHERE id > 0 AND event_id = 1;
SELECT COUNT(*) AS event1_records FROM attendance WHERE event_id = 1;
```

The result of the final query should be 0.

---

## 10. Final Verification

- [ ] The backend, database, and client start in that order without errors
- [ ] The demonstration sequence in Section 8 runs from a clean state
- [ ] Screenshots of the key results are available as a backup
- [ ] All documents in the `docs` folder are committed to the repository