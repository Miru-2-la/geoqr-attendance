package com.geoqr.attendance.controller;

import com.geoqr.attendance.model.Attendance;
import com.geoqr.attendance.service.AttendanceService;
import com.geoqr.attendance.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;
    private final AttendanceService attendanceService;

    public ReportController(ReportService reportService,
                            AttendanceService attendanceService) {
        this.reportService = reportService;
        this.attendanceService = attendanceService;
    }

    @GetMapping("/csv")
    public ResponseEntity<byte[]> downloadCSVReport() {
        List<Attendance> records = attendanceService.getRecentAttendance();
        String content = reportService.generateReport(records, "csv");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "attendance-report.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(content.getBytes());
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> downloadPDFReport() {
        List<Attendance> records = attendanceService.getRecentAttendance();
        String content = reportService.generateReport(records, "pdf");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "attendance-report.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(content.getBytes());
    }
}