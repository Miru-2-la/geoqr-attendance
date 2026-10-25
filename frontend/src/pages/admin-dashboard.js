import { getAllEvents, getRecentAttendance, getAtRiskStudents, getAttendanceTrend } from "../api.js";
import { el, card, statCard, loading, errorState } from "../ui.js";
import { getErrorMessage } from "../utils/errorMessages.js";

export async function renderAdminDashboard(container) {
    const box = card("Admin Dashboard", [loading()], "Overview of events, attendance, analytics, and reports");
    container.appendChild(box);

    try {
        // Fetch all dashboard data at the same time for speed
        const [events, recent, atRisk, trend] = await Promise.all([
            getAllEvents(),
            getRecentAttendance(),
            getAtRiskStudents(),
            getAttendanceTrend(),
        ]);

        // Clear the loading spinner (keep the title and subtitle)
        while (box.children.length > 2) {
            box.removeChild(box.lastChild);
        }

        // Build the stats grid
        const grid = el("div", { className: "grid grid-4" }, [
            statCard("Total Events", events.length),
            statCard("Recent Attendance Records", recent.length),
            statCard("At-Risk Students", atRisk.length, "Below 75% attendance"),
            statCard("Trend Points", trend.length, "Last 7 days"),
        ]);

        // Build the navigation links to other admin pages
        const links = el("div", { className: "row mt-lg" }, [
            el("a", { href: "#/admin/events" }, [el("button", { className: "secondary", textContent: "Manage Events" })]),
            el("a", { href: "#/admin/live-attendance" }, [el("button", { className: "secondary", textContent: "Live Attendance" })]),
            el("a", { href: "#/admin/analytics" }, [el("button", { className: "secondary", textContent: "Analytics" })]),
            el("a", { href: "#/admin/reports" }, [el("button", { className: "secondary", textContent: "Reports" })]),
        ]);

        box.appendChild(grid);
        box.appendChild(links);

    } catch (err) {
        // Clear loading and show error
        while (box.children.length > 2) {
            box.removeChild(box.lastChild);
        }
        box.appendChild(errorState(getErrorMessage(err, "Failed to load dashboard.")));
    }
}