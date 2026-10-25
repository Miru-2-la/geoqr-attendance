import { isLoggedIn, getUser } from "./auth.js";
import { clear, el } from "./ui.js";
import { renderNavbar } from "./components/navbar.js";

// Import the pages (we will create these files next!)
import { renderLogin } from "./pages/login.js";
import { renderStudentScan } from "./pages/student-scan.js";
import { renderStudentHistory } from "./pages/student-history.js";
import { renderAdminDashboard } from "./pages/admin-dashboard.js";
import { renderAdminEvents } from "./pages/admin-events.js";
import { renderAdminLiveAttendance } from "./pages/admin-live-attendance.js";
import { renderAdminAnalytics } from "./pages/admin-analytics.js";
import { renderAdminReports } from "./pages/admin-reports.js";

let currentCleanup = null;

const routes = {
    "#/login": { public: true, render: renderLogin },
    "#/student/scan": { role: "STUDENT", render: renderStudentScan },
    "#/student/history": { role: "STUDENT", render: renderStudentHistory },
    "#/admin/dashboard": { role: "ADMIN", render: renderAdminDashboard },
    "#/admin/events": { role: "ADMIN", render: renderAdminEvents },
    "#/admin/live-attendance": { role: "ADMIN", render: renderAdminLiveAttendance },
    "#/admin/analytics": { role: "ADMIN", render: renderAdminAnalytics },
    "#/admin/reports": { role: "ADMIN", render: renderAdminReports },
};

export function initRouter() {
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
}

async function renderRoute() {
    if (typeof currentCleanup === "function") {
        try {
            currentCleanup();
        } catch {
            // Ignore cleanup errors
        }
    }
    currentCleanup = null;

    const app = document.getElementById("app");
    clear(app);

    const hash = normalizeHash(window.location.hash);
    const route = routes[hash];
    const user = getUser();

    // 1. If route doesn't exist, redirect to default based on login status
    if (!route) {
        if (!isLoggedIn()) {
            return navigate("#/login");
        }
        return navigate(user.role === "ADMIN" ? "#/admin/dashboard" : "#/student/scan");
    }

    // 2. If route is public (Login page)
    if (route.public) {
        if (isLoggedIn()) {
            // If already logged in, redirect away from login page
            return navigate(user.role === "ADMIN" ? "#/admin/dashboard" : "#/student/scan");
        }
        const page = el("div", { className: "page" });
        app.appendChild(page);
        currentCleanup = await route.render(page);
        return;
    }

    // 3. If route is protected and user is NOT logged in
    if (!isLoggedIn()) {
        return navigate("#/login");
    }

    // 4. If route requires a specific role (e.g., ADMIN) and user doesn't match
    if (route.role && user.role !== route.role) {
        return navigate(user.role === "ADMIN" ? "#/admin/dashboard" : "#/student/scan");
    }

    // 5. Render the page!
    const navbar = renderNavbar();
    if (navbar) app.appendChild(navbar);

    const page = el("div", { className: "page" });
    app.appendChild(page);

    try {
        currentCleanup = await route.render(page);
    } catch (err) {
        page.appendChild(
            el("div", { className: "card error-state", textContent: err.message || "Page failed to load." })
        );
    }
}

function normalizeHash(hash) {
    if (!hash || hash === "#" || hash === "#/") return "#/login";
    return hash;
}

function navigate(hash) {
    if (window.location.hash === hash) {
        renderRoute();
    } else {
        window.location.hash = hash;
    }
}