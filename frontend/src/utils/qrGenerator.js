export function qrPayload(eventId, token) {
    return JSON.stringify({ eventId: Number(eventId), token: token });
}

export function renderQr(container, eventId, token) {
    if (!container) return;
    container.innerHTML = "";
    if (typeof QRCode === "undefined") {
        const p = document.createElement("p");
        p.textContent = "QR library not loaded. Use manual event ID.";
        container.appendChild(p);
        return;
    }
    new QRCode(container, {
        text: qrPayload(eventId, token),
        width: 220,
        height: 220,
        colorDark: "#111111",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
    });
}

export function downloadQr(container, filename = "event-qr.png") {
    if (!container) return;
    const canvas = container.querySelector("canvas");
    const img = container.querySelector("img");
    let dataUrl = null;
    if (canvas) dataUrl = canvas.toDataURL("image/png");
    else if (img && img.src) dataUrl = img.src;
    if (!dataUrl) return alert("QR download is not available.");
    const a = document.createElement("a");
    a.href = dataUrl; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
}