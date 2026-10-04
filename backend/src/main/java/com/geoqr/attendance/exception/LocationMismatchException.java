package com.geoqr.attendance.exception;

public class LocationMismatchException extends RuntimeException {
    public LocationMismatchException(String message) {
        super(message);
    }
}