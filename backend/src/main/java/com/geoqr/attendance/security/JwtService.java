package com.geoqr.attendance.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final Duration accessTokenTtl;
    private final Duration qrTokenTtl;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-ttl:15m}") Duration accessTokenTtl,
            @Value("${app.jwt.qr-token-ttl:2m}") Duration qrTokenTtl) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.jwt.secret must be at least 32 bytes for HS256");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtl = accessTokenTtl;
        this.qrTokenTtl = qrTokenTtl;
    }

    public String generateAccessToken(String subject, Map<String, Object> extraClaims) {
        return build(subject, extraClaims, accessTokenTtl, "access");
    }

    public String generateQrToken(String subject, Map<String, Object> extraClaims) {
        return build(subject, extraClaims, qrTokenTtl, "qr");
    }

    private String build(String subject, Map<String, Object> extraClaims, Duration ttl, String typ) {
        Instant now = Instant.now();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .claim("typ", typ)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(signingKey)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            throw new ApiException("Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    public String extractSubject(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isAccessTokenValid(String token, String expectedSubject) {
        try {
            Claims claims = extractAllClaims(token);
            return "access".equals(claims.get("typ"))
                    && expectedSubject.equals(claims.getSubject())
                    && claims.getExpiration().after(new Date());
        } catch (ApiException ex) {
            return false;
        }
    }
}