/* ============================================
   GEOQR ATTENDANCE - UTILITY FUNCTIONS
   ============================================ */

function getDeviceId() {

    let deviceId = localStorage.getItem(
        CONFIG.DEVICE_ID_KEY
    );

    if (!deviceId) {

        deviceId =
            'dev-' + generateRandomString(12);

        localStorage.setItem(
            CONFIG.DEVICE_ID_KEY,
            deviceId
        );
    }

    return deviceId;
}


function generateRandomString(length) {

    const chars =
        'abcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';

    for (let i = 0; i < length; i++) {

        result += chars.charAt(
            Math.floor(
                Math.random() * chars.length
            )
        );
    }

    return result;
}


function formatTime(timestamp) {

    const date = new Date(timestamp);

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}


function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}


function showMessage(
    message,
    type = 'info'
) {

    const toast =
        document.createElement('div');

    toast.className =
        `toast toast-${type}`;

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(
        () => toast.classList.add('show'),
        100
    );

    setTimeout(() => {

        toast.classList.remove('show');

        setTimeout(
            () => toast.remove(),
            300
        );

    }, 3000);
}


function formatDistance(meters) {

    if (meters < 1000) {

        return `${Math.round(meters)}m`;

    }

    return `${(meters / 1000).toFixed(1)}km`;
}