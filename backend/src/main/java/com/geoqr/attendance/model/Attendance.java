package com.geoqr.attendance.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Data
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "student_lat")
    private Double studentLat;

    @Column(name = "student_long")
    private Double studentLong;

    @Column(name = "distance_meters")
    private Double distanceMeters;

    @Column(nullable = false)
    private String status = "PRESENT";

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}