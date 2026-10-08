package com.geoqr.attendance.jdbc;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@Component
public class JdbcDemoRunner implements CommandLineRunner {

    private final JdbcEventDao dao;

    public JdbcDemoRunner(JdbcEventDao dao) {
        this.dao = dao;
    }

    @Override
    public void run(String... args) {
        System.out.println("--- JDBC Demo: Existing Events ---");
        try {
            List<Map<String, Object>> events = dao.findAllEvents();
            for (Map<String, Object> e : events) {
                System.out.println(e.get("id") + " | " + e.get("title") + " | " + e.get("eventDate"));
            }

            System.out.println("--- JDBC Demo: Inserting ---");
            long newId = dao.insertEvent("JDBC Demo Event",
                    "Inserted via raw JDBC", 12.9716, 77.5946, 100);
            System.out.println("Inserted id: " + newId);

            System.out.println("--- JDBC Demo: Updating ---");
            int updated = dao.updateEventRadius(newId, 250);
            System.out.println("Updated rows: " + updated);

            System.out.println("--- JDBC Demo: Deleting ---");
            int deleted = dao.deleteEvent(newId);
            System.out.println("Deleted rows: " + deleted);

            System.out.println("--- JDBC Demo finished ---");
        } catch (SQLException e) {
            System.out.println("JDBC Demo failed: " + e.getMessage());
        }
    }
}