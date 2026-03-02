/**
 * Fix orphan tables that have status OCCUPIED but no active orders.
 * Run with: npx tsx scripts/fix-orphan-tables.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Checking for orphan occupied tables...\n");

  // Find tables with OCCUPIED status but no active orders
  const occupiedTables = await prisma.table.findMany({
    where: { status: "OCCUPIED" },
    include: {
      room: { select: { name: true } },
      orders: {
        where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
        select: { id: true, orderNumber: true, status: true },
      },
    },
  });

  const orphanTables = occupiedTables.filter((t) => t.orders.length === 0);

  if (orphanTables.length === 0) {
    console.log("✅ No orphan tables found. All OCCUPIED tables have active orders.");
    return;
  }

  console.log(`Found ${orphanTables.length} orphan table(s):\n`);
  for (const t of orphanTables) {
    console.log(`  - Table ${t.number} (${t.room.name}) — status: ${t.status}, active orders: 0`);
  }

  console.log("\nFixing...\n");

  for (const t of orphanTables) {
    await prisma.table.update({
      where: { id: t.id },
      data: { status: "FREE" },
    });
    console.log(`  ✓ Table ${t.number} (${t.room.name}) → FREE`);
  }

  console.log(`\n✅ Fixed ${orphanTables.length} table(s).`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
