package com.geoqr.attendance.controller;

import com.geoqr.attendance.dto.ApiResponse;
import com.geoqr.attendance.dto.LoginRequest;
import com.geoqr.attendance.dto.LoginResponse;
import com.geoqr.attendance.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request)));
    }
}