package com.geoqr.attendance.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.geoqr.attendance.exception.ApiException;

@Service
public class QrTokenService {
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();
    private static final SecureRandom RNG = new SecureRandom();

    private final byte[] secret;
    private final long ttlSeconds;
    private final Clock clock;

    public QrTokenService(@Value("${app.qr.secret:default-secret-must-be-at-least-32-chars-long}") String secret,
                          @Value("${app.qr.ttl-seconds:60}") long ttlSeconds,
                          Clock clock) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("QR_SECRET must be at least 32 characters");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttlSeconds = ttlSeconds;
        this.clock = clock;
    }

    public long getTtlSeconds() { return ttlSeconds; }

    public String issue(Long eventId) {
        byte[] nonceBytes = new byte[8];
        RNG.nextBytes(nonceBytes);
        long exp = clock.instant().getEpochSecond() + ttlSeconds;
        String payload = eventId + "." + exp + "." + B64.encodeToString(nonceBytes);
        String p = B64.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return p + "." + B64.encodeToString(hmac(p));
    }

    public String verify(String token, Long expectedEventId) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) throw invalid();
            byte[] expected = hmac(parts[0]);
            byte[] given = B64D.decode(parts[1]);
            if (!MessageDigest.isEqual(expected, given)) throw invalid();

            String[] f = new String(B64D.decode(parts[0]), StandardCharsets.UTF_8).split("\\.");
            if (f.length != 3) throw invalid();
            if (!Long.valueOf(f[0]).equals(expectedEventId)) throw invalid();
            if (clock.instant().getEpochSecond() > Long.parseLong(f[1])) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "QR_EXPIRED", "QR code has expired. Scan the latest code.");
            }
            return f[2];
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw invalid();
        }
    }

    private ApiException invalid() {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QR", "Invalid QR code.");
    }

    private byte[] hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}