import "dotenv/config";
import { writeFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

const SNAPSHOT_PATH = join(__dirname, "config-snapshot.json");

async function main() {
  console.log("Eksport konfiguracji z bazy...");

  const systemConfig = await prisma.systemConfig.findMany();
  const roles = await prisma.role.findMany();
  const users = await prisma.user.findMany();

  const rooms = await prisma.room.findMany({ orderBy: { sortOrder: "asc" } });
  const tables = await prisma.table.findMany();
  const roomMerges = await prisma.roomMerge.findMany();

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const products = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
  const taxRates = await prisma.taxRate.findMany();
  const modifierGroups = await prisma.modifierGroup.findMany();
  const modifiers = await prisma.modifier.findMany({ orderBy: { sortOrder: "asc" } });
  const productModifierGroups = await prisma.productModifierGroup.findMany();
  const allergens = await prisma.allergen.findMany();
  const productAllergens = await prisma.productAllergen.findMany();

  const kdsStations = await prisma.kDSStation.findMany({ orderBy: { displayOrder: "asc" } });
  const kdsStationCategories = await prisma.kDSStationCategory.findMany();

  const printers = await prisma.printer.findMany();
  const printerCategories = await prisma.printerCategory.findMany();

  const discounts = await prisma.discount.findMany();
  const promotions = await prisma.promotion.findMany();

  const banquetMenus = await prisma.banquetMenu.findMany();

  const warehouses = await prisma.warehouse.findMany();
  const ingredients = await prisma.ingredient.findMany();
  const recipes = await prisma.recipe.findMany();
  const recipeItems = await prisma.recipeItem.findMany();

  const loyaltyRewards = await prisma.loyaltyReward.findMany();
  const productSuggestions = await prisma.productSuggestion.findMany();

  const snapshot = {
    _exportedAt: new Date().toISOString(),
    _description: "Snapshot konfiguracji POS Karczma. Generowany przez: npm run db:config:export",
    systemConfig,
    roles,
    users,
    rooms,
    tables,
    roomMerges,
    categories,
    products,
    taxRates,
    modifierGroups,
    modifiers,
    productModifierGroups,
    allergens,
    productAllergens,
    kdsStations,
    kdsStationCategories,
    printers,
    printerCategories,
    discounts,
    promotions,
    banquetMenus,
    warehouses,
    ingredients,
    recipes,
    recipeItems,
    loyaltyRewards,
    productSuggestions,
  };

  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf-8");
  console.log(`Zapisano snapshot: ${SNAPSHOT_PATH}`);
  console.log("Tabele wyeksportowane:", Object.keys(snapshot).filter(k => !k.startsWith("_")).length);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
