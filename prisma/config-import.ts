import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

const SNAPSHOT_PATH = join(__dirname, "config-snapshot.json");

type Snapshot = Record<string, unknown>;
type Row = Record<string, unknown>;

function stripAutoFields(obj: Row): Row {
  const copy = { ...obj };
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy;
}

async function upsertById(
  label: string,
  rows: Row[] | undefined,
  model: { upsert: (args: unknown) => Promise<unknown> },
) {
  if (!rows?.length) return;
  let count = 0;
  for (const row of rows) {
    const data = stripAutoFields(row);
    const { id, ...rest } = data;
    await model.upsert({
      where: { id },
      update: rest,
      create: data,
    });
    count++;
  }
  console.log(`  ${label}: ${count} rekordów`);
}

async function upsertByUnique(
  label: string,
  rows: Row[] | undefined,
  uniqueField: string,
  model: { upsert: (args: unknown) => Promise<unknown> },
) {
  if (!rows?.length) return;
  let count = 0;
  for (const row of rows) {
    const uniqueValue = row[uniqueField];
    const data = stripAutoFields(row);
    const { id: _id, ...updateData } = data;
    await model.upsert({
      where: { [uniqueField]: uniqueValue },
      update: updateData,
      create: data,
    });
    count++;
  }
  console.log(`  ${label}: ${count} rekordów`);
}

