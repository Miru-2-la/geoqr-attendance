# Review 1 Summary

### GeoQR Attend: QR-Based Geo-Tagged Attendance Management System

**Course:** Computer Science Engineering (Data Science), Second Year.
**Review:** Review 1 (Design, Architecture, and System Flow)

---

## 1. Project Overview

GeoQR Attend is an attendance management system that prevents proxy attendance by verifying every attendance request through three independent layers: the event QR code, the student's distance from the event location, and the device used to submit the request. An administrator dashboard provides analytics, identification of students with low attendance, and downloadable reports.

---

## 2. Problem Statement

| Problem | Impact |
|---------|--------|
| Proxy attendance | One student can mark attendance for an absent friend, so records are unreliable |
| Time inefficiency | Manual attendance takes 5 to 10 minutes per lecture, over 6 hours across a semester |
| No real-time visibility | Faculty cannot identify students with falling attendance until it is too late |
| No location verification | Existing digital tools do not confirm that the student is physically present |
| Manual reporting | Compiling reports for academic compliance is slow and error-prone |

---

## 3. Objectives

1. Develop an attendance system in which each event is identified by a QR code.
2. Verify the student's location using the Haversine formula.
3. Detect proxy attendance by binding a device identifier to each attendance record.
4. Provide analytics, including identification of students below 75% attendance.
5. Generate downloadable attendance reports in CSV and PDF formats.

---

## 4. Proposed Solution: Three Verification Layers

| Layer | Mechanism | Result when the check fails |
|:-----:|-----------|-----------------------------|
| 1 | QR code carries the event identifier | The request is rejected with `NOT_FOUND` if the event does not exist |
| 2 | Haversine distance compared with the event radius (default 50 meters) | The request is rejected with `LOCATION_MISMATCH` |
| 3 | Device identifier stored with each attendance record | The request is rejected with `PROXY_ATTENDANCE` |

---

## 5. System Architecture

The system follows a three-tier architecture.

| Tier | Technology | Responsibility |
|------|------------|----------------|
| Presentation | JavaFX desktop application | Login, event management, attendance submission, dashboard |
| Application | Spring Boot REST API | Validation, business rules, analytics, reports |
| Data | MySQL with JPA and Hibernate | Persistent storage of users, events, and attendance |

The client communicates with the backend through JSON requests over HTTP. The backend package structure separates responsibilities into `controller`, `service`, `repository`, `model`, `dto`, `exception`, `report`, `config`, and `util`.

---

## 6. Database Design

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `users` | id, name, email (unique), password, role, roll_number, admin_code, created_at | Stores administrators and students in one table |
| `events` | id, title, description, latitude, longitude, radius_meters, event_date, start_time, end_time, created_by, created_at | Stores each event with its location and permitted radius |
| `attendance` | id, event_id, student_id, device_id, student_lat, student_long, distance_meters, status, timestamp | Stores each verified attendance record |

**Relationships.** An event references the administrator who created it through `created_by`. An attendance record references one event and one student.

**Optimization.** A composite index on `attendance (event_id, device_id)` is used to speed up the proxy-detection query, which always filters on both columns together.

---

## 7. Object-Oriented Design

| Concept | Implementation |
|---------|----------------|
| Inheritance | `Admin` and `Student` both extend `User`, mapped with single-table inheritance |
| Polymorphism | The `ReportGenerator` interface is implemented by `CSVReportGenerator` and `PDFReportGenerator`, so one method call produces different output formats |
| Encapsulation | Business logic is kept in service classes, and controllers only handle requests and responses |
| Exception handling | Custom exceptions are converted into one response format by a global exception handler |

---

## 8. Attendance Validation Flow

When the backend receives a scan request, it performs the following checks in order.

| Order | Check | Failure Response |
|:-----:|-------|------------------|
| 1 | The event exists | `NOT_FOUND` (HTTP 404) |
| 2 | The student has not already marked attendance for the event | `PROXY_ATTENDANCE` (HTTP 400) |
| 3 | The student is within the event radius | `LOCATION_MISMATCH` (HTTP 400) |
| 4 | The device has not been used for the event | `PROXY_ATTENDANCE` (HTTP 400) |
| 5 | All checks passed | The record is stored and `SUCCESS` is returned |

All errors are returned in a single format containing `status`, `message`, and `errorCode`.

---

## 9. User Interface and Flow

The JavaFX client has three main screens.

| Screen | Purpose |
|--------|---------|
| Login | Authenticates the user and selects the administrator or student role |
| Administrator dashboard | Creates events, displays the event QR code, shows attendance records, analytics, and reports |
| Student attendance | Accepts the event identifier and displays a success or error result |

**Administrator flow:** log in, create an event, backend returns the event identifier, client generates the QR code, administrator displays it.

**Student flow:** log in, enter the event identifier, client sends the identifier with the student's coordinates and device identifier, backend validates the request, client displays the result.

---

## 10. Plan for Review 2 and Review 3

| Review | Planned Work |
|--------|--------------|
| Review 2 | Core working prototype: login, event creation, attendance submission, location verification, inheritance and polymorphism demonstration, custom exceptions |
| Review 3 | Complete live application with proxy detection, analytics, reports, database optimization, UML diagrams, and full testing |

---

## 11. Limitations and Future Scope

**Limitations.** GPS accuracy varies by device, the system requires a network connection, the device identifier can be reset by the user, and the accuracy of the location check depends on the client reporting the true position.

**Future scope.** Face recognition after the QR step, offline attendance with later synchronization, a native mobile application, machine-learning prediction of dropout risk, cloud deployment, and email or SMS alerts for low attendance.