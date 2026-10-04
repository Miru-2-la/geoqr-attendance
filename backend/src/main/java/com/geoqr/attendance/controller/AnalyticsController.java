package com.geoqr.attendance.controller;

import com.geoqr.attendance.dto.ApiResponse;
import com.geoqr.attendance.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/at-risk")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAtRiskStudents() {
        List<Map<String, Object>> students = analyticsService.getAtRiskStudents();
        return ResponseEntity.ok(ApiResponse.success("At-risk students retrieved", students));
    }

    @GetMapping("/trend")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAttendanceTrend() {
        List<Map<String, Object>> trend = analyticsService.getAttendanceTrend();
        return ResponseEntity.ok(ApiResponse.success("Attendance trend retrieved", trend));
    }
}