import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Czyszczenie starych zamowien...");
  
  const cutoffDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  
  // Wyłącz FK checks
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);
  
  // Anuluj stare zamówienia
  const result1 = await prisma.$executeRawUnsafe(`
    UPDATE \`Order\` 
    SET status = 'CANCELLED', closedAt = NOW() 
    WHERE status NOT IN ('CLOSED', 'CANCELLED') 
    AND createdAt < '${cutoffDate}'
  `);
  console.log("Anulowano zamowien:", result1);
  
  // Zwolnij stoliki bez aktywnych zamówień
  const result2 = await prisma.$executeRawUnsafe(`
    UPDATE \`Table\` t 
    SET t.status = 'FREE' 
    WHERE t.status = 'OCCUPIED' 
    AND NOT EXISTS (
      SELECT 1 FROM \`Order\` o 
      WHERE o.tableId = t.id 
      AND o.status NOT IN ('CLOSED', 'CANCELLED')
    )
  `);
  console.log("Zwolniono stolikow:", result2);
  
  // Włącz FK checks
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
  
  console.log("Gotowe!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
