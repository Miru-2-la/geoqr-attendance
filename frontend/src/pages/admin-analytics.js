import { getAtRiskStudents, getAttendanceTrend } from "../api.js";
import { el, card, table, loading, emptyState, errorState, badge } from "../ui.js";
import { getErrorMessage } from "../utils/errorMessages.js";

export async function renderAdminAnalytics(container) {
    const atRiskBox = card("At-Risk Students", [loading()], "Students below 75% attendance");
    const trendBox = card("Attendance Trend", [loading()], "Last 7 days");
    
    container.appendChild(atRiskBox);
    container.appendChild(trendBox);

    let chartInstance = null;

    try {
        const [atRiskData, trendData] = await Promise.all([
            getAtRiskStudents(),
            getAttendanceTrend(),
        ]);

        renderAtRisk(atRiskData);
        renderTrend(trendData);
    } catch (err) {
        // Clear loading state on error
        while (atRiskBox.children.length > 2) atRiskBox.removeChild(atRiskBox.lastChild);
        atRiskBox.appendChild(errorState(getErrorMessage(err, "Failed to load analytics.")));
    }

    function renderAtRisk(rowsData) {
        while (atRiskBox.children.length > 2) atRiskBox.removeChild(atRiskBox.lastChild);

        if (!rowsData || !rowsData.length) {
            atRiskBox.appendChild(emptyState("No at-risk students found."));
            return;
        }

        const rows = rowsData.map((student) => [
            student.id,
            student.name,
            student.rollNumber || "-",
            student.eventsAttended,
            student.totalEvents,
            `${student.attendancePercentage}%`,
            badge("At Risk", "red"),
        ]);

        atRiskBox.appendChild(
            table(["ID", "Name", "Roll Number", "Attended", "Total Events", "Attendance %", "Status"], rows)
        );
    }

    function renderTrend(trendData) {
        while (trendBox.children.length > 2) trendBox.removeChild(trendBox.lastChild);

        if (!trendData || !trendData.length) {
            trendBox.appendChild(emptyState("No trend data found."));
            return;
        }

        // Create the canvas element for Chart.js
        const canvas = el("canvas", { height: "100" });
        trendBox.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        const labels = trendData.map((item) => item.date);
        const values = trendData.map((item) => item.count);

        // Initialize Chart.js
        if (typeof Chart !== "undefined") {
            chartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Attendance Count",
                            data: values,
                            borderColor: "#356df3", // Blue
                            backgroundColor: "rgba(53, 109, 243, 0.1)",
                            borderWidth: 2,
                            tension: 0.3, // Curves the line slightly
                            fill: true,
                            pointBackgroundColor: "#356df3",
                            pointRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 }, // Only show whole numbers
                        },
                    },
                },
            });
        } else {
            trendBox.appendChild(errorState("Chart library not loaded."));
        }
    }

    // Cleanup function to destroy the chart when navigating away
    return () => {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    };
}