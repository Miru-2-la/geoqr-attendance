package com.geoqr.attendance.config;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.geoqr.attendance.model.Admin;
import com.geoqr.attendance.model.Event;
import com.geoqr.attendance.model.Student;
import com.geoqr.attendance.repository.EventRepository;
import com.geoqr.attendance.repository.UserRepository;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository, EventRepository eventRepository, PasswordEncoder encoder) {
        return args -> {
            // Only run if the database is completely empty
            if (userRepository.count() > 0) return;

            // 1. Create Admin
            Admin admin = new Admin();
            admin.setName("Dr. Smith");
            admin.setEmail("admin@geoqr.com");
            admin.setPassword(encoder.encode("admin123"));
            admin.setAdminCode("ADM001");
            userRepository.save(admin);

            // 2. Create the main Student (Arun)
            Student student1 = new Student();
            student1.setName("Arun Kumar");
            student1.setEmail("student@geoqr.com");
            student1.setPassword(encoder.encode("student123"));
            student1.setRollNumber("CS2024001");
            userRepository.save(student1);

            // 3. Create the Team Members!
            Student grithanyaa = new Student();
            grithanyaa.setName("Grithanyaa");
            grithanyaa.setEmail("grithanyaa@geoqr.com");
            grithanyaa.setPassword(encoder.encode("student123"));
            grithanyaa.setRollNumber("CS2024002");
            userRepository.save(grithanyaa);

            Student eshanika = new Student();
            eshanika.setName("Eshanika");
            eshanika.setEmail("eshanika@geoqr.com");
            eshanika.setPassword(encoder.encode("student123"));
            eshanika.setRollNumber("CS2024003");
            userRepository.save(eshanika);

            Student mirudhula = new Student();
            mirudhula.setName("Mirudhula");
            mirudhula.setEmail("mirudhula@geoqr.com");
            mirudhula.setPassword(encoder.encode("student123"));
            mirudhula.setRollNumber("CS2024004");
            userRepository.save(mirudhula);

            // 4. Create 16 more Students using a loop!
            for (int i = 5; i <= 20; i++) {
                Student s = new Student();
                s.setName("Student " + i);
                s.setEmail("student" + i + "@geoqr.com"); 
                s.setPassword(encoder.encode("student123"));
                s.setRollNumber("CS202400" + i);
                userRepository.save(s);
            }

            // 5. Create a Demo Event
            Event event = new Event();
            event.setTitle("Data Science Lecture");
            event.setDescription("Introduction to Machine Learning");
            event.setLatitude(12.9716);
            event.setLongitude(77.5946);
            event.setRadiusMeters(500);
            event.setEventDate(LocalDate.now());
            event.setStartTime(LocalTime.of(10, 0));
            event.setEndTime(LocalTime.of(11, 0));
            event.setCreatedBy(admin);
            eventRepository.save(event);

            System.out.println("==================================================");
            System.out.println("Database seeded successfully with team members and 20 students!");
            System.out.println("==================================================");
        };
    }
}