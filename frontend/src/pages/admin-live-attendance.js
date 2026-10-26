import { getUser } from "../auth.js";
import { getAllEvents, getAttendanceByEvent, getAttendanceCount } from "../api.js";
import { el, card, table, loading, emptyState, errorState, badge } from "../ui.js";
import { formatDateTime, shortDeviceId } from "../utils/format.js";
import { getErrorMessage } from "../utils/errorMessages.js";

export async function renderAdminLiveAttendance(container) {
    const user = getUser();
    if (!user || user.role !== "ADMIN") {
        window.location.hash = "#/login";
        return;
    }

    const eventSelect = el("select");
    const refreshBtn = el("button", { className: "secondary", textContent: "Refresh Now" });
    const countBox = el("div", { className: "muted", textContent: "Select an event." });
    const resultBox = el("div");

    container.appendChild(
        card(
            "Live Attendance",
            [
                el("div", { className: "row" }, [eventSelect, refreshBtn]),
                countBox,
                resultBox,
            ],
            "Auto-refreshes every 7 seconds"
        )
    );

    let timer = null;
    let selectedEventId = null;

    // 1. Load events into the dropdown
    try {
        const events = await getAllEvents();
        if (!events || !events.length) {
            resultBox.appendChild(emptyState("No events found."));
            return;
        }

        eventSelect.appendChild(el("option", { value: "", textContent: "- Select Event -" }));
        for (const evt of events) {
            eventSelect.appendChild(
                el("option", { value: String(evt.id), textContent: `${evt.id} - ${evt.title}` })
            );
        }

        eventSelect.value = String(events[0].id);
        selectedEventId = events[0].id;
        
        await loadAttendance();
        startTimer();

    } catch (err) {
        resultBox.appendChild(errorState(getErrorMessage(err, "Failed to load events.")));
    }

    // 2. Event Listeners
    eventSelect.addEventListener("change", async () => {
        selectedEventId = eventSelect.value ? Number(eventSelect.value) : null;
        await loadAttendance();
        startTimer(); // Reset the timer so it doesn't clash
    });

    refreshBtn.addEventListener("click", async () => {
        await loadAttendance();
        startTimer();
    });

    // 3. Functions
    function startTimer() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
            await loadAttendance();
            startTimer(); // Loop the timer
        }, 7000);
    }

    async function loadAttendance() {
        if (!selectedEventId) {
            countBox.textContent = "Select an event.";
            resultBox.innerHTML = "";
            return;
        }

        // Only show the big loading spinner on manual load/refresh, not background polling
        // (For simplicity, we will just clear the box)
        resultBox.innerHTML = "";
        resultBox.appendChild(loading("Loading attendance..."));

        try {
            const [records, count] = await Promise.all([
                getAttendanceByEvent(selectedEventId),
                getAttendanceCount(selectedEventId),
            ]);

            while (resultBox.firstChild) resultBox.removeChild(resultBox.firstChild);
            countBox.textContent = `Total present: ${count}`;

            if (!records || !records.length) {
                resultBox.appendChild(emptyState("No attendance records yet."));
                return;
            }

            const rows = records.map((record) => [
                formatDateTime(record.timestamp),
                record.studentId,
                badge(record.status || "PRESENT", "green"),
                record.distanceMeters != null ? record.distanceMeters : "-",
                shortDeviceId(record.deviceId),
            ]);

            resultBox.appendChild(
                table(["Timestamp", "Student ID", "Status", "Distance (m)", "Device"], rows)
            );
        } catch (err) {
            while (resultBox.firstChild) resultBox.removeChild(resultBox.firstChild);
            resultBox.appendChild(errorState(getErrorMessage(err, "Failed to load attendance.")));
        }
    }

    // 4. Cleanup function for the router
    return () => {
        if (timer) clearTimeout(timer);
    };
}