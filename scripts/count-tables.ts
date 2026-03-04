import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const rows = await prisma.$queryRawUnsafe<
    { tabela: string; wierszy: bigint }[]
  >(`
    SELECT 'BanquetMenu' as tabela, COUNT(*) as wierszy FROM banquet_menus
    UNION ALL
    SELECT 'BanquetEvent', COUNT(*) FROM banquet_events
    UNION ALL
    SELECT 'StockItem', COUNT(*) FROM stock_items
    UNION ALL
    SELECT 'Ingredient', COUNT(*) FROM ingredients
  `);
  console.table(rows.map((r) => ({ tabela: r.tabela, wierszy: String(r.wierszy) })));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
