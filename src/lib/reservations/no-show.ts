import type { PrismaClient } from "@prisma/client";

const NO_SHOW_MINUTES = 30;

/**
 * Ustawia rezerwacje CONFIRMED na NO_SHOW, gdy timeFrom + 30 min < now
 * i przy stoliku nie ma otwartego zamówienia. Zwalnia stolik (status FREE).
 * Wywołuj przed GET rezerwacji lub GET rooms z datą.
 */
export async function processNoShows(prisma: PrismaClient): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - NO_SHOW_MINUTES * 60 * 1000);

  const toNoShow = await prisma.reservation.findMany({
    where: {
      status: "CONFIRMED",
      type: "TABLE",
      tableId: { not: null },
      timeFrom: { lt: cutoff },
    },
    include: { table: true },
  });

  for (const r of toNoShow) {
    if (!r.tableId) continue;
    const openOrder = await prisma.order.findFirst({
      where: {
        tableId: r.tableId,
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
    });
    if (openOrder) continue;

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: r.id },
        data: { status: "NO_SHOW" },
      }),
      prisma.table.update({
        where: { id: r.tableId },
        data: { status: "FREE" },
      }),
    ]);
  }
}
