package com.geoqr.attendance.service;

import com.geoqr.attendance.repository.AttendanceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final AttendanceRepository attendanceRepository;

    public AnalyticsService(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    public List<Map<String, Object>> getAtRiskStudents() {
        List<Object[]> results = attendanceRepository.findAllAtRiskStudents();
        List<Map<String, Object>> atRiskStudents = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> student = new HashMap<>();
            student.put("id", row[0]);
            student.put("name", row[1]);
            student.put("rollNumber", row[2]);
            student.put("eventsAttended", row[3]);
            student.put("totalEvents", row[4]);
            student.put("attendancePercentage", row[5] != null ? row[5] : 0);
            atRiskStudents.add(student);
        }
        return atRiskStudents;
    }

    public List<Map<String, Object>> getAttendanceTrend() {
        LocalDate startDate = LocalDate.now().minusDays(7);
        List<Object[]> results = attendanceRepository.findAttendanceTrend(startDate);
        List<Map<String, Object>> trend = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("date", row[0].toString());
            dataPoint.put("count", row[1]);
            trend.add(dataPoint);
        }
        return trend;
    }
}