package com.geoqr.attendance.dto;

import lombok.Data;

@Data
public class ScanRequest {
    private Long eventId;
    private Long studentId;
    private Double studentLat;
    private Double studentLong;
    private String deviceId;
}
