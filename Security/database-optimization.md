# Database Optimization

### GeoQR Attend: Composite Index for Proxy Detection

---

## 1. Purpose

Every attendance request triggers a proxy-detection check: the backend must find out whether the same device has already been used for the same event. This check runs on every scan, so it must stay fast as the attendance table grows. A composite index on the two columns used by the check supports this.

---

## 2. Query Being Optimized

The repository method `existsByEventIdAndDeviceId(eventId, deviceId)` is translated by Spring Data JPA into a query of the following form.

```sql
SELECT COUNT(*) FROM attendance
WHERE event_id = ? AND device_id = ?;
```

The duplicate-attendance check `existsByEventIdAndStudentId(eventId, studentId)` filters on `event_id` and `student_id` in the same way.

---

## 3. Index Definition

```sql
CREATE INDEX idx_event_device ON attendance (event_id, device_id);
```

| Item | Value |
|------|-------|
| Index name | `idx_event_device` |
| Table | `attendance` |
| Columns | `event_id`, then `device_id` |
| Type | Composite (two-column) B-tree index |

---

## 4. Why a Composite Index

| Approach | Behaviour |
|----------|-----------|
| No index | MySQL reads every row of the table to find matches (a full table scan). The work grows with the number of attendance records. |
| Two separate indexes | MySQL normally uses only one of them to narrow the search, then filters the remaining rows by the other column. |
| One composite index | MySQL locates the matching rows directly using both conditions in a single lookup. |

Proxy detection always filters on both columns together with equality conditions, so one composite index matches the query exactly.

A composite index can also serve queries that filter only on its first column. The index `(event_id, device_id)` therefore also helps queries that filter on `event_id` alone, such as counting the attendance of one event or listing the attendance of one event.

---

## 5. Additional Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_event_device` | `event_id`, `device_id` | Proxy detection (main optimization) |
| `idx_student_event` | `student_id`, `event_id` | Duplicate attendance check and per-student queries |
| `idx_timestamp` | `timestamp` | Recent attendance listing and analytics |

---

## 6. How to Apply and Verify

Run the following in MySQL Workbench against the `geo_attendance` database.

**Step 1.** List the existing indexes first, so that no index is created twice.

```sql
SHOW INDEX FROM attendance;
```

**Step 2.** Create each index that is not already listed.

```sql
CREATE INDEX idx_event_device ON attendance (event_id, device_id);
CREATE INDEX idx_student_event ON attendance (student_id, event_id);
CREATE INDEX idx_timestamp ON attendance (`timestamp`);
```

**Step 3.** Confirm that the indexes now exist.

```sql
SHOW INDEX FROM attendance;
```

The output should include `idx_event_device` with `event_id` in sequence 1 and `device_id` in sequence 2.

![Index list for the attendance table](screenshots/db-index-list.png)

**Step 4.** Ask MySQL how it executes the proxy-detection query.

```sql
EXPLAIN SELECT COUNT(*) FROM attendance
WHERE event_id = 2 AND device_id = 'sample-device-2';
```

---

## 7. Observed Result

| Item | Value |
|------|-------|
| `possible_keys` | idx_event_device |
| `key` (index chosen) | idx_event_device |

The test database contains only a handful of attendance rows. At this size the optimizer may choose any access method, because scanning a very small table is already cheap. The benefit of the index appears as the table grows to thousands of records across many events and classes. No timing measurements were taken on the test database, so no speed-up figure is claimed.

---

## 8. Limitations

1. Every index adds a small cost to each insert, because the index must be updated. This is acceptable because attendance is read far more often than it is written.
2. The index speeds up the lookup but does not by itself prevent duplicates. Duplicates are prevented by the check in `AttendanceService`.