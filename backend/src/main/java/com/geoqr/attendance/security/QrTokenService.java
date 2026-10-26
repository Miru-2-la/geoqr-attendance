package com.geoqr.attendance.security;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class QrTokenService {

    private final JwtService jwtService;

    public QrTokenService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public String issueQrToken(String sessionId, String issuedBy) {
        return jwtService.generateQrToken(sessionId, Map.of(
                "issuedBy", issuedBy,
                "nonce", UUID.randomUUID().toString(),
                "scope", "attendance:mark"
        ));
    }

    public Claims verifyQrToken(String token) {
        Claims claims = jwtService.extractAllClaims(token);
        if (!"qr".equals(claims.get("typ"))) {
            throw new ApiException("Not a QR token");
        }
        return claims;
    }
}