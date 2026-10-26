# Haversine Formula Verification

### GeoQR Attend: Geographical Verification Logic

---

## 1. Purpose

GeoQR Attend must confirm that a student is physically near the event location. The distance between the event coordinates and the coordinates submitted by the student is computed with the Haversine formula, which gives the great-circle distance between two points on a sphere.

---

## 2. The Formula

```
a = sin^2(dLat / 2) + cos(lat1) * cos(lat2) * sin^2(dLon / 2)
c = 2 * atan2( sqrt(a), sqrt(1 - a) )V
d = R * c
```

| Symbol | Meaning |
|--------|---------|
| lat1, lon1 | Latitude and longitude of the event location |
| lat2, lon2 | Latitude and longitude submitted by the student |
| dLat, dLon | Differences in latitude and longitude, in radians |
| R | Mean radius of the Earth, 6,371,000 meters |
| d | Resulting distance in meters |

---

## 3. Implementation

**File:** `util/GeoUtils.java`

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

## 4. Geo-Fence Rule

```
if (distance > event.radiusMeters)  ->  LocationMismatchException
```

| Condition | Result |
|-----------|--------|
| Distance is less than or equal to the radius | Attendance is allowed |
| Distance is greater than the radius | Attendance is rejected with error code `LOCATION_MISMATCH` |

The default radius is 50 meters. It is stored per event and can be set by the administrator.

---

## 5. Verification of Distance Results

The formula was evaluated independently of the Java code, using the same constants, for points that start at the event location (12.9716, 77.5946) and move north, so that only the latitude changes.

| Test | Second point | Expected | Measured |
|------|--------------|:--------:|:--------:|
| Identical point | (12.9716, 77.5946) | 0 m | 0 m |
| Short displacement | (12.9720, 77.5946) | about 44 m | 44 m |
| Medium displacement | (12.9725, 77.5946) | about 100 m | 100 m |
| Long displacement | (12.9761, 77.5946) | about 500 m | 500 m |
| Very long displacement | (12.9806, 77.5946) | about 1001 m | 1001 m |

One degree of latitude corresponds to about 111,195 meters on this sphere, so a change of 0.0045 degrees corresponds to about 500 meters.

---

## 6. Boundary Conditions (Radius of 50 Meters)

The following behaviour follows directly from the rule in Section 4.

| Distance from event | Expected behaviour |
|:-------------------:|--------------------|
| 0 m | Allowed |
| 25 m | Allowed |
| 49 m | Allowed |
| 50 m | Allowed |
| 51 m | Rejected |
| 100 m | Rejected |
| 500 m | Rejected |

The rejection of a location about 500 meters away was also confirmed against the running backend (see `exception-testing.md`).

---

## 7. Limitations

1. **GPS accuracy.** Consumer GPS readings can differ from the true position by roughly 10 to 20 meters, which is why the default radius is 50 meters rather than a very small value.
2. **Trust in submitted coordinates.** The backend calculates the distance from the coordinates it receives. The accuracy of the check therefore depends on the client reporting the true position of the student.