export function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Geolocation is not supported by your browser."));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                });
            },
            (error) => {
                let message = "Unable to get location.";

                if (error.code === 1) {
                    message = "Location permission denied. Attendance requires location access.";
                } else if (error.code === 2) {
                    message = "Location unavailable. Enable GPS and try again.";
                } else if (error.code === 3) {
                    message = "Location request timed out. Try again.";
                }

                const err = new Error(message);
                err.errorCode = "LOCATION_ERROR";
                reject(err);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}