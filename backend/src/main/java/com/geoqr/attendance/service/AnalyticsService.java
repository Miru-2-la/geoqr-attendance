package com.geoqr.attendance.service;

import com.geoqr.attendance.model.Attendance;
import com.geoqr.attendance.report.ReportGenerator;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportService {

    private final ReportGenerator csvReportGenerator;
    private final ReportGenerator pdfReportGenerator;

    public ReportService(
            @Qualifier("csvReportGenerator") ReportGenerator csvReportGenerator,
            @Qualifier("pdfReportGenerator") ReportGenerator pdfReportGenerator) {
        this.csvReportGenerator = csvReportGenerator;
        this.pdfReportGenerator = pdfReportGenerator;
    }

    public String generateReport(List<Attendance> records, String format) {
        ReportGenerator generator;
        if ("pdf".equalsIgnoreCase(format)) {
            generator = pdfReportGenerator;
        } else {
            generator = csvReportGenerator;
        }
        return generator.generateReport(records);
    }

    public String getFileExtension(String format) {
        if ("pdf".equalsIgnoreCase(format)) {
            return pdfReportGenerator.getFileExtension();
        }
        return csvReportGenerator.getFileExtension();
    }

    public String getContentType(String format) {
        if ("pdf".equalsIgnoreCase(format)) {
            return pdfReportGenerator.getContentType();
        }
        return csvReportGenerator.getContentType();
    }
}