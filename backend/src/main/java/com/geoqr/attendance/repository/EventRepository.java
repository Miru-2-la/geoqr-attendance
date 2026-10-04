package com.geoqr.attendance.repository; // <-- IMPORTANT: q not g

import com.geoqr.attendance.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByOrderByCreatedAtDesc();
    List<Event> findByCreatedByIdOrderByCreatedAtDesc(Long adminId);
}