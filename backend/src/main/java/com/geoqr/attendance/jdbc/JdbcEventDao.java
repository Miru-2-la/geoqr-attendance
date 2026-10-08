package com.geoqr.attendance.jdbc;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class JdbcEventDao {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    public List<Map<String, Object>> findAllEvents() throws SQLException {
        List<Map<String, Object>> events = new ArrayList<>();
        String sql = "SELECT id, title, event_date FROM events";

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                row.put("id", rs.getLong("id"));
                row.put("title", rs.getString("title"));
                row.put("eventDate", rs.getString("event_date"));
                events.add(row);
            }
        }
        return events;
    }

    public long insertEvent(String title, String description,
                            double latitude, double longitude,
                            int radiusMeters) throws SQLException {
        String sql = "INSERT INTO events " +
                "(title, description, latitude, longitude, radius_meters, " +
                "event_date, start_time, end_time, created_by, created_at) " +
                "VALUES (?, ?, ?, ?, ?, CURDATE(), '10:00:00', '11:00:00', 1, NOW())";

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, title);
            ps.setString(2, description);
            ps.setDouble(3, latitude);
            ps.setDouble(4, longitude);
            ps.setInt(5, radiusMeters);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
            }
        }
        return -1;
    }

    public int updateEventRadius(long eventId, int newRadius) throws SQLException {
        String sql = "UPDATE events SET radius_meters = ? WHERE id = ?";

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, newRadius);
            ps.setLong(2, eventId);
            return ps.executeUpdate();
        }
    }

    public int deleteEvent(long eventId) throws SQLException {
        String sql = "DELETE FROM events WHERE id = ?";

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, eventId);
            return ps.executeUpdate();
        }
    }
}