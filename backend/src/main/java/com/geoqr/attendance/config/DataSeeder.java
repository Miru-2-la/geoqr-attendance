package com.geoqr.attendance.config;

import com.geoqr.attendance.model.Admin;
import com.geoqr.attendance.model.Event;
import com.geoqr.attendance.model.Student;
import com.geoqr.attendance.repository.EventRepository;
import com.geoqr.attendance.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalTime;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seedData(UserRepository userRepository, EventRepository eventRepository) {
        return args -> {
            // Only seed if the database is empty
            if (userRepository.count() > 0) return;

            // 1. Create Admin
            Admin admin = new Admin();
            admin.setName("Dr. Smith");
            admin.setEmail("admin@geoqr.com");
            admin.setPassword("admin123");
            admin.setAdminCode("ADM001");
            userRepository.save(admin);

            // 2. Create Student 1 (Arun)
            Student student = new Student();
            student.setName("Arun Kumar");
            student.setEmail("student@geoqr.com");
            student.setPassword("student123");
            student.setRollNumber("CS2024001");
            userRepository.save(student);

            // 3. Create Student 2 (Priya - for proxy demo)
            Student student2 = new Student();
            student2.setName("Priya Sharma");
            student2.setEmail("priya@geoqr.com");
            student2.setPassword("student123");
            student2.setRollNumber("CS2024002");
            userRepository.save(student2);

            // 4. Create Student 3 (Prof - for professor demo)
            Student prof = new Student();
            prof.setName("Prof. Demo");
            prof.setEmail("prof@geoqr.com");
            prof.setPassword("student123");
            prof.setRollNumber("PROF001");
            userRepository.save(prof);

            // 5. Create Demo Event (Runs all day for easy demo)
            Event event = new Event();
            event.setTitle("Data Science Lecture");
            event.setDescription("Introduction to Machine Learning");
            event.setLatitude(12.9716);
            event.setLongitude(77.5946);
            event.setRadiusMeters(50);
            event.setEventDate(LocalDate.now());
            event.setStartTime(LocalTime.of(0, 0));   // 12:00 AM
            event.setEndTime(LocalTime.of(23, 59));   // 11:59 PM
            event.setCreatedBy(admin);
            eventRepository.save(event);

            System.out.println("==================================================");
            System.out.println("DATABASE SEEDED SUCCESSFULLY!");
            System.out.println("Admin   : admin@geoqr.com / admin123");
            System.out.println("Student : student@geoqr.com / student123");
            System.out.println("Student : priya@geoqr.com / student123");
            System.out.println("Student : prof@geoqr.com / student123");
            System.out.println("==================================================");
        };
    }
}
