/* ============================================
   GEOQR ATTENDANCE - STUDENT DASHBOARD
   ============================================ */

let html5QrCode = null;
let scannerRunning = false;
let scanProcessed = false;

/* ============================================
   PAGE INITIALIZATION
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    loadStudentInfo();

    document
        .getElementById('startScannerBtn')
        .addEventListener('click', startScanner);

    document
        .getElementById('stopScannerBtn')
        .addEventListener('click', stopScanner);
});


/* ============================================
   LOAD STUDENT INFORMATION
   ============================================ */

function loadStudentInfo() {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('studentName').textContent =
        user.name || 'Student';

    document.getElementById('studentId').textContent =
        user.id || '-';

    document.getElementById('deviceId').textContent =
        getDeviceId();
}


/* ============================================
   START QR SCANNER
   ============================================ */

async function startScanner() {
    if (scannerRunning) {
        return;
    }

    scanProcessed = false;

    const status = document.getElementById('scannerStatus');
    const startButton = document.getElementById('startScannerBtn');
    const stopButton = document.getElementById('stopScannerBtn');

    status.textContent = 'Starting camera...';

    try {
        html5QrCode = new Html5Qrcode('reader');

        await html5QrCode.start(
            {
                facingMode: 'environment'
            },
            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250
                },
                aspectRatio: 1.0
            },
            onScanSuccess,
            onScanFailure
        );

        scannerRunning = true;

        startButton.disabled = true;
        stopButton.disabled = false;

        status.textContent = 'Scanner is active. Point your camera at the event QR code.';

    } catch (error) {
        console.error('Scanner error:', error);

        status.textContent =
            'Unable to start camera. Please allow camera permission.';

        showMessage(
            'Camera permission is required to scan the QR code.',
            'error'
        );
    }
}


/* ============================================
   QR SCAN SUCCESS
   ============================================ */

async function onScanSuccess(decodedText) {

    if (scanProcessed) {
        return;
    }

    scanProcessed = true;

    console.log('QR Code detected:', decodedText);

    try {
        const qrData = JSON.parse(decodedText);

        if (!qrData.eventId) {
            throw new Error('Invalid QR code');
        }

        await stopScanner();

        document.getElementById('scannerStatus').textContent =
            'QR detected. Getting your location...';

        await submitAttendance(qrData.eventId);

    } catch (error) {

        console.error('QR parsing error:', error);

        scanProcessed = false;

        showScanResult(
            'Invalid QR code. Please scan a valid GeoQR event code.',
            'error'
        );

        showMessage(
            'Invalid QR code.',
            'error'
        );
    }
}


/* ============================================
   QR SCAN FAILURE
   ============================================ */

function onScanFailure(errorMessage) {
    // Continuous scanning produces many temporary
    // "QR code not found" messages. We intentionally
    // do not display them to the user.
}


/* ============================================
   GET CURRENT LOCATION
   ============================================ */

