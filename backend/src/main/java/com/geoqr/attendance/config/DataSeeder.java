package com.geoqr.attendance.config;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder; // NEW IMPORT

import com.geoqr.attendance.model.Admin;
import com.geoqr.attendance.model.Event;
import com.geoqr.attendance.model.Student;
import com.geoqr.attendance.repository.EventRepository;
import com.geoqr.attendance.repository.UserRepository;

@Configuration
public class DataSeeder {
    
    // We inject the PasswordEncoder here
    @Bean
    CommandLineRunner seedData(UserRepository userRepository, EventRepository eventRepository, PasswordEncoder encoder) {
        return args -> {
            if (userRepository.count() > 0) return;

            Admin admin = new Admin();
            admin.setName("Dr. Smith");
            admin.setEmail("admin@geoqr.com");
            // ENCRYPT THE PASSWORD
            admin.setPassword(encoder.encode("admin123"));
            admin.setAdminCode("ADM001");
            userRepository.save(admin);

            Student student = new Student();
            student.setName("Arun Kumar");
            student.setEmail("student@geoqr.com");
            // ENCRYPT THE PASSWORD
            student.setPassword(encoder.encode("student123"));
            student.setRollNumber("CS2024001");
            userRepository.save(student);

            Event event = new Event();
            event.setTitle("Data Science Lecture");
            event.setDescription("Introduction to Machine Learning");
            event.setLatitude(12.9716);
            event.setLongitude(77.5946);
            event.setRadiusMeters(50);
            event.setEventDate(LocalDate.now());
            event.setStartTime(LocalTime.of(10, 0));
            event.setEndTime(LocalTime.of(11, 0));
            event.setCreatedBy(admin);
            eventRepository.save(event);

            System.out.println("Database seeded securely: admin@geoqr.com / admin123");
        };
    }
}