package com.geoqr.attendance.report;

import com.geoqr.attendance.model.Attendance;
import java.util.List;

public interface ReportGenerator {
    String generateReport(List<Attendance> records);
    String getFileExtension();
    String getContentType();
}