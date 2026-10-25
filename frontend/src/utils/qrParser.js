export function parseQrPayload(text) {
    const value = String(text || "").trim();

    if (!value) throw invalidQr();

    if (/^\d+$/.test(value)) {
        return { eventId: Number(value) };
    }

    try {
        const obj = JSON.parse(value);
        if (obj && obj.eventId != null) {
            // 👈 Now returns both eventId and token
            return { eventId: Number(obj.eventId), token: obj.token };
        }
    } catch {
        // Not JSON. Continue to URL parsing.
    }

    const geoqrMatch = value.match(/geoqr:\/\/event\/(\d+)/i);
    if (geoqrMatch) {
        return { eventId: Number(geoqrMatch[1]) };
    }

    const urlMatch = value.match(/[?&]eventId=(\d+)/i);
    if (urlMatch) {
        return { eventId: Number(urlMatch[1]) };
    }

    throw invalidQr();
}

function invalidQr() {
    const err = new Error("Invalid QR code.");
    err.errorCode = "INVALID_QR";
    return err;
}