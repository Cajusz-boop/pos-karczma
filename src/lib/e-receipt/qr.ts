import QRCode from "qrcode";

/**
 * Generates a QR code as a data URL (base64 PNG).
 * Uses the qrcode npm package.
 */
export async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    type: "image/png",
    margin: 2,
    width: 200,
    errorCorrectionLevel: "M",
  });
}
