/**
 * Electronic Scale Service
 * 
 * Handles communication with electronic scales via COM port or USB.
 * Supports common protocols: CAS, Digi, Mettler Toledo
 */

export interface ScaleReading {
  weight: number;
  unit: "kg" | "g";
  stable: boolean;
  tare: number;
  net: number;
  gross: number;
  timestamp: Date;
}

export interface ScaleConfig {
  connectionType: "COM" | "USB" | "NETWORK";
  port?: string;
  baudRate?: number;
  protocol?: "CAS" | "DIGI" | "METTLER" | "GENERIC";
  address?: string;
  pollIntervalMs?: number;
}

const DEFAULT_CONFIG: ScaleConfig = {
  connectionType: "COM",
  port: "COM1",
  baudRate: 9600,
  protocol: "GENERIC",
  pollIntervalMs: 200,
};

let currentWeight: ScaleReading | null = null;
let lastReadTime: Date | null = null;

/**
 * Parse weight from raw scale data
 */
export function parseScaleData(data: string, protocol: string = "GENERIC"): ScaleReading | null {
  try {
    switch (protocol) {
      case "CAS": {
        const match = data.match(/([+-]?\d+\.?\d*)\s*(kg|g)/i);
        if (match) {
          const weight = parseFloat(match[1]);
          const unit = match[2].toLowerCase() as "kg" | "g";
          return {
            weight: unit === "g" ? weight / 1000 : weight,
            unit: "kg",
            stable: !data.includes("M") && !data.includes("?"),
            tare: 0,
            net: weight,
            gross: weight,
            timestamp: new Date(),
          };
        }
        break;
      }

      case "DIGI": {
        const match = data.match(/N([+-]?\d+)/);
        if (match) {
          const weight = parseInt(match[1]) / 1000;
          return {
            weight,
            unit: "kg",
            stable: data.startsWith("S"),
            tare: 0,
            net: weight,
            gross: weight,
            timestamp: new Date(),
          };
        }
        break;
      }

      case "METTLER": {
        const parts = data.trim().split(/\s+/);
        if (parts.length >= 2) {
          const weight = parseFloat(parts[1]);
          const stable = parts[0] === "S";
          return {
            weight: weight / 1000,
            unit: "kg",
            stable,
            tare: 0,
            net: weight / 1000,
            gross: weight / 1000,
            timestamp: new Date(),
          };
        }
        break;
      }

      default: {
        const numMatch = data.match(/([+-]?\d+\.?\d*)/);
        if (numMatch) {
          const weight = parseFloat(numMatch[1]);
          const normalized = weight > 100 ? weight / 1000 : weight;
          return {
            weight: normalized,
            unit: "kg",
            stable: true,
            tare: 0,
            net: normalized,
            gross: normalized,
            timestamp: new Date(),
          };
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Update current weight reading (called by external polling)
 */
export function updateWeight(reading: ScaleReading): void {
  currentWeight = reading;
  lastReadTime = new Date();
}

/**
 * Get current weight
 */
export function getCurrentWeight(): ScaleReading | null {
  if (!currentWeight) return null;

  const now = new Date();
  const age = now.getTime() - (lastReadTime?.getTime() ?? 0);

  if (age > 5000) {
    return null;
  }

  return currentWeight;
}

/**
 * Clear current weight
 */
export function clearWeight(): void {
  currentWeight = null;
  lastReadTime = null;
}

/**
 * Parse EAN-13 barcode from scale label
 * Format: 2PPPPPWWWWWC where:
 * - 2 = prefix for weighted items
 * - PPPPP = product code (5 digits)
 * - WWWWW = weight in grams (5 digits) or price in grosze
 * - C = checksum
 */
export function parseScaleBarcode(barcode: string): { productCode: string; weight: number } | null {
  if (barcode.length !== 13) return null;

  const prefix = barcode.charAt(0);
  if (prefix !== "2") return null;

  const productCode = barcode.substring(1, 6);
  const weightStr = barcode.substring(6, 11);
  const weight = parseInt(weightStr) / 1000;

  if (isNaN(weight)) return null;

  return {
    productCode,
    weight,
  };
}

/**
 * Calculate EAN-13 checksum
 */
export function calculateEAN13Checksum(digits: string): number {
  if (digits.length !== 12) return -1;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Generate EAN-13 barcode for weighted product
 */
export function generateWeightBarcode(productCode: string, weightKg: number): string {
  const code = productCode.padStart(5, "0").slice(0, 5);
  const weightGrams = Math.round(weightKg * 1000);
  const weightStr = weightGrams.toString().padStart(5, "0").slice(0, 5);

  const base = `2${code}${weightStr}`;
  const checksum = calculateEAN13Checksum(base);

  return `${base}${checksum}`;
}