async function main() {
  if (!existsSync(SNAPSHOT_PATH)) {
    console.log("Brak pliku config-snapshot.json — pomijam import konfiguracji.");
    console.log("Aby wygenerować snapshot: npm run db:config:export");
    return;
  }

  console.log("Import konfiguracji z config-snapshot.json...");
  const snapshot: Snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf-8"));
  console.log(`Snapshot z: ${snapshot._exportedAt ?? "nieznana data"}`);

  // SystemConfig (unique: key)
  await upsertByUnique(
    "SystemConfig",
    snapshot.systemConfig as Row[] | undefined,
    "key",
    prisma.systemConfig as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Role (unique: name)
  await upsertByUnique(
    "Role",
    snapshot.roles as Row[] | undefined,
    "name",
    prisma.role as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // User (unique: pin) — import by id to preserve references
  await upsertById(
    "User",
    snapshot.users as Row[] | undefined,
    prisma.user as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // TaxRate (by id — needed before products)
  await upsertById(
    "TaxRate",
    snapshot.taxRates as Row[] | undefined,
    prisma.taxRate as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Room (by id)
  await upsertById(
    "Room",
    snapshot.rooms as Row[] | undefined,
    prisma.room as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Table (by id)
  await upsertById(
    "Table",
    snapshot.tables as Row[] | undefined,
    prisma.table as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // RoomMerge (by id)
  await upsertById(
    "RoomMerge",
    snapshot.roomMerges as Row[] | undefined,
    prisma.roomMerge as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Category (by id)
  // Import parents first (parentId === null), then children
  const allCategories = (snapshot.categories as Row[] | undefined) ?? [];
  const parentCategories = allCategories.filter(c => !c.parentId);
  const childCategories = allCategories.filter(c => c.parentId);
  await upsertById(
    "Category (parents)",
    parentCategories,
    prisma.category as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );
  await upsertById(
    "Category (children)",
    childCategories,
    prisma.category as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Product (by id)
  await upsertById(
    "Product",
    snapshot.products as Row[] | undefined,
    prisma.product as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // ModifierGroup (by id)
  await upsertById(
    "ModifierGroup",
    snapshot.modifierGroups as Row[] | undefined,
    prisma.modifierGroup as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Modifier (by id)
  await upsertById(
    "Modifier",
    snapshot.modifiers as Row[] | undefined,
    prisma.modifier as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // ProductModifierGroup (composite key)
  const pmgs = (snapshot.productModifierGroups as Row[] | undefined) ?? [];
  if (pmgs.length) {
    for (const row of pmgs) {
      await prisma.productModifierGroup.upsert({
        where: {
          productId_modifierGroupId: {
            productId: row.productId as string,
            modifierGroupId: row.modifierGroupId as string,
          },
        },
        update: {},
        create: row as { productId: string; modifierGroupId: string },
      });
    }
    console.log(`  ProductModifierGroup: ${pmgs.length} rekordów`);
  }

  // Allergen (unique: code)
  await upsertByUnique(
    "Allergen",
    snapshot.allergens as Row[] | undefined,
    "code",
    prisma.allergen as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // ProductAllergen (composite key)
  const pas = (snapshot.productAllergens as Row[] | undefined) ?? [];
  if (pas.length) {
    for (const row of pas) {
      await prisma.productAllergen.upsert({
        where: {
          productId_allergenId: {
            productId: row.productId as string,
            allergenId: row.allergenId as string,
          },
        },
        update: {},
        create: row as { productId: string; allergenId: string },
      });
    }
    console.log(`  ProductAllergen: ${pas.length} rekordów`);
  }

  // KDSStation (by id)
  await upsertById(
    "KDSStation",
    snapshot.kdsStations as Row[] | undefined,
    prisma.kDSStation as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // KDSStationCategory (composite key)
  const kscs = (snapshot.kdsStationCategories as Row[] | undefined) ?? [];
  if (kscs.length) {
    for (const row of kscs) {
      await prisma.kDSStationCategory.upsert({
        where: {
          stationId_categoryId: {
            stationId: row.stationId as string,
            categoryId: row.categoryId as string,
          },
        },
        update: {},
        create: row as { stationId: string; categoryId: string },
      });
    }
    console.log(`  KDSStationCategory: ${kscs.length} rekordów`);
  }

  // Printer (by id)
  await upsertById(
    "Printer",
    snapshot.printers as Row[] | undefined,
    prisma.printer as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // PrinterCategory (composite key)
  const pcs = (snapshot.printerCategories as Row[] | undefined) ?? [];
  if (pcs.length) {
    for (const row of pcs) {
      await prisma.printerCategory.upsert({
        where: {
          printerId_categoryId: {
            printerId: row.printerId as string,
            categoryId: row.categoryId as string,
          },
        },
        update: {},
        create: row as { printerId: string; categoryId: string },
      });
    }
    console.log(`  PrinterCategory: ${pcs.length} rekordów`);
  }

  // Discount (by id)
  await upsertById(
    "Discount",
    snapshot.discounts as Row[] | undefined,
    prisma.discount as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Promotion (by id)
  await upsertById(
    "Promotion",
    snapshot.promotions as Row[] | undefined,
    prisma.promotion as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // BanquetMenu (by id)
  await upsertById(
    "BanquetMenu",
    snapshot.banquetMenus as Row[] | undefined,
    prisma.banquetMenu as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Warehouse (by id)
  await upsertById(
    "Warehouse",
    snapshot.warehouses as Row[] | undefined,
    prisma.warehouse as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Ingredient (by id)
  await upsertById(
    "Ingredient",
    snapshot.ingredients as Row[] | undefined,
    prisma.ingredient as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // Recipe (unique: productId)
  const recipes = (snapshot.recipes as Row[] | undefined) ?? [];
  if (recipes.length) {
    for (const row of recipes) {
      const data = stripAutoFields(row);
      const { id: _id, ...rest } = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.recipe.upsert({
        where: { productId: row.productId as string },
        update: rest as any,
        create: data as any,
      });
    }
    console.log(`  Recipe: ${recipes.length} rekordów`);
  }

  // RecipeItem (by id)
  await upsertById(
    "RecipeItem",
    snapshot.recipeItems as Row[] | undefined,
    prisma.recipeItem as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // LoyaltyReward (by id)
  await upsertById(
    "LoyaltyReward",
    snapshot.loyaltyRewards as Row[] | undefined,
    prisma.loyaltyReward as unknown as { upsert: (a: unknown) => Promise<unknown> },
  );

  // ProductSuggestion (composite unique: productId + suggestedId)
  const suggestions = (snapshot.productSuggestions as Row[] | undefined) ?? [];
  if (suggestions.length) {
    for (const row of suggestions) {
      const data = stripAutoFields(row);
      const { id: _id, ...rest } = data;
      await prisma.productSuggestion.upsert({
        where: {
          productId_suggestedId: {
            productId: row.productId as string,
            suggestedId: row.suggestedId as string,
          },
        },
        update: rest,
        create: data as { id: string; productId: string; suggestedId: string; type: string },
      });
    }
    console.log(`  ProductSuggestion: ${suggestions.length} rekordów`);
  }

  console.log("Import konfiguracji zakończony.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
