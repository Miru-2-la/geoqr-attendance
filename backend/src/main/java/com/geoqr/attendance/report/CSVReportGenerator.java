package com.geoqr.attendance.report;

import com.geoqr.attendance.model.Attendance;
import org.springframework.stereotype.Component;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component("csvReportGenerator")
public class CSVReportGenerator implements ReportGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public String generateReport(List<Attendance> records) {
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Event ID,Student ID,Device ID,Distance (m),Status,Timestamp\n");
        for (Attendance record : records) {
            csv.append(record.getId()).append(",");
            csv.append(record.getEventId()).append(",");
            csv.append(record.getStudentId()).append(",");
            csv.append(record.getDeviceId()).append(",");
            csv.append(record.getDistanceMeters()).append(",");
            csv.append(record.getStatus()).append(",");
            csv.append(record.getTimestamp().format(DATE_FORMAT)).append("\n");
        }
        return csv.toString();
    }

    @Override
    public String getFileExtension() { return "csv"; }

    @Override
    public String getContentType() { return "text/csv"; }
}