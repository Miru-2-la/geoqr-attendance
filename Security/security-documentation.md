# Security Documentation

## 1. JWT Authentication

Files under `backend/src/main/java/com/geoqr/attendance/security/`:

- JwtService.java - signs and verifies JWT tokens (HS256)
- JwtAuthFilter.java - extracts Bearer token and sets SecurityContext
- SecurityConfig.java - Spring Security filter chain
- CustomUserDetailsService.java - loads User by ID
- QrTokenService.java - issues and verifies QR tokens
- ApiException.java - exception carrying HTTP status

This is a different folder from Security/ at the repo root (which holds this documentation).

## 2. Login Flow

1. POST /api/auth/login with email, password, role
2. AuthService checks userRepository.findByEmailAndPassword
3. Role derived from entity: Admin = ADMIN, Student = STUDENT
4. JwtService.generateAccessToken(sub = user.id, claims = email + role)
5. Token returned in LoginResponse

## 3. Token Shape

Claims:

- sub = user.id
- email = user's email
- role = ADMIN or STUDENT
- typ = access (or qr for QR tokens)
- iat, exp = issued and expiry times

Default TTL: 15 minutes for access tokens, 2 minutes for QR tokens. Signed with HS256 using app.jwt.secret.

## 4. Request Authentication

JwtAuthFilter runs on every request:

1. Reads Authorization: Bearer token
2. Extracts subject via JwtService.extractSubject
3. Loads UserDetails via CustomUserDetailsService
4. Validates token (signature, expiry, typ, subject match)
5. Sets authority ROLE_ADMIN or ROLE_STUDENT in context

## 5. Configuration

application.properties:

    app.jwt.secret = JWT_SECRET env var, or dev placeholder
    app.jwt.access-token-ttl = 15m
    app.jwt.qr-token-ttl = 2m

app.jwt.secret must be 32+ bytes for HS256.

## 6. Route Protection

SecurityConfig currently permits all /api/ routes.

This is temporary. The frontend does not yet send the Authorization header. Once it does, replace permitAll with role rules:

- POST /api/attendance/ requires STUDENT or ADMIN
- /api/reports/ and /api/analytics/ require ADMIN
- /api/events/ requires authenticated

## 7. Attendance Verification

AttendanceService checks in order:

1. Event exists - 404
2. Student not already marked - 400
3. Within event radius via Haversine - 400
4. Device not reused for event - 400

## 8. Limitations

1. Plaintext passwords (needs BCrypt and migration)
2. Routes not enforced yet
3. No refresh tokens
4. No token revocation
5. QR tokens not wired into AttendanceController yet
6. No QR replay detection
7. JWT secret in properties (use env var in prod)
8. No login rate limiting
9. GPS accuracy ~10-20m
10. Client-supplied coordinates and device IDs can be spoofed
11. Attendance.student_id has no FK constraint
12. Error handler leaks exception detail
13. PDF reports are plain text
14. Logout is client-side only
