import { prisma } from "@/lib/prisma";

const PREFIXES: Record<string, string> = {
  PZ: "PZ",
  WZ: "WZ",
  RW: "RW",
  MM: "MM",
  INV: "INV",
};

export async function nextStockMoveNumber(type: string): Promise<string> {
  const prefix = PREFIXES[type] ?? type;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const pattern = `${prefix}/${year}/${month}/`;
  const lastMove = await prisma.stockMove.findFirst({
    where: { documentNumber: { startsWith: pattern } },
    orderBy: { documentNumber: "desc" },
  });
  let seq = 1;
  if (lastMove?.documentNumber) {
    const match = lastMove.documentNumber.match(/\/(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return `${pattern}${String(seq).padStart(4, "0")}`;
}
