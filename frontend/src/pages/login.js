import { login } from "../api.js";
import { saveSession } from "../auth.js";
import { el, card } from "../ui.js";
import { showToast } from "../components/toast.js";
import { getErrorMessage } from "../utils/errorMessages.js";

export function renderLogin(container) {
    const email = el("input", { type: "email", placeholder: "email" });
    const password = el("input", { type: "password", placeholder: "password" });
    const role = el("select", {}, [
        el("option", { value: "STUDENT", textContent: "STUDENT" }),
        el("option", { value: "ADMIN", textContent: "ADMIN" }),
    ]);

    const submit = el("button", { type: "submit", textContent: "Login" });

    const form = el("form", { className: "grid" }, [
        el("div", {}, [el("label", { className: "label", textContent: "Email" }), email]),
        el("div", {}, [el("label", { className: "label", textContent: "Password" }), password]),
        el("div", {}, [el("label", { className: "label", textContent: "Role" }), role]),
        submit,
    ]);

    const demo = el("div", { className: "alert info" }, [
        el("strong", { textContent: "Demo accounts: " }),
        el("span", { textContent: "admin@geoqr.com / admin123 / ADMIN" }),
        el("br"),
        el("span", { textContent: "student@geoqr.com / student123 / STUDENT" }),
    ]);

    const secureWarning = getSecureContextWarning();

    // Add the card to the page container
    container.appendChild(
        card(
            "GeoQR Attend Login",
            [secureWarning, demo, form],
            "Secure location-based attendance system"
        )
    );

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Show loading state on button
        submit.disabled = true;
        submit.textContent = "";
        submit.appendChild(el("span", { className: "loader" }));
        submit.appendChild(document.createTextNode("Logging in..."));

        try {
            const data = await login(email.value.trim(), password.value, role.value);
            saveSession(data.token, data.user);
            showToast("Login successful", "success");

            // Redirect based on role
            if (data.user.role === "ADMIN") {
                window.location.hash = "#/admin/dashboard";
            } else {
                window.location.hash = "#/student/scan";
            }
        } catch (err) {
            showToast(getErrorMessage(err, "Login failed"), "error");
        } finally {
            // Restore button state
            submit.disabled = false;
            submit.textContent = "Login";
        }
    });
}

function getSecureContextWarning() {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const isHttps = window.location.protocol === "https:";

    if (isLocalhost || isHttps) return el("div"); // Return empty div if secure

    return el("div", {
        className: "alert warn",
        textContent: "Camera, geolocation, and crypto APIs require http://localhost or https://. Do not use http://192.168.x.x for demo.",
    });
}