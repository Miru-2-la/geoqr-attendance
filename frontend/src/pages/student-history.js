import { getUser } from "../auth.js";
import { getAttendanceByStudent, getEventById } from "../api.js";
import { el, card, table, loading, emptyState, errorState, badge } from "../ui.js";
import { formatDateTime, shortDeviceId } from "../utils/format.js";
import { getErrorMessage } from "../utils/errorMessages.js";
import { showToast } from "../components/toast.js";

export async function renderStudentHistory(container) {
    const user = getUser();
    if (!user || user.role !== "STUDENT") {
        window.location.hash = "#/login";
        return;
    }

    const box = card("My Attendance History", [loading()], "Records for your student account");
    container.appendChild(box);

    try {
        const records = await getAttendanceByStudent(user.id);

        // Clear the loading state (keep the title and subtitle which are the first 2 children)
        while (box.children.length > 2) {
            box.removeChild(box.lastChild);
        }

        if (!records || records.length === 0) {
            box.appendChild(emptyState("No attendance records found."));
            return;
        }

        const eventTitleCache = new Map();

        async function getEventTitle(eventId) {
            if (eventTitleCache.has(eventId)) return eventTitleCache.get(eventId);
            try {
                const event = await getEventById(eventId);
                const title = event.title || `Event ${eventId}`;
                eventTitleCache.set(eventId, title);
                return title;
            } catch {
                eventTitleCache.set(eventId, `Event ${eventId}`);
                return `Event ${eventId}`;
            }
        }

        const rows = [];
        for (const record of records) {
            const title = await getEventTitle(record.eventId);
            
            rows.push([
                formatDateTime(record.timestamp),
                title,
                record.eventId,
                badge(record.status || "PRESENT", "green"),
                record.distanceMeters != null ? record.distanceMeters : "-",
                shortDeviceId(record.deviceId)
            ]);
        }

        box.appendChild(
            table(
                ["Timestamp", "Event", "Event ID", "Status", "Distance (m)", "Device"],
                rows
            )
        );

    } catch (err) {
        const message = getErrorMessage(err, "Failed to load history.");
        box.appendChild(errorState(message));
        showToast(message, "error");
    }
}