package com.geoqr.attendance.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geoqr.attendance.dto.ApiResponse;
import com.geoqr.attendance.exception.ApiException;
import com.geoqr.attendance.repository.EventRepository;
import com.geoqr.attendance.security.QrTokenService;

@RestController
@RequestMapping("/api/events")
public class QrController {
    private final EventRepository events;
    private final QrTokenService qr;

    public QrController(EventRepository events, QrTokenService qr) {
        this.events = events;
        this.qr = qr;
    }

    @GetMapping("/{id}/qr-token")
    public ResponseEntity<ApiResponse<Map<String, Object>>> token(@PathVariable Long id) {
        if (!events.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found.");
        }
        return ResponseEntity.ok(ApiResponse.success("Token generated",Map.of(
                "eventId", id,
                "token", qr.issue(id),
                "expiresInSeconds", qr.getTtlSeconds()
        )));
    }
}