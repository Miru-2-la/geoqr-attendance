import { getUser } from "../auth.js";
import { createEvent, getAllEvents, getQrToken } from "../api.js";
import { el, card, table, loading, emptyState, errorState, badge } from "../ui.js";
import { showToast } from "../components/toast.js";
import { validateEventForm } from "../utils/validation.js";
import { renderQr, downloadQr } from "../utils/qrGenerator.js";
import { getErrorMessage } from "../utils/errorMessages.js";
import { normalizeTime } from "../utils/format.js";

export async function renderAdminEvents(container) {
    const user = getUser();
    if (!user || user.role !== "ADMIN") {
        window.location.hash = "#/login";
        return;
    }

    // --- Form Elements ---
    const title = el("input", { placeholder: "Title" });
    const description = el("textarea", { placeholder: "Description" });
    const latitude = el("input", { type: "number", step: "any", placeholder: "Latitude", value: "12.9716" });
    const longitude = el("input", { type: "number", step: "any", placeholder: "Longitude", value: "77.5946" });
    const radius = el("input", { type: "number", placeholder: "Radius meters", value: "50" });
    const eventDate = el("input", { type: "date" });
    const startTime = el("input", { type: "time" });
    const endTime = el("input", { type: "time" });
    const createBtn = el("button", { textContent: "Create Event" });

    // Set default date to today
    eventDate.value = new Date().toISOString().slice(0, 10);

    const form = el("form", { className: "grid grid-2" }, [
        el("div", {}, [el("label", { className: "label", textContent: "Title" }), title]),
        el("div", {}, [el("label", { className: "label", textContent: "Description" }), description]),
        el("div", {}, [el("label", { className: "label", textContent: "Latitude" }), latitude]),
        el("div", {}, [el("label", { className: "label", textContent: "Longitude" }), longitude]),
        el("div", {}, [el("label", { className: "label", textContent: "Radius Meters" }), radius]),
        el("div", {}, [el("label", { className: "label", textContent: "Event Date" }), eventDate]),
        el("div", {}, [el("label", { className: "label", textContent: "Start Time" }), startTime]),
        el("div", {}, [el("label", { className: "label", textContent: "End Time" }), endTime]),
        el("div", { className: "grid-2" }, [createBtn]),
    ]);

    // --- QR Display Elements ---
    const qrBox = el("div", { id: "qr-code-box" });
    const qrActions = el("div", { className: "row mt-md hidden" });
    const qrCard = card("Event QR Code", [
        qrBox,
        el("p", { className: "muted small", textContent: "Create or select an event to generate QR." }),
        qrActions
    ]);

    // --- Events List Elements ---
    const eventsBox = card("Events", [loading()], "All events");
    
    container.appendChild(card("Create Event", [form], "Admin only. createdBy is injected from session."));
    container.appendChild(qrCard);
    container.appendChild(eventsBox);

    // --- Form Submission ---
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = {
            title: title.value,
            description: description.value,
            latitude: latitude.value,
            longitude: longitude.value,
            radiusMeters: radius.value,
            eventDate: eventDate.value,
            startTime: normalizeTime(startTime.value),
            endTime: normalizeTime(endTime.value),
        };

        const errors = validateEventForm(data);
        if (errors.length) {
            showToast(errors.join(" | "), "error");
            return;
        }

        createBtn.disabled = true;
        createBtn.textContent = "Creating...";

        try {
            const payload = {
                ...data,
                createdBy: user.id,
            };

            const created = await createEvent(payload);
            showToast("Event created successfully", "success");
            showQr(created.id);
            await loadEvents();
        } catch (err) {
            showToast(getErrorMessage(err, "Failed to create event."), "error");
        } finally {
            createBtn.disabled = false;
            createBtn.textContent = "Create Event";
        }
    });

    // --- Functions ---
    
        async function showQr(eventId) {
        qrBox.innerHTML = "Generating secure token...";
        qrActions.classList.add("hidden");

        try {
            // 1. Fetch the secure token from Eshanika's backend
            const tokenData = await getQrToken(eventId);
            
            // 2. Render the QR code with the token
            qrBox.innerHTML = "";
            renderQr(qrBox, eventId, tokenData.token || tokenData); 
            
            qrActions.innerHTML = "";
            qrActions.classList.remove("hidden");

            const downloadBtn = el("button", { className: "secondary", textContent: "Download QR" });
            downloadBtn.addEventListener("click", () => downloadQr(qrBox, `event-${eventId}-qr.png`));

            const copyBtn = el("button", { className: "secondary", textContent: "Copy Event ID" });
            copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(String(eventId));
                    showToast("Event ID copied.", "success");
                } catch {
                    showToast("Clipboard not available.", "warning");
                }
            });

            const liveBtn = el("a", { href: "#/admin/live-attendance" }, [
                el("button", { className: "secondary", textContent: "Live Attendance" })
            ]);

            qrActions.appendChild(downloadBtn);
            qrActions.appendChild(copyBtn);
            qrActions.appendChild(liveBtn);

        } catch (err) {
            qrBox.innerHTML = "";
            showToast("Failed to generate secure QR. Make sure backend is running.", "error");
        }
    }
    async function loadEvents() {
        eventsBox.innerHTML = "";
        eventsBox.appendChild(el("h3", { textContent: "Events" }));
        eventsBox.appendChild(el("p", { className: "muted small", textContent: "All events" }));
        eventsBox.appendChild(loading());

        try {
            const events = await getAllEvents();

            while (eventsBox.children.length > 2) {
                eventsBox.removeChild(eventsBox.lastChild);
            }

            if (!events.length) {
                eventsBox.appendChild(emptyState("No events found."));
                return;
            }

            const rows = events.map((evt) => [
                evt.id,
                evt.title,
                evt.eventDate || "-",
                evt.startTime || "-",
                evt.endTime || "-",
                evt.radiusMeters || 50,
                badge("Active", "blue"),
                el("button", {
                    className: "secondary",
                    textContent: "View QR",
                    onClick: () => showQr(evt.id),
                }),
            ]);

            eventsBox.appendChild(
                table(["ID", "Title", "Date", "Start", "End", "Radius", "Status", "Action"], rows)
            );
        } catch (err) {
            while (eventsBox.children.length > 2) {
                eventsBox.removeChild(eventsBox.lastChild);
            }
            eventsBox.appendChild(errorState(getErrorMessage(err, "Failed to load events.")));
        }
    }

    // Initial load
    await loadEvents();
}