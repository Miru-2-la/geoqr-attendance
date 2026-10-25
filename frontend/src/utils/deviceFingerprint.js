import { DEVICE_ID_KEY } from "../config.js";

export async function getDeviceId() {
    const cached = sessionStorage.getItem(DEVICE_ID_KEY);
    if (cached) return cached;

    const id = await generateDeviceFingerprint();
    sessionStorage.setItem(DEVICE_ID_KEY, id);
    return id;
}

async function generateDeviceFingerprint() {
    const raw = [
        navigator.userAgent || "",
        navigator.language || "",
        Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        screen.width || "",
        screen.height || "",
        screen.colorDepth || "",
        navigator.platform || "",
        navigator.hardwareConcurrency || ""
    ].join("");

    return await sha256Hex(raw);
}

async function sha256Hex(input) {
    if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    
    return fallbackHash(input);
}

function fallbackHash(str) {
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        h1 ^= c;
        h1 = Math.imul(h1, 0x01000193) >>> 0;
        h2 = (h2 + c + i) >>> 0;
    }
    return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}