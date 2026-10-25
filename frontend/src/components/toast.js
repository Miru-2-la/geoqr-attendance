export function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    // This sets the class to "toast success", "toast error", etc.
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Automatically remove the toast after 4.5 seconds
    setTimeout(() => {
        toast.remove();
    }, 4500);
}