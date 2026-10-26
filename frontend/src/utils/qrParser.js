export function parseQrPayload(text) {
    const value = String(text || "").trim();
    if (!value) throw invalidQr();
    if (/^\d+$/.test(value)) return { eventId: Number(value) };

    try {
        const obj = JSON.parse(value);
        if (obj && obj.eventId != null) {
            return { eventId: Number(obj.eventId), token: obj.token };
        }
    } catch { /* Not JSON */ }

    throw invalidQr();
}

function invalidQr() {
    const err = new Error("Invalid QR code.");
    err.errorCode = "INVALID_QR";
    return err;
}