import { getUser } from "../auth.js";
import { getEventById, scanAttendance } from "../api.js";
import { el, card, badge } from "../ui.js";
import { showToast } from "../components/toast.js";
import { getCurrentLocation } from "../utils/geolocation.js";
import { getDeviceId } from "../utils/deviceFingerprint.js";
import { parseQrPayload } from "../utils/qrParser.js";
import { getDistanceMeters } from "../utils/geo.js";
import { getErrorMessage } from "../utils/errorMessages.js";
import { formatDateTime } from "../utils/format.js";

export async function renderStudentScan(container) {
    const user = getUser();
    
    // Check if user is logged in and is a student
    if (!user || user.role !== "STUDENT") {
        window.location.hash = "#/login";
        return;
    }

    let locationData = null;
    let eventId = null;
    let qrToken = null;
    let event = null;
    let submitting = false;
    let submitted = false;
    let scanner = null;
    let scanning = false;

    // --- UI Elements ---
    const locationStatus = el("div", { className: "muted", textContent: "Location: not requested yet" });
    const qrReader = el("div", { id: "qr-reader" });
    const manualInput = el("input", { type: "number", placeholder: "Manual event ID, for example 1" });
    const eventPreview = el("div", { className: "alert info", textContent: "Scan QR or enter event ID to preview event." });
    const distanceInfo = el("div", { className: "muted small", textContent: "" });
    const resultBox = el("div");

    const submitBtn = el("button", { textContent: "Mark Attendance", disabled: true });
    const startScanBtn = el("button", { className: "secondary", textContent: "Start QR Scanner" });
    const stopScanBtn = el("button", { className: "secondary", textContent: "Stop QR Scanner" });
    const refreshLocationBtn = el("button", { className: "secondary", textContent: "Refresh Location" });
    const manualBtn = el("button", { className: "secondary", textContent: "Use Manual Event ID" });

    // --- Layout ---
    container.appendChild(
        card(
            "Student Attendance Scan",
            [
                locationStatus,
                el("div", { className: "row" }, [refreshLocationBtn]),
                el("hr"),
                el("div", { className: "row" }, [startScanBtn, stopScanBtn]),
                qrReader,
                el("hr"),
                el("div", { className: "row" }, [manualInput, manualBtn]),
                eventPreview,
                distanceInfo,
                el("div", { className: "row" }, [submitBtn]),
                resultBox,
            ],
            "QR + GPS + device fingerprint"
        )
    );

    // --- Initialization ---
    await refreshLocation();

    // --- Event Listeners ---
    refreshLocationBtn.addEventListener("click", refreshLocation);
    startScanBtn.addEventListener("click", startScanner);
    stopScanBtn.addEventListener("click", stopScanner);

    manualBtn.addEventListener("click", () => {
        const value = Number(manualInput.value);
        if (!value) {
            showToast("Enter a valid event ID.", "warning");
            return;
        }
        eventId = value;
        loadEvent(eventId);
    });

    submitBtn.addEventListener("click", submitAttendance);

    // --- Functions ---
    function updateSubmitState() {
        submitBtn.disabled = !(locationData && eventId && !submitting && !submitted);
    }

    async function refreshLocation() {
        locationStatus.textContent = "Location: requesting...";
        try {
            locationData = await getCurrentLocation();
            // Fixed typo "Ing" to "lng" for longitude
            locationStatus.textContent = `Location: ready • lat ${locationData.latitude.toFixed(6)} • lng ${locationData.longitude.toFixed(6)} • accuracy ${Math.round(locationData.accuracy)} m`;
            updateDistanceInfo();
            updateSubmitState();
        } catch (err) {
            locationData = null;
            locationStatus.textContent = `Location: ${err.message}`;
            showToast(err.message, "error");
            updateSubmitState();
        }
    }

    function startScanner() {
        if (typeof Html5Qrcode === "undefined") {
            showToast("QR scanner library not loaded. Use manual event ID.", "warning");
            return;
        }
        if (scanning) return;

        scanner = new Html5Qrcode("qr-reader");
        scanning = true;

        scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                try {
                    const parsed = parseQrPayload(decodedText);
                    eventId = parsed.eventId;
                    qrToken = parsed.token;
                    stopScanner();
                    loadEvent(eventId);
                } catch (err) {
                    showToast(getErrorMessage(err, "Invalid QR code."), "error");
                }
            },
            () => {
                // Ignore per-frame decode errors.
            }
        ).catch((err) => {
            scanning = false;
            showToast(`Camera error: ${err.message || err}`, "error");
        });
    }

    function stopScanner() {
        if (!scanner || !scanning) return;
        
        scanner.stop().then(() => {
            scanner.clear();
            scanning = false;
        }).catch(() => {
            scanning = false;
        });
    }

    async function loadEvent(id) {
        eventPreview.textContent = "Loading event...";
        try {
            event = await getEventById(id);
            eventPreview.textContent = "";
            eventPreview.appendChild(el("strong", { textContent: event.title }));
            eventPreview.appendChild(el("br"));
            eventPreview.appendChild(el("span", { textContent: `Event ID: ${event.id}` }));
            eventPreview.appendChild(el("br"));
            eventPreview.appendChild(el("span", { textContent: `Date: ${event.eventDate || "-"}` }));
            eventPreview.appendChild(el("br"));
            eventPreview.appendChild(el("span", { textContent: `Time: ${event.startTime || "-"} to ${event.endTime || "-"}` }));
            eventPreview.appendChild(el("br"));
            eventPreview.appendChild(el("span", { textContent: `Radius: ${event.radiusMeters || 50} m` }));
            eventPreview.appendChild(el("br"));
            eventPreview.appendChild(el("span", { textContent: `Location: ${event.latitude}, ${event.longitude}` }));
            
            if (event.description) {
                eventPreview.appendChild(el("br"));
                eventPreview.appendChild(el("span", { textContent: `Description: ${event.description}` }));
            }

            updateDistanceInfo();
            updateSubmitState();
        } catch (err) {
            event = null;
            eventPreview.textContent = "Event not found.";
            showToast(getErrorMessage(err, "Event not found."), "error");
            updateSubmitState();
        }
    }

    function updateDistanceInfo() {
        if (!event || !locationData) {
            distanceInfo.textContent = "";
            return;
        }

        const distance = getDistanceMeters(
            locationData.latitude,
            locationData.longitude,
            event.latitude,
            event.longitude
        );
        const inside = distance <= (event.radiusMeters || 50);

        distanceInfo.textContent = `Client estimate: ${distance.toFixed(1)} m from event. Allowed radius: ${event.radiusMeters || 50} m. ${inside ? "Likely inside geo-fence." : "Likely outside geo-fence."}`;
    }

    async function submitAttendance() {
        if (submitting || submitted) return;
        if (!locationData) {
            showToast("Location is required.", "warning");
            return;
        }
        if (!eventId) {
            showToast("Event ID is required.", "warning");
            return;
        }

        submitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "";
        submitBtn.appendChild(el("span", { className: "loader" }));
        submitBtn.appendChild(document.createTextNode("Submitting...")); // Fixed createElement to createTextNode

        resultBox.textContent = "";

        try {
            const deviceId = await getDeviceId();
             const payload = {
                eventId: Number(eventId),
                studentLat: locationData.latitude,
                studentLong: locationData.longitude,
                studentAccuracy: locationData.accuracy,        // Required by SEC-015
                locationTimestamp: locationData.timestamp,     // Required by SEC-015
                deviceId: deviceId,
                qrToken: qrToken                                // Required by SEC-017
            };

            const attendance = await scanAttendance(payload);
            submitted = true;

            resultBox.appendChild(
                el("div", { className: "alert success" }, [
                    el("strong", { textContent: "Attendance marked successfully." }),
                    el("br"),
                    el("span", { textContent: `Status: ${attendance.status}` }),
                    el("br"),
                    el("span", { textContent: `Distance: ${attendance.distanceMeters} m` }),
                    el("br"),
                    el("span", { textContent: `Timestamp: ${formatDateTime(attendance.timestamp)}` }),
                    el("br"),
                    badge("PRESENT", "green"),
                ])
            );
            showToast("Attendance marked successfully.", "success");
        } catch (err) {
            const message = getErrorMessage(err, "Attendance failed.");
            resultBox.appendChild(el("div", { className: "alert error", textContent: message }));
            showToast(message, "error");
        } finally {
            submitting = false;
            submitBtn.textContent = submitted ? "Already Submitted" : "Mark Attendance";
            updateSubmitState();
        }
    }

    // Return a cleanup function for the router
    return () => {
        stopScanner();
    };
}