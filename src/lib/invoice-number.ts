import { prisma } from "@/lib/prisma";

const PREFIXES: Record<string, string> = {
  STANDARD: "FV",
  ADVANCE: "FZ",
  FINAL: "FV",
  CORRECTION: "FK",
};

export async function nextInvoiceNumber(prefix: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const pattern = `${prefix}/${year}/${month}/`;
  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: pattern } },
    orderBy: { invoiceNumber: "desc" },
  });
  let seq = 1;
  if (lastInvoice) {
    const match = lastInvoice.invoiceNumber.match(/\/(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return `${pattern}${String(seq).padStart(4, "0")}`;
}

export function getPrefixForType(type: "STANDARD" | "ADVANCE" | "FINAL" | "CORRECTION"): string {
  return PREFIXES[type] ?? "FV";
}
