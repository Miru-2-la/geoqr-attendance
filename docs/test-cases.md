# 📋 Test Cases Documentation

**Project:** GeoQR Attend
**Tested against:** live backend at `http://localhost:8080`
**Tester:** Person C (Security, Testing and Documentation)

**Status key:** ✅ PASS · ❌ FAIL · ⬜ Not yet run

---

## 1️⃣ Authentication Tests

| ID | Test case | Input | Expected | Actual | Status |
|----|-----------|-------|----------|--------|--------|
| TC-01 | Valid admin login | admin@geoqr.com / admin123 / ADMIN | 200, `SUCCESS`, token returned |200 '{"status":"SUCCESS","message":"Login successful","data":{"token":"665c7400-8e76-43b6-889b-77b56224903b","user":{"id":1,"name":"Dr. Smith","email":"admin@geoqr.com","role":"ADMIN","rollNumber":null,"adminCode":"ADM001"}},"errorCode":null}'| ✅ |
| TC-02 | Valid student login | student@geoqr.com / student123 / STUDENT | 200, `SUCCESS`, token returned |200 '{"status":"SUCCESS","message":"Login successful","data":{"token":"afca6093-1816-4e03-a24a-2fe586d42d57","user":{"id":2,"name":"Arun Kumar","email":"student@geoqr.com","role":"STUDENT","rollNumber":"CS2024001","adminCode":null}},"errorCode":null}'| ✅ |
| TC-03 | Wrong password | admin@geoqr.com / wrong / ADMIN | 404, `NOT_FOUND`, "Invalid email or password" |404 '{"status":"ERROR","message":"Invalid email or password","data":null,"errorCode":"NOT_FOUND"}' | ✅ |
| TC-04 | Wrong role | admin@geoqr.com / admin123 / STUDENT | 404, `NOT_FOUND`, "Invalid role selected" |404 '{"status":"ERROR","message":"Invalid role selected","data":null,"errorCode":"NOT_FOUND"}'| ✅ |

---

## 2️⃣ Location Verification Tests (radius = 50 m)

| ID | Test case | Input | Expected | Actual | Status |
|----|-----------|-------|----------|--------|--------|
| TC-05 | Inside radius | Student 3, about 25 m from event | 200, `SUCCESS` |200 '{"status":"SUCCESS","message":"Attendance marked successfully","data":{"id":2,"eventId":1,"studentId":3,"deviceId":"test-device-010","studentLat":12.971825,"studentLong":77.5946,"distanceMeters":25.02,"status":"PRESENT","timestamp":"2026-10-05T09:19:45.5591463"},"errorCode":null}'| ✅ |
| TC-06 | Just outside radius | Student 4, about 51 m from event | 400, `LOCATION_MISMATCH` |400 '{"status":"ERROR","message":"You are 51m away from the event location. Maximum allowed: 50m","data":null,"errorCode":"LOCATION_MISMATCH"}' | ✅ |
| TC-07 | Far away | Student 2, about 500 m from event | 400, `LOCATION_MISMATCH` | 400, `LOCATION_MISMATCH` | ✅ |

---

## 3️⃣ Proxy and Duplicate Detection Tests

| ID | Test case | Input | Expected | Actual | Status |
|----|-----------|-------|----------|--------|--------|
| TC-08 | Valid first scan | Student 2, new device, at event | 200, `SUCCESS` | 200, `SUCCESS` | ✅ |
| TC-09 | Same device, different student | Student 3, device already used | 400, `PROXY_ATTENDANCE` | 400, `PROXY_ATTENDANCE` | ✅ |
| TC-10 | Same student scans twice | Student 2, new device | 400, `PROXY_ATTENDANCE` | 400, `PROXY_ATTENDANCE` | ✅ |

---

## 4️⃣ Invalid QR / Event Test

| ID | Test case | Input | Expected | Actual | Status |
|----|-----------|-------|----------|--------|--------|
| TC-11 | Event does not exist | `eventId: 99999` | 404, `NOT_FOUND` | 404, `NOT_FOUND` | ✅ |

---

## 5️⃣ Analytics Tests

| ID | Test case | Input | Expected | Actual | Status |
|----|-----------|-------|----------|--------|--------|
| TC-12 | At-risk students | `GET /api/analytics/at-risk` | 200, `SUCCESS`, list of students below 75% |200 '{"status":"SUCCESS","message":"At-risk students retrieved","data":[],"errorCode":null}' | ✅ |
| TC-13 | Attendance trend | `GET /api/analytics/trend` | 200, `SUCCESS`, list of dates and counts |200 '{"status":"SUCCESS","message":"Attendance trend retrieved","data":[{"date":"2026-10-04","count":2}],"errorCode":null}' | ✅ |

---

## 6️⃣ Report Tests

| ID | Test case | Input | Expected | Actual | Status |
|----|-----------|-------|----------|--------|--------|
| TC-14 | CSV report | `GET /api/reports/csv` | 200, CSV text with header row |200 'ID,Event ID,Student ID,Device ID,Distance (m),Status,Timestamp\n2,1,3,test-device-010,25.02,PRESENT,2026-10-05 09:19:45\n1,1,2,test-device-001,0.0,PRESENT,2026-10-04 22:14:17\n' | ✅ |
| TC-15 | PDF report | `GET /api/reports/pdf` | 200, report content downloaded |200 '========================================\n     GEOQR ATTENDANCE REPORT\n========================================\n\nTotal Records: 2\n\n----------------------------------------\nAttendance ID: 2\nEvent ID: 1\nStudent ID: 3\nStatus: PRESENT\nTimestamp: 2026-10-05 09:19:45\n---------------------------------------' | ✅ |

---

## 📊 Summary

| Category | Total | Passed | Failed | Not run |
|----------|:-----:|:------:|:------:|:-------:|
| Authentication | 4 | | | |
| Location | 3 | | | |
| Proxy / duplicate | 3 | | | |
| Invalid event | 1 | | | |
| Analytics | 2 | | | |
| Reports | 2 | | | |
| **Total** | **15** | | | |

---

## 📝 Notes and Observations

All 15 test cases matched their expected results.

**Known limitations observed during testing:**

1. **PDF report:** `/api/reports/pdf` returns formatted plain text with a
   PDF content type. It is not a true PDF file, so some PDF viewers may not
   open it. A library such as iText or Apache PDFBox would fix this.
2. **Passwords:** stored and compared as plain text. A production system
   should hash passwords (for example with BCrypt).
3. **Login token:** a random UUID is returned but the backend does not
   verify it on later requests, so endpoints are not protected by login.
4. **Device ID:** stored in browser localStorage, so clearing browser data
   gives a student a new device ID.
5. **GPS accuracy:** phone GPS can be off by 10-20 m, which is why the
   default radius is 50 m.