function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {
            reject(
                new Error('Geolocation is not supported by this browser.')
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {

                let latitude = position.coords.latitude;
                let longitude = position.coords.longitude;

                /*
                 * Demo requirement from the project PDF:
                 * Simulate Location (500m away)
                 */
                const simulateLocation =
                    document.getElementById('simulateLocation').checked;

                if (simulateLocation) {
                    latitude += 0.0045;
                }

                resolve({
                    latitude: latitude,
                    longitude: longitude
                });
            },

            error => {

                console.error('Location error:', error);

                reject(
                    new Error(
                        'Unable to get your location. Please allow location access.'
                    )
                );
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}


/* ============================================
   SUBMIT ATTENDANCE
   ============================================ */

async function submitAttendance(eventId) {

    try {

        document.getElementById('scannerStatus').textContent =
            'Getting your location...';

        const location = await getCurrentLocation();

        const user = getCurrentUser();

        if (!user || !user.id) {
            throw new Error('Student information not found.');
        }

        const payload = {
            eventId: Number(eventId),
            studentId: Number(user.id),
            studentLat: location.latitude,
            studentLong: location.longitude,
            deviceId: getDeviceId()
        };

        console.log('Attendance payload:', payload);

        document.getElementById('scannerStatus').textContent =
            'Submitting attendance...';

        const response = await fetch(
            CONFIG.API_BASE_URL + '/scan',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        console.log('Attendance response:', data);

        if (response.ok && data.status === 'SUCCESS') {

            showScanResult(
                data.message || 'Attendance marked successfully',
                'success'
            );

            showMessage(
                'Attendance marked successfully!',
                'success'
            );

            document.getElementById('scannerStatus').textContent =
                'Attendance submitted successfully.';

        } else {

            handleScanError(data);
        }

    } catch (error) {

        console.error('Attendance submission error:', error);

        showScanResult(
            error.message || 'Something went wrong. Please try again.',
            'error'
        );

        showMessage(
            error.message || 'Unable to mark attendance.',
            'error'
        );

        document.getElementById('scannerStatus').textContent =
            'Attendance submission failed.';
    }
}


/* ============================================
   HANDLE BACKEND SCAN ERRORS
   ============================================ */

function handleScanError(data) {

    let message = data.message || 'Attendance could not be marked.';

    switch (data.errorCode) {

        case 'LOCATION_MISMATCH':
            message = data.message ||
                'You are outside the allowed attendance location.';
            break;

        case 'PROXY_ATTENDANCE':
            message = data.message ||
                'Proxy attendance detected.';
            break;

        case 'NOT_FOUND':
            message = data.message ||
                'Invalid QR code - Event not found.';
            break;

        default:
            break;
    }

    showScanResult(message, 'error');

    showMessage(message, 'error');

    document.getElementById('scannerStatus').textContent =
        'Attendance could not be marked.';
}


/* ============================================
   STOP QR SCANNER
   ============================================ */

async function stopScanner() {

    if (!html5QrCode || !scannerRunning) {
        return;
    }

    try {

        await html5QrCode.stop();

        html5QrCode.clear();

    } catch (error) {

        console.error('Error stopping scanner:', error);

    } finally {

        scannerRunning = false;

        document.getElementById('startScannerBtn').disabled = false;
        document.getElementById('stopScannerBtn').disabled = true;

        document.getElementById('scannerStatus').textContent =
            'Scanner stopped.';
    }
}


/* ============================================
   DISPLAY SCAN RESULT
   ============================================ */

function showScanResult(message, type) {

    const result = document.getElementById('scanResult');

    result.textContent = message;
    result.className = `scan-result ${type}`;
}


/* ============================================
   STUDENT ATTENDANCE HISTORY
   ============================================ */

async function loadStudentHistory() {

    const tbody = document.getElementById('studentHistoryBody');

    if (!tbody) return;

    const stored = localStorage.getItem(CONFIG.USER_KEY);

    if (!stored) return;

    let user;

    try {
        user = JSON.parse(stored);
    } catch {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-muted">
                Loading...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/attendance/student/${user.id}`
        );

        const result = await response.json();

        const records = result.status === 'SUCCESS'
            ? (result.data || [])
            : [];

        if (records.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No attendance yet.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = records.map(r => `
            <tr>
                <td>${r.eventId}</td>
                <td>${formatTime(r.timestamp)}</td>
                <td>${r.distanceMeters ? r.distanceMeters.toFixed(2) + ' m' : '-'}</td>
                <td>
                    <span class="${r.status === 'SUCCESS' ? 'text-success' : 'text-danger'}">
                        ${r.status || 'UNKNOWN'}
                    </span>
                </td>
            </tr>
        `).join('');

    } catch (error) {

        console.error('Error loading history:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    Failed to load history.
                </td>
            </tr>
        `;
    }
}


// Auto-load on page open
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('studentHistoryBody')) {
        loadStudentHistory();
    }
});