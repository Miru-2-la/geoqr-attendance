// ==========================================
// QR CODE GENERATOR
// ==========================================

function showQR(eventId) {

    // Get the QR modal
    const qrModal = document.getElementById('qrModal');

    // Get the place where QR will be generated
    const qrCode = document.getElementById('qrModalCode');

    // Check if elements exist
    if (!qrModal || !qrCode) {
        console.error("QR elements not found");
        return;
    }

    // Clear previous QR code
    qrCode.innerHTML = "";

    // Generate QR code
    new QRCode(qrCode, {
        text: eventId,
        width: 250,
        height: 250
    });

    // Show modal
    qrModal.style.display = 'flex';
}


// ==========================================
// CLOSE QR MODAL
// ==========================================

function closeQR() {

    const qrModal = document.getElementById('qrModal');

    if (qrModal) {
        qrModal.style.display = 'none';
    }
}