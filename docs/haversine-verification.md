# 📐 Haversine Formula Verification

## 🌍 What Is the Haversine Formula?

The Haversine formula calculates the **great-circle distance** (the shortest
path over the Earth's curved surface) between two GPS points.

GeoQR Attend uses it to measure how far a student is from the event location.

```
a = sin²(Δφ / 2) + cos(φ1) · cos(φ2) · sin²(Δλ / 2)
c = 2 · atan2( √a, √(1 − a) )
d = R · c
```

| Symbol | Meaning |
|--------|---------|
| φ (phi) | Latitude, in radians |
| λ (lambda) | Longitude, in radians |
| Δφ, Δλ | Difference between the two latitudes / longitudes |
| R | Earth's mean radius = **6,371,000 meters** |
| d | Final distance in meters |

---

## ☕ Java Implementation

**File:** `util/GeoUtils.java` (written by Mirudhula)

```java
public static double getDistance(double lat1, double lon1,
                                 double lat2, double lon2) {
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);

    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
             + Math.cos(Math.toRadians(lat1))
             * Math.cos(Math.toRadians(lat2))
             * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return 6371000 * c;
}
```

---

## 🔒 The Security Rule

```
if (distance > event.radiusMeters)  →  LocationMismatchException
```

- Distance **equal to or below** the radius → ✅ allowed
- Distance **above** the radius → ❌ rejected

---

## 🧪 Distance Test Cases

All points start at the event location **(12.9716, 77.5946)** and move **north**
(only the latitude changes).

| Test | Point 2 | Expected | Actual |
|------|---------|----------|--------|
| 📍 Same point | (12.9716, 77.5946) | 0 m | 0 m |
| ⬆️ Short move | (12.9720, 77.5946) | ~44 m | 44 m |
| ⬆️ Medium move | (12.9725, 77.5946) | ~100 m | 100 m |
| ⬆️ Far move | (12.9761, 77.5946) | ~500 m | 500 m |
| ⬆️ Very far | (12.9806, 77.5946) | ~1001 m | 1001 m |

> 💡 **Why 0.0045° ≈ 500 m?** One degree of latitude is about 111,195 m on
> Earth, so 0.0045 × 111,195 ≈ 500 m. The demo "Simulate Location" checkbox
> in the student scanner uses exactly this shift.

---

## 🎯 Boundary Conditions (50 m radius)

| Distance from event | ✅ Allowed | ❌ Rejected |
|---------------------|:---------:|:----------:|
| 0 m | ✅ | |
| 25 m | ✅ | |
| 49 m | ✅ | |
| 50 m | ✅ | |
| 51 m | | ❌ |
| 100 m | | ❌ |
| 500 m | | ❌ |

---

## ⚠️ Known Limitation

Phone GPS is not perfectly accurate. It can be off by roughly **10-20 meters**,
which is why the default radius is 50 m instead of something very small.
Admins can change the radius per event (10-500 m).