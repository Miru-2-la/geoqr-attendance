package com.geoqr.attendance.controller;

import com.geoqr.attendance.dto.ApiResponse;
import com.geoqr.attendance.dto.CreateEventRequest;
import com.geoqr.attendance.model.Event;
import com.geoqr.attendance.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Event>> createEvent(@RequestBody CreateEventRequest request) {
        Event event = eventService.createEvent(request);
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", event));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Event>>> getAllEvents() {
        List<Event> events = eventService.getAllEvents();
        return ResponseEntity.ok(ApiResponse.success("Events retrieved", events));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Event>> getEventById(@PathVariable Long id) {
        Event event = eventService.getEventById(id);
        return ResponseEntity.ok(ApiResponse.success("Event found", event));
    }

    @GetMapping("/admin/{adminId}")
    public ResponseEntity<ApiResponse<List<Event>>> getEventsByAdmin(@PathVariable Long adminId) {
        List<Event> events = eventService.getEventsByAdmin(adminId);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved", events));
    }
}