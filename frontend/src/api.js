import { API_BASE_URL } from "./config.js";
import { getToken } from "./auth.js";

function buildHeaders(extra = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...extra,
    };
    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: buildHeaders(options.headers || {}),
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const payload = await res.json();
        if (!res.ok || payload.status === "ERROR") {
            const err = new Error(payload.message || "Request failed");
            err.httpStatus = res.status;
            err.errorCode = payload.errorCode || null;
            throw err;
        }
        return payload.data;
    }

    if (!res.ok) {
        const text = await res.text();
        const err = new Error(text || "Request failed");
        err.httpStatus = res.status;
        throw err;
    }

    return res;
}

// --- API Endpoints ---

export function login(email, password, role) {
    return request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
    });
}

export function createEvent(payload) {
    return request("/api/events", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function getAllEvents() {
    return request("/api/events", { method: "GET" });
}

export function getEventById(eventId) {
    return request(`/api/events/${eventId}`, { method: "GET" });
}

export function getEventsByAdmin(adminId) {
    return request(`/api/events/admin/${adminId}`, { method: "GET" });
}

export function scanAttendance(payload) {
    return request("/api/scan", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function getAttendanceByEvent(eventId) {
    return request(`/api/attendance/event/${eventId}`, { method: "GET" });
}

export function getAttendanceByStudent(studentId) {
    return request(`/api/attendance/student/${studentId}`, { method: "GET" });
}

export function getRecentAttendance() {
    return request("/api/attendance/recent", { method: "GET" });
}

export function getAttendanceCount(eventId) {
    return request(`/api/attendance/count/${eventId}`, { method: "GET" });
}

export function getAtRiskStudents() {
    return request("/api/analytics/at-risk", { method: "GET" });
}

export function getAttendanceTrend() {
    return request("/api/analytics/trend", { method: "GET" });
}

export async function downloadReport(format) {
    const path = format === "pdf" ? "/api/reports/pdf" : "/api/reports/csv";
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: buildHeaders(),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const payload = await res.json();
            const err = new Error(payload.message || "Report download failed");
            err.httpStatus = res.status;
            err.errorCode = payload.errorCode || null;
            throw err;
        }
        const text = await res.text();
        const err = new Error(text || "Report download failed");
        err.httpStatus = res.status;
        throw err;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
export function getQrToken(eventId) {
    return request(`/api/events/${eventId}/qr-token`, { method: "GET" });
}