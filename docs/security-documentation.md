# Security Documentation

### GeoQR Attend: Verification Rules, Business Rules, and Limitations

---

## 1. Overview

GeoQR Attend protects the integrity of attendance records by validating every attendance request on the backend. The client is never trusted to decide whether attendance is valid. `AttendanceService` evaluates each request in a fixed order and stops at the first failed check.

| Order | Check | Exception | Error Code | HTTP Status |
|:-----:|-------|-----------|------------|:-----------:|
| 1 | The event exists | `ResourceNotFoundException` | `NOT_FOUND` | 404 |
| 2 | The student has not already marked attendance | `ProxyAttendanceException` | `PROXY_ATTENDANCE` | 400 |
| 3 | The student is within the event radius | `LocationMismatchException` | `LOCATION_MISMATCH` | 400 |
| 4 | The device has not been used for this event | `ProxyAttendanceException` | `PROXY_ATTENDANCE` | 400 |
| 5 | All checks passed | none | `SUCCESS` | 200 |

---

## 2. Geographical Verification (LocationMismatchException)

**Rule.** A student may mark attendance only when the distance between the submitted coordinates and the event location does not exceed the event radius.

```
if (distance > event.radiusMeters)  ->  LocationMismatchException
```

**Mechanism.** `GeoUtils.getDistance` applies the Haversine formula with an Earth radius of 6,371,000 meters. The radius is stored per event in the column `radius_meters`, and its default value is 50 meters.

| Item | Value |
|------|-------|
| Trigger | Distance is greater than the event radius |
| Error code | `LOCATION_MISMATCH` |
| HTTP status | 400 |
| Evidence | A request about 500 meters from the event was rejected (see `exception-testing.md`, section 5.1) |

The formula and its test values are documented in `haversine-verification.md`.

---

## 3. Proxy Detection (ProxyAttendanceException, Device Reuse)

**Rule.** One device may mark attendance for only one student at a given event.

**Mechanism.** The backend calls `existsByEventIdAndDeviceId(eventId, deviceId)`. If a record already exists for the same event and device, the request is rejected. The lookup is supported by the composite index `idx_event_device` (see `database-optimization.md`).

| Item | Value |
|------|-------|
| Trigger | The same device identifier was already used for this event |
| Error code | `PROXY_ATTENDANCE` |
| HTTP status | 400 |
| Evidence | A second student using the same device was rejected (see `exception-testing.md`, section 5.3) |

---

## 4. Duplicate Attendance Check

**Rule.** A student may mark attendance for an event only once.

**Mechanism.** The backend calls `existsByEventIdAndStudentId(eventId, studentId)` before any location or device check. A repeated request is therefore rejected without the location being measured.

| Item | Value |
|------|-------|
| Trigger | The same student submits the same event again |
| Error code | `PROXY_ATTENDANCE` |
| HTTP status | 400 |
| Evidence | A repeated submission from a different device was rejected (see `exception-testing.md`, section 5.4) |

This check shares its exception type and error code with proxy detection. The two cases are distinguished by the message text.

---

## 5. Global Exception Handling

All exceptions are handled in one class, `GlobalExceptionHandler`, which is annotated with `@RestControllerAdvice`. It converts every exception into the same JSON structure.

```json
{
  "status": "ERROR",
  "message": "Description of the problem",
  "errorCode": "LOCATION_MISMATCH"
}
```

| Exception | Error Code | HTTP Status |
|-----------|------------|:-----------:|
| `LocationMismatchException` | `LOCATION_MISMATCH` | 400 |
| `ProxyAttendanceException` | `PROXY_ATTENDANCE` | 400 |
| `InvalidQRException` | `INVALID_QR` | 400 |
| `ResourceNotFoundException` | `NOT_FOUND` | 404 |
| Any other `Exception` | `INTERNAL_ERROR` | 500 |

**Benefits.**

1. The client handles every failure through a single response format.
2. Controllers and services contain no repeated error-handling code.
3. The client receives a structured error instead of a raw server error page.

---

## 6. Business Rules

| Rule | Definition |
|------|------------|
| Geo-fence | Attendance is allowed when the distance is less than or equal to the event radius (default 50 meters), and rejected otherwise |
| Device binding | At most one student may use a given device identifier for a given event |
| One record per student | A student may have only one attendance record per event |
| At-risk student | A student whose attendance percentage is below 75 |

**At-risk calculation.** The backend computes the percentage as follows.

```
attendance percentage = (distinct events attended / total events in the system) x 100
at risk               = attendance percentage is below 75
```

The denominator is the number of **all events** stored in the system, including events at which nobody was present. A student with no attendance records is shown with 0 percent.

**Worked example** (the test data set of 5 events):

| Student | Events attended | Percentage | At risk |
|---------|:---------------:|:----------:|:-------:|
| Arun Kumar | 4 of 5 | 80.00 | No |
| Priya Sharma | 3 of 5 | 60.00 | Yes |
| Rahul Verma | 1 of 5 | 20.00 | Yes |

---

## 7. Device Fingerprinting

**Purpose.** Location alone cannot show that a student attended personally, because a student could submit attendance for a friend who is nearby. Device fingerprinting adds a second, independent signal.

**Method.**

1. The client generates a device identifier and keeps it between sessions.
2. The client sends the identifier with every attendance request in the field `deviceId`.
3. The backend stores the identifier with each attendance record.
4. For a new request, the backend checks whether the identifier has already been used for the same event.
5. If it has, the request is rejected with `PROXY_ATTENDANCE`.

**Scope of protection.** The backend treats the identifier as an opaque string. It protects against the common case in which one person marks attendance for several students from one device. It does not authenticate the device itself.

---

## 8. Threats and Controls

| Threat | Control | Error Code |
|--------|---------|------------|
| Marking attendance for a non-existent event | Event existence check | `NOT_FOUND` |
| Marking attendance from outside the classroom | Haversine geo-fence | `LOCATION_MISMATCH` |
| One person marking attendance for several students on one device | Device binding per event | `PROXY_ATTENDANCE` |
| One student marking attendance repeatedly | One record per student per event | `PROXY_ATTENDANCE` |
| Unhandled failures exposing internal errors | Global exception handler | `INTERNAL_ERROR` |

---

## 9. Limitations

1. **GPS accuracy.** Consumer GPS readings can differ from the true position by roughly 10 to 20 meters. The default radius of 50 meters allows for this, but it also means a student slightly outside the room may be accepted.
2. **Network dependence.** Attendance cannot be submitted without a connection to the backend.
3. **Resettable device identifier.** The identifier is generated and stored by the client. A user who clears the stored value, or uses a modified client, obtains a new identifier and avoids device binding.
4. **Client-supplied coordinates.** The backend calculates the distance from the coordinates it receives, so the location check is only as trustworthy as the client that reports them. A modified client could submit false coordinates.
5. **No enforcement of login on other requests.** During testing, requests to the attendance endpoint were accepted without any login token being supplied. Login therefore identifies the user to the client but is not enforced by the backend on later requests.
6. **Student identifier not validated.** The attendance table has no foreign key on `student_id`. A request can therefore carry an identifier that does not belong to any user. During testing, attendance records for student identifiers 3 and 4 were stored before those user accounts existed.
7. **Password storage.** Passwords are stored and compared as plain text. A production system should store salted hashes, for example with BCrypt.
8. **Error detail.** The fallback handler includes the text of the underlying exception in its message, which could reveal internal details. A production system should return a generic message for unexpected errors and log the details privately.
9. **Report format.** The PDF report is generated as formatted plain text. A library such as iText or Apache PDFBox would be needed to produce a true PDF document.