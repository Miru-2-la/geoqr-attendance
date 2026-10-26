export function validateEventForm(data) {
    const errors = [];

    if (!data.title || !data.title.trim()) {
        errors.push("Title is required.");
    }

    if (data.latitude === "" || data.latitude == null || Number.isNaN(Number(data.latitude))) {
        errors.push("Latitude is required.");
    } else if (Number(data.latitude) < -90 || Number(data.latitude) > 90) {
        errors.push("Latitude must be between -90 and 90.");
    }

    if (data.longitude === "" || data.longitude == null || Number.isNaN(Number(data.longitude))) {
        errors.push("Longitude is required.");
    } else if (Number(data.longitude) < -180 || Number(data.longitude) > 180) {
        errors.push("Longitude must be between -180 and 180.");
    }

    if (data.radiusMeters == "" || data.radiusMeters == null || Number.isNaN(Number(data.radiusMeters))) {
        errors.push("Radius is required.");
    } else if (Number(data.radiusMeters) <= 0) {
        errors.push("Radius must be greater than 0.");
    }

    if (!data.eventDate) {
        errors.push("Event date is required.");
    }

    if (!data.startTime) {
        errors.push("Start time is required.");
    }

    if (!data.endTime) {
        errors.push("End time is required.");
    }

    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        errors.push("Start time must be before end time.");
    }

    return errors;
}