import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Sprawdzam STATUS wszystkich stolików ===\n");

  const allTables = await prisma.table.findMany({
    include: {
      room: { select: { name: true } },
      orders: {
        where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
        select: { id: true, orderNumber: true, userId: true },
      },
    },
    orderBy: [{ room: { sortOrder: "asc" } }, { number: "asc" }],
  });

  console.log("Nr | Status     | AssignedUser | OpenOrders");
  console.log("---|------------|--------------|------------");
  for (const t of allTables) {
    const orderInfo = t.orders.length > 0 
      ? t.orders.map(o => `#${o.orderNumber}`).join(", ")
      : "brak";
    console.log(
      `${String(t.number).padStart(2)} | ${t.status.padEnd(10)} | ${(t.assignedUser ?? "null").substring(0, 12).padEnd(12)} | ${orderInfo}`
    );
  }

  console.log("\n=== Sprawdzam otwarte zamówienia bez przypisanego kelnera ===\n");

  // Pobierz wszystkie otwarte zamówienia ze stolikami
  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["CLOSED", "CANCELLED"] },
    },
    include: {
      table: { select: { id: true, number: true, assignedUser: true } },
      user: { select: { id: true, name: true } },
      items: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Znaleziono ${orders.length} otwartych zamówień ze stolikami:\n`);

  for (const order of orders) {
    const tableNum = order.table?.number ?? "brak";
    const userName = order.user?.name ?? "BRAK USERA!";
    const assignedUser = order.table?.assignedUser;
    const itemCount = order.items.length;

    console.log(
      `Stolik ${tableNum} | Zamówienie #${order.orderNumber} | Kelner: ${userName} (ID: ${order.userId}) | ` +
      `Table.assignedUser: ${assignedUser ?? "NULL"} | Pozycje: ${itemCount}`
    );
  }

  // Sprawdź stoliki które są OCCUPIED ale nie mają zamówień
  console.log("\n=== Stoliki z status=OCCUPIED ale bez otwartych zamówień ===\n");

  const occupiedTables = await prisma.table.findMany({
    where: { status: "OCCUPIED" },
    include: {
      orders: {
        where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
        select: { id: true, orderNumber: true },
      },
    },
  });

  const orphanTables = occupiedTables.filter((t) => t.orders.length === 0);
  if (orphanTables.length > 0) {
    console.log("Stoliki OCCUPIED bez zamówień (do zwolnienia):");
    for (const t of orphanTables) {
      console.log(`  - Stolik ${t.number} (ID: ${t.id})`);
    }
  } else {
    console.log("Brak takich stolików.");
  }

  // Argumenty linii poleceń
  const args = process.argv.slice(2);
  
  if (args.includes("--close-empty")) {
    console.log("\n=== Zamykam puste zamówienia BEZ stolika ===\n");
    
    const emptyOrders = orders.filter((o) => o.items.length === 0 && !o.tableId);
    
    console.log(`Znaleziono ${emptyOrders.length} pustych zamówień bez stolika do zamknięcia.`);
    
    if (emptyOrders.length > 0) {
      const result = await prisma.order.updateMany({
        where: {
          id: { in: emptyOrders.map((o) => o.id) },
        },
        data: { status: "CANCELLED", closedAt: new Date() },
      });
      
      console.log(`Zamknięto ${result.count} pustych zamówień.`);
    }
  }

  if (args.includes("--close-table-orders")) {
    const tableNumbers = args
      .find((a) => a.startsWith("--tables="))
      ?.split("=")[1]
      ?.split(",")
      .map(Number)
      .filter(Boolean);
    
    if (!tableNumbers || tableNumbers.length === 0) {
      console.log("\nUżycie: --close-table-orders --tables=1,3,4,5,7");
      return;
    }

    console.log(`\n=== Zamykam zamówienia dla stolików: ${tableNumbers.join(", ")} ===\n`);
    
    for (const num of tableNumbers) {
      const tableOrders = orders.filter((o) => o.table?.number === num);
      
      if (tableOrders.length === 0) {
        console.log(`Stolik ${num}: brak otwartych zamówień w bazie`);
        continue;
      }
      
      for (const order of tableOrders) {
        console.log(`Zamykam zamówienie #${order.orderNumber} (stolik ${num}), pozycje: ${order.items.length}`);
        
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: order.items.length === 0 ? "CANCELLED" : "CLOSED", closedAt: new Date() },
          }),
          prisma.table.update({
            where: { id: order.table!.id },
            data: { status: "FREE", assignedUser: null },
          }),
        ]);
      }
    }
  }

  if (args.includes("--fix-tables")) {
    console.log("\n=== Naprawiam stoliki OCCUPIED bez zamówień ===\n");
    
    for (const t of orphanTables) {
      console.log(`Zwalniam stolik ${t.number}`);
      await prisma.table.update({
        where: { id: t.id },
        data: { status: "FREE", assignedUser: null },
      });
    }
    
    console.log(`\nNaprawiono ${orphanTables.length} stolików.`);
  }

  if (args.includes("--clear-assigned-user")) {
    console.log("\n=== Czyszczę assignedUser dla stolików FREE ===\n");
    
    const freeWithUser = allTables.filter((t) => t.status === "FREE" && t.assignedUser);
    
    if (freeWithUser.length > 0) {
      for (const t of freeWithUser) {
        console.log(`Czyszczę stolik ${t.number}`);
      }
      
      await prisma.table.updateMany({
        where: {
          id: { in: freeWithUser.map((t) => t.id) },
          status: "FREE",
        },
        data: { assignedUser: null },
      });
      
      console.log(`\nWyczyszczono assignedUser dla ${freeWithUser.length} stolików.`);
    } else {
      console.log("Brak stolików FREE z assignedUser do wyczyszczenia.");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
