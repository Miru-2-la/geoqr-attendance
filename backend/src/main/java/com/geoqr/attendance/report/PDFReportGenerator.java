package com.geoqr.attendance.report;

import com.geoqr.attendance.model.Attendance;
import org.springframework.stereotype.Component;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component("pdfReportGenerator")
public class PDFReportGenerator implements ReportGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public String generateReport(List<Attendance> records) {
        StringBuilder pdf = new StringBuilder();
        pdf.append("========================================\n");
        pdf.append("     GEOQR ATTENDANCE REPORT\n");
        pdf.append("========================================\n\n");
        pdf.append("Total Records: ").append(records.size()).append("\n\n");
        pdf.append("----------------------------------------\n");

        for (Attendance record : records) {
            pdf.append("Attendance ID: ").append(record.getId()).append("\n");
            pdf.append("Event ID: ").append(record.getEventId()).append("\n");
            pdf.append("Student ID: ").append(record.getStudentId()).append("\n");
            pdf.append("Status: ").append(record.getStatus()).append("\n");
            pdf.append("Timestamp: ").append(record.getTimestamp().format(DATE_FORMAT)).append("\n");
            pdf.append("----------------------------------------\n");
        }
        return pdf.toString();
    }

    @Override
    public String getFileExtension() { return "pdf"; }

    @Override
    public String getContentType() { return "application/pdf"; }
}