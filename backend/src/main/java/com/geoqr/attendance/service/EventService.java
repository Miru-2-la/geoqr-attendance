package com.geoqr.attendance.service;

import com.geoqr.attendance.dto.CreateEventRequest;
import com.geoqr.attendance.exception.ResourceNotFoundException;
import com.geoqr.attendance.model.Event;
import com.geoqr.attendance.model.User;
import com.geoqr.attendance.repository.EventRepository;
import com.geoqr.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    public Event createEvent(CreateEventRequest request) {
        User creator = userRepository.findById(request.getCreatedBy())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setRadiusMeters(request.getRadiusMeters() != null ?
                request.getRadiusMeters() : 50);
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setCreatedBy(creator);

        return eventRepository.save(event);
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Event> getEventsByAdmin(Long adminId) {
        return eventRepository.findByCreatedByIdOrderByCreatedAtDesc(adminId);
    }
}