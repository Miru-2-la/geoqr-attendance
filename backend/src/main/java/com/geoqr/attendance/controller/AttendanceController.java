package com.geoqr.attendance.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geoqr.attendance.dto.ApiResponse;
import com.geoqr.attendance.dto.ScanRequest;
import com.geoqr.attendance.model.Attendance;
import com.geoqr.attendance.security.AuthPrincipal;
import com.geoqr.attendance.service.AttendanceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/scan")
    public ResponseEntity<ApiResponse<Attendance>> scan(
            @Valid @RequestBody ScanRequest req, 
            @AuthenticationPrincipal AuthPrincipal me) {
        
        return ResponseEntity.ok(ApiResponse.success("Success", 
                attendanceService.processAttendance(me.id(), req)));
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