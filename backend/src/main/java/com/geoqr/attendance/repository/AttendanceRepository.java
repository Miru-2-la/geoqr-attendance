package com.geoqr.attendance.repository;

import com.geoqr.attendance.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // Check for proxy attendance (same device used for the same event)
    boolean existsByEventIdAndDeviceId(Long eventId, String deviceId);

    // Check if a student already marked attendance for an event
    boolean existsByEventIdAndStudentId(Long eventId, Long studentId);

    // Get attendance list for a specific event
    List<Attendance> findByEventIdOrderByTimestampDesc(Long eventId);

    // Get attendance history for a specific student
    List<Attendance> findByStudentIdOrderByTimestampDesc(Long studentId);

    // Count total attendance for an event
    long countByEventId(Long eventId);

    // Get recent attendance (for the admin dashboard)
    @Query("SELECT a FROM Attendance a ORDER BY a.timestamp DESC")
    List<Attendance> findRecentAttendance();

    // Analytics: At-risk students (below 75% attendance)
    @Query(value = """
        SELECT u.id, u.name, u.roll_number,
               COUNT(DISTINCT a.event_id) as events_attended,
               (SELECT COUNT(*) FROM events) as total_events,
               COALESCE(ROUND((COUNT(DISTINCT a.event_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM events), 0)), 2), 0) as attendance_percentage
        FROM users u
        LEFT JOIN attendance a ON u.id = a.student_id
        WHERE u.role = 'STUDENT'
        GROUP BY u.id, u.name, u.roll_number
        HAVING attendance_percentage < 75 OR attendance_percentage IS NULL
        ORDER BY attendance_percentage ASC
        """, nativeQuery = true)
    List<Object[]> findAllAtRiskStudents();

    // Analytics: Attendance trend over time
    @Query(value = """
        SELECT e.event_date, COUNT(a.id) as attendance_count
        FROM events e
        LEFT JOIN attendance a ON e.id = a.event_id
        WHERE e.event_date >= :startDate
        GROUP BY e.event_date
        ORDER BY e.event_date ASC
        """, nativeQuery = true)
    List<Object[]> findAttendanceTrend(@Param("startDate") LocalDate startDate);
}