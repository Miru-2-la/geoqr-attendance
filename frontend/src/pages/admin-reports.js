import { downloadReport } from "../api.js";
import { el, card } from "../ui.js";
import { showToast } from "../components/toast.js";
import { getErrorMessage } from "../utils/errorMessages.js";

export function renderAdminReports(container) {
    const csvBtn = el("button", { textContent: "Download CSV" });
    const pdfBtn = el("button", { textContent: "Download PDF" });

    const warning = el("div", {
        className: "alert warn",
        textContent: "Known backend limitation: original PDFReportGenerator returns plain text, not valid PDF. If backend has not been fixed, downloaded PDF may not open correctly.",
    });

    container.appendChild(
        card(
            "Reports",
            [
                warning,
                el("div", { className: "row" }, [csvBtn, pdfBtn]),
            ],
            "Download attendance reports"
        )
    );

    csvBtn.addEventListener("click", async () => {
        setBusy(csvBtn, true, "Downloading...");
        try {
            await downloadReport("csv");
            showToast("CSV downloaded.", "success");
        } catch (err) {
            showToast(getErrorMessage(err, "CSV download failed."), "error");
        } finally {
            setBusy(csvBtn, false, "Download CSV");
        }
    });

    pdfBtn.addEventListener("click", async () => {
        setBusy(pdfBtn, true, "Downloading...");
        try {
            await downloadReport("pdf");
            showToast("PDF downloaded.", "success");
        } catch (err) {
            showToast(getErrorMessage(err, "PDF download failed."), "error");
        } finally {
            setBusy(pdfBtn, false, "Download PDF");
        }
    });

    function setBusy(button, busy, text) {
        button.disabled = busy;
        button.textContent = text;
    }
}