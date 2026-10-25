const MAP = {
    // Existing codes
    LOCATION_MISMATCH: "You are outside the allowed attendance area.",
    PROXY_ATTENDANCE: "Duplicate or proxy attendance detected.",
    NOT_FOUND: "Resource not found.",
    INTERNAL_ERROR: "Server error. Please try again later.",
    UNAUTHORIZED: "Authentication required. Please log in again.",
    FORBIDDEN: "You do not have permission to perform this action.",
    VALIDATION_ERROR: "Invalid input. Please check the form fields.",
    NETWORK_ERROR: "Network error. Check if backend is running.",
    INVALID_QR: "Invalid QR code.",
    PERMISSION_DENIED: "Permission denied.",
    LOCATION_UNAVAILABLE: "Location unavailable. Enable GPS and try again.",
    TIMEOUT: "Request timed out. Try again.",
    
    // NEW SECURITY CODES from Eshanika's backend
    EVENT_NOT_ACTIVE: "Attendance is not open for this event right now.",
    LOW_GPS_ACCURACY: "GPS signal is too weak. Move outdoors and retry.",
    STALE_LOCATION: "Location reading is outdated. Refresh location and retry.",
    DEVICE_MISMATCH: "This account is bound to another device. Contact your administrator.",
    QR_EXPIRED: "QR code expired. Scan the latest code on screen.",
    RATE_LIMITED: "Too many requests. Please wait a minute."
};

export function getErrorMessage(error, fallback = "Something went wrong.") {
    if (!error) return fallback;

    const code = error.errorCode;
    const backendMessage = error.message;

    // If the backend sent a specific error code we recognize
    if (code && MAP[code]) {
        // If the backend also sent a custom message, append it
        if (backendMessage && backendMessage !== code) {
            return `${MAP[code]} (${backendMessage})`;
        }
        return MAP[code];
    }

    // If we don't recognize the code, just show the backend message
    if (backendMessage) return backendMessage;

    // If all else fails, show the fallback
    return fallback;
}