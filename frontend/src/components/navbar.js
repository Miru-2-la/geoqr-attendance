import { getUser, logout } from "../auth.js";
import { el } from "../ui.js";

export function renderNavbar() {
    const user = getUser();
    if (!user) return null;

    const links = [];

    if (user.role === "STUDENT") {
        links.push(navLink("#/student/scan", "Scan Attendance"));
        links.push(navLink("#/student/history", "My History"));
    }

    if (user.role === "ADMIN") {
        links.push(navLink("#/admin/dashboard", "Dashboard"));
        links.push(navLink("#/admin/events", "Events"));
        links.push(navLink("#/admin/live-attendance", "Live Attendance"));
        links.push(navLink("#/admin/analytics", "Analytics"));
        links.push(navLink("#/admin/reports", "Reports"));
    }

    const right = el("div", { className: "row" }, [
        el("span", { className: "muted small", textContent: `${user.name} · ${user.role}` }),
        el("button", {
            className: "secondary",
            textContent: "Logout",
            onClick: () => logout(),
        }),
    ]);

    return el("nav", { className: "navbar" }, [
        el("div", { className: "nav-brand", textContent: "GeoQR Attend" }),
        el("div", { className: "nav-links" }, links),
        right,
    ]);
}

function navLink(hash, label) {
    const a = el("a", { href: hash, textContent: label });
    if (window.location.hash === hash) {
        a.classList.add("active");
    }
    return a;
}