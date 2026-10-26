package com.geoqr.attendance.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.geoqr.attendance.dto.ScanRequest;
import com.geoqr.attendance.exception.LocationMismatchException;
import com.geoqr.attendance.exception.ProxyAttendanceException;
import com.geoqr.attendance.exception.ResourceNotFoundException;
import com.geoqr.attendance.model.Attendance;
import com.geoqr.attendance.model.Event;
import com.geoqr.attendance.repository.AttendanceRepository;
import com.geoqr.attendance.repository.EventRepository;
import com.geoqr.attendance.util.GeoUtils;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EventRepository eventRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             EventRepository eventRepository) {
        this.attendanceRepository = attendanceRepository;
        this.eventRepository = eventRepository;
    }

    public Attendance processAttendance(Long studentId, ScanRequest request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invalid QR code - Event not found"));

        if (attendanceRepository.existsByEventIdAndStudentId(
                request.getEventId(), studentId)) {
            throw new ProxyAttendanceException(
                    "You have already marked attendance for this event");
        }

        double distance = GeoUtils.getDistance(
                event.getLatitude(),
                event.getLongitude(),
                request.getStudentLat(),
                request.getStudentLong()
        );

        if (distance > event.getRadiusMeters()) {
            throw new LocationMismatchException(
                    String.format("You are %.0fm away from the event location. " +
                            "Maximum allowed: %dm", distance, event.getRadiusMeters()));
        }

        if (attendanceRepository.existsByEventIdAndDeviceId(
                request.getEventId(), request.getDeviceId())) {
            throw new ProxyAttendanceException(
                    "Proxy detected! This device has already marked attendance " +
                            "for this event with another account.");
        }

        Attendance attendance = new Attendance();
        attendance.setEventId(request.getEventId());
        attendance.setStudentId(studentId);
        attendance.setDeviceId(request.getDeviceId());
        attendance.setStudentLat(request.getStudentLat());
        attendance.setStudentLong(request.getStudentLong());
        attendance.setDistanceMeters(Math.round(distance * 100.0) / 100.0);
        attendance.setStatus("PRESENT");

        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAttendanceByEvent(Long eventId) {
        return attendanceRepository.findByEventIdOrderByTimestampDesc(eventId);
    }

    public List<Attendance> getAttendanceByStudent(Long studentId) {
        return attendanceRepository.findByStudentIdOrderByTimestampDesc(studentId);
    }

    public List<Attendance> getRecentAttendance() {
        return attendanceRepository.findRecentAttendance();
    }

    public long getAttendanceCount(Long eventId) {
        return attendanceRepository.countByEventId(eventId);
    }
}