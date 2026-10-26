export function formatDateTime(value) {
    if (!value) return "-";
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        return d.toLocaleString();
    } catch {
        return String(value);
    }
}

export function shortDeviceId(deviceId) {
    if (!deviceId) return "-";
    const s = String(deviceId);
    if (s.length <= 14) return s;
    return `${s.slice(0, 10)}...${s.slice(-4)}`;
}

export function normalizeTime(time) {
    if (!time) return "";
    if (time.length === 5) return `${time}:00`;
    return time;
}