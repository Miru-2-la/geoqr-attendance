package com.geoqr.attendance.controller;

import com.geoqr.attendance.dto.ApiResponse;
import com.geoqr.attendance.dto.ScanRequest;
import com.geoqr.attendance.model.Attendance;
import com.geoqr.attendance.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/scan")
    public ResponseEntity<ApiResponse<Attendance>> markAttendance(
            @RequestBody ScanRequest request) {
        Attendance attendance = attendanceService.processAttendance(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance marked successfully", attendance));
    }

    @GetMapping("/attendance/event/{eventId}")
    public ResponseEntity<ApiResponse<List<Attendance>>> getAttendanceByEvent(
            @PathVariable Long eventId) {
        List<Attendance> attendance = attendanceService.getAttendanceByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved", attendance));
    }

    @GetMapping("/attendance/student/{studentId}")
    public ResponseEntity<ApiResponse<List<Attendance>>> getAttendanceByStudent(
            @PathVariable Long studentId) {
        List<Attendance> attendance = attendanceService.getAttendanceByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved", attendance));
    }

    @GetMapping("/attendance/recent")
    public ResponseEntity<ApiResponse<List<Attendance>>> getRecentAttendance() {
        List<Attendance> attendance = attendanceService.getRecentAttendance();
        return ResponseEntity.ok(ApiResponse.success("Recent attendance retrieved", attendance));
    }

    @GetMapping("/attendance/count/{eventId}")
    public ResponseEntity<ApiResponse<Long>> getAttendanceCount(@PathVariable Long eventId) {
        long count = attendanceService.getAttendanceCount(eventId);
        return ResponseEntity.ok(ApiResponse.success("Count retrieved", count));
    }
}