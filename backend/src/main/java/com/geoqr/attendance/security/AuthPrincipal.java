package com.geoqr.attendance.security;

public record AuthPrincipal(Long id, String email, String role) {
    public boolean isAdmin() { 
        return "ADMIN".equals(role); 
    }
}