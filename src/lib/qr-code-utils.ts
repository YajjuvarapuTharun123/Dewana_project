import QRCode from "qrcode";
import dewanaLogo from "@/assets/dewana-logo.png";

/**
 * Generates a QR code with the Dewana logo centered on it
 * @param data - The data to encode in the QR code
 * @param options - Optional configuration
 * @returns Promise<string> - Data URL of the QR code with logo
 */
export async function generateQRCodeWithLogo(
    data: string,
    options: {
        size?: number;
        logoSize?: number;
        margin?: number;
    } = {}
): Promise<string> {
    const { size = 400, logoSize = 80, margin = 2 } = options;

    // Generate QR code with high error correction (H = 30%) to allow logo overlay
    const qrCanvas = document.createElement("canvas");
    qrCanvas.width = size;
    qrCanvas.height = size;

    await QRCode.toCanvas(qrCanvas, data, {
        width: size,
        margin: margin,
        errorCorrectionLevel: "H", // High error correction allows ~30% of code to be covered
        color: {
            dark: "#1a1a2e", // Dark navy color for QR modules
            light: "#FFFFFF",
        },
    });

    const ctx = qrCanvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get canvas context");
    }

    // Create a stylish logo container
    return new Promise((resolve, reject) => {
        const logo = new Image();
        logo.crossOrigin = "anonymous";

        logo.onload = () => {
            // Calculate center position
            const centerX = (size - logoSize) / 2;
            const centerY = (size - logoSize) / 2;

            // Draw a white circular background with gradient border
            const padding = 10;
            const bgSize = logoSize + padding * 2;
            const bgX = (size - bgSize) / 2;
            const bgY = (size - bgSize) / 2;

            // Create gradient for the logo border (Dewana brand colors)
            const gradient = ctx.createLinearGradient(
                bgX,
                bgY,
                bgX + bgSize,
                bgY + bgSize
            );
            gradient.addColorStop(0, "#FF6B35"); // Dewana Orange
            gradient.addColorStop(0.5, "#F7C566"); // Dewana Gold
            gradient.addColorStop(1, "#D63384"); // Dewana Magenta

            // Draw outer gradient border circle
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, bgSize / 2 + 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Draw white background circle
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, bgSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();

            // Draw the logo
            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logo, centerX, centerY, logoSize, logoSize);
            ctx.restore();

            // Convert canvas to data URL
            resolve(qrCanvas.toDataURL("image/png"));
        };

        logo.onerror = () => {
            // If logo fails to load, return QR code without logo
            console.warn("Failed to load Dewana logo for QR code");
            resolve(qrCanvas.toDataURL("image/png"));
        };

        logo.src = dewanaLogo;
    });
}

/**
 * Generates a simple QR code without logo (fallback)
 */
export async function generateSimpleQRCode(
    data: string,
    options: {
        size?: number;
        margin?: number;
    } = {}
): Promise<string> {
    const { size = 400, margin = 2 } = options;

    return QRCode.toDataURL(data, {
        width: size,
        margin: margin,
        color: {
            dark: "#000000",
            light: "#FFFFFF",
        },
    });
}
