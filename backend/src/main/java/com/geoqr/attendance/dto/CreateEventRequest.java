package com.geoqr.attendance.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateEventRequest {
    private String title;
    private String description;
    private Double latitude;
    private Double longitude;
    private Integer radiusMeters = 50;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long createdBy;
}