import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hashPin } from "../src/lib/auth";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is not set");
const connectionString = rawUrl.replace(/^mysql:\/\/([^:]+):@/, "mariadb://$1@");

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

const ADMIN_PERMISSIONS = [
  "order.create",
  "order.edit_sent",
  "order.cancel",
  "order.storno",
  "order.discount_small",
  "order.discount_large",
  "order.transfer_table",
  "payment.close",
  "payment.refund",
  "invoice.create",
  "invoice.advance",
  "invoice.correct",
  "report.own_shift",
  "report.all",
  "warehouse.manage",
  "config.manage",
  "cash_drawer.open_manual",
  "audit.view",
  "banquet.manage",
  "banquet.add_extras",
];

const WAITER_PERMISSIONS = [
  "order.create",
  "order.discount_small",
  "order.transfer_table",
  "payment.close",
  "invoice.create",
  "report.own_shift",
  "banquet.add_extras",
];

const EU_ALLERGENS = [
  { code: "GLUTEN", name: "Gluten", icon: "🌾" },
  { code: "SKORUPIAKI", name: "Skorupiaki", icon: "🦐" },
  { code: "JAJA", name: "Jaja", icon: "🥚" },
  { code: "RYBY", name: "Ryby", icon: "🐟" },
  { code: "ORZECHY", name: "Orzechy", icon: "🥜" },
  { code: "SOJA", name: "Soja", icon: "🫘" },
  { code: "MLEKO", name: "Mleko", icon: "🥛" },
  { code: "SELER", name: "Seler", icon: "🥬" },
  { code: "GORCZYCA", name: "Gorczyca", icon: "🟡" },
  { code: "SEZAM", name: "Nasiona sezamu", icon: "⚪" },
  { code: "DWUTLENEK_SIARKI", name: "Dwutlenek siarki i siarczyny", icon: "🍷" },
  { code: "LUBIN", name: "Łubin", icon: "🫘" },
  { code: "MIECZAKI", name: "Mięczaki", icon: "🦪" },
  { code: "ORZECHY_ZIEMNE", name: "Orzechy ziemne", icon: "🥜" },
];

async function main() {
  console.log("🌱 Seed Karczma Łabędź — start");

  // 1. Role
  const roleAdmin = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      permissions: ADMIN_PERMISSIONS,
    },
  });
  const roleWaiter = await prisma.role.upsert({
    where: { name: "WAITER" },
    update: {},
    create: {
      name: "WAITER",
      permissions: WAITER_PERMISSIONS,
    },
  });
  console.log("  ✓ Role: ADMIN, WAITER");

  // 2. Users (PIN: bcrypt hash) — find by name, create or update pin
  const usersData = [
    { name: "Łukasz", pin: "1234", roleId: roleAdmin.id, isOwner: true },
    { name: "Kelner 1", pin: "1111", roleId: roleWaiter.id, isOwner: false },
    { name: "Kelner 2", pin: "2222", roleId: roleWaiter.id, isOwner: false },
    { name: "Kelner 3", pin: "3333", roleId: roleWaiter.id, isOwner: false },
    { name: "Kelner 4", pin: "4444", roleId: roleWaiter.id, isOwner: false },
  ];
  for (const u of usersData) {
    const existing = await prisma.user.findFirst({ where: { name: u.name } });
    const pinHash = await hashPin(u.pin);
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { pin: pinHash, roleId: u.roleId, isOwner: u.isOwner } });
    } else {
      await prisma.user.create({
        data: { name: u.name, pin: pinHash, roleId: u.roleId, isOwner: u.isOwner },
      });
    }
  }
  console.log("  ✓ Użytkownicy: Łukasz (1234), Kelner 1–4 (1111–4444)");

  // 3. Stawki VAT (TaxRate nie ma @unique na fiscalSymbol — findFirst + create)
  const ensureTaxRate = async (name: string, ratePercent: number, fiscalSymbol: string, isDefault: boolean) => {
    let r = await prisma.taxRate.findFirst({ where: { fiscalSymbol } });
    if (!r) r = await prisma.taxRate.create({ data: { name, ratePercent, fiscalSymbol, isDefault } });
    return r;
  };
  const taxA = await ensureTaxRate("VAT 23%", 23, "A", false);
  const taxB = await ensureTaxRate("VAT 8%", 8, "B", true);
  const taxC = await ensureTaxRate("VAT 5%", 5, "C", false);
  await ensureTaxRate("VAT 0%", 0, "D", false);
  await ensureTaxRate("Zw.", 0, "E", false);
  console.log("  ✓ Stawki VAT: A=23%, B=8%, C=5%, D=0%, E=zw.");

  // 4. Alergeny (14 EU)
  const allergenIds: string[] = [];
  for (const a of EU_ALLERGENS) {
    const allergen = await prisma.allergen.upsert({
      where: { code: a.code },
      update: {},
      create: { code: a.code, name: a.name, icon: a.icon },
    });
    allergenIds.push(allergen.id);
  }
  console.log("  ✓ 14 alergenów EU");

  // 5. Sale (Room nie ma @unique na name — findFirst + create)
  const ensureRoom = async (data: { name: string; capacity: number; type: "RESTAURANT" | "BANQUET" | "OUTDOOR" | "PRIVATE"; isSeasonal?: boolean; canMergeWith?: string[]; sortOrder: number }) => {
    let r = await prisma.room.findFirst({ where: { name: data.name } });
    if (!r) r = await prisma.room.create({ data: { ...data, canMergeWith: (data.canMergeWith ?? []) as unknown as object } });
    return r;
  };
  const restauracja = await ensureRoom({
    name: "Restauracja",
    capacity: 100,
    type: "RESTAURANT",
    isSeasonal: false,
    sortOrder: 1,
  });
  const salaZlota = await ensureRoom({
    name: "Sala Złota",
    capacity: 150,
    type: "BANQUET",
    isSeasonal: false,
    canMergeWith: [restauracja.id],
    sortOrder: 2,
  });
  await ensureRoom({
    name: "Sala Diamentowa",
    capacity: 150,
    type: "BANQUET",
    isSeasonal: false,
    sortOrder: 3,
  });
  const wiata = await ensureRoom({
    name: "Wiata",
    capacity: 100,
    type: "OUTDOOR",
    isSeasonal: true,
    sortOrder: 4,
  });
  await ensureRoom({
    name: "Pokój 10",
    capacity: 25,
    type: "PRIVATE",
    isSeasonal: false,
    sortOrder: 5,
  });
  console.log("  ✓ Sale: Restauracja, Sala Złota, Sala Diamentowa, Wiata, Pokój 10");

  // 6. Stoliki: Restauracja 15, Sala Złota 10, Wiata 8
  const roomsWithTables: Array<{ room: { id: string }; count: number }> = [
    { room: restauracja, count: 15 },
    { room: salaZlota, count: 10 },
    { room: wiata, count: 8 },
  ];
  for (const { room, count } of roomsWithTables) {
    const existing = await prisma.table.count({ where: { roomId: room.id } });
    if (existing === 0) {
      for (let n = 1; n <= count; n++) {
        await prisma.table.create({
          data: {
            roomId: room.id,
            number: n,
            seats: n <= 4 ? 4 : 6,
          },
        });
      }
    }
  }
  console.log("  ✓ Stoliki: Restauracja 15, Sala Złota 10, Wiata 8");

  // 7. Kategorie (Category nie ma @unique na name — findFirst + create)
  const ensureCategory = async (name: string, sortOrder: number, color?: string, parentId?: string) => {
    let c = await prisma.category.findFirst({ where: { name } });
    if (!c) c = await prisma.category.create({ data: { name, sortOrder, color: color ?? null, parentId: parentId ?? null } });
    else if (color && !c.color) await prisma.category.update({ where: { id: c.id }, data: { color } });
    return c;
  };
  const catPrzystawki = await ensureCategory("Przystawki", 1, "#f97316");
  const catZupy = await ensureCategory("Zupy", 2, "#22c55e");
  const catDaniaGlowne = await ensureCategory("Dania główne", 3, "#3b82f6");
  const catMiesne = await ensureCategory("Mięsne", 4, "#ef4444", catDaniaGlowne.id);
  const catRybne = await ensureCategory("Rybne", 5, "#06b6d4", catDaniaGlowne.id);
  const catWege = await ensureCategory("Wege", 6, "#84cc16", catDaniaGlowne.id);
  const catDesery = await ensureCategory("Desery", 7, "#ec4899");
  const catNapojeGorace = await ensureCategory("Napoje gorące", 8, "#f59e0b");
  const catNapojeZimne = await ensureCategory("Napoje zimne", 9, "#0ea5e9");
  const catPiwa = await ensureCategory("Piwa", 10, "#eab308");
  const catWina = await ensureCategory("Wina", 11, "#a855f7");
  const catAlkohole = await ensureCategory("Alkohole mocne", 12, "#6366f1");
  console.log("  ✓ Kategorie z hierarchią i kolorami");

  // 8. Pełne menu restauracji "Karczma Łabędź"
  const productsData: Array<{
    name: string;
    nameShort?: string;
    categoryId: string;
    taxRateId: string;
    priceGross: number;
    allergenCodes?: string[];
    sortOrder: number;
    estimatedPrepMinutes?: number;
  }> = [
    // ========== PRZYSTAWKI ==========
    { name: "Tatar z wołowiny", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 38, allergenCodes: ["JAJA", "GLUTEN"], sortOrder: 1, estimatedPrepMinutes: 10 },
    { name: "Sałatka Cezar", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 32, allergenCodes: ["JAJA", "MLEKO", "GLUTEN", "RYBY"], sortOrder: 2, estimatedPrepMinutes: 8 },
    { name: "Sałatka grecka", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 28, allergenCodes: ["MLEKO"], sortOrder: 3, estimatedPrepMinutes: 8 },
    { name: "Bruschetta pomidorowa", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 22, allergenCodes: ["GLUTEN"], sortOrder: 4, estimatedPrepMinutes: 6 },
    { name: "Carpaccio z polędwicy", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 42, allergenCodes: ["MLEKO"], sortOrder: 5, estimatedPrepMinutes: 8 },
    { name: "Śledzik w oleju", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 24, allergenCodes: ["RYBY"], sortOrder: 6, estimatedPrepMinutes: 5 },
    { name: "Śledzik w śmietanie", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 26, allergenCodes: ["RYBY", "MLEKO"], sortOrder: 7, estimatedPrepMinutes: 5 },
    { name: "Krewetki w czosnku", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 46, allergenCodes: ["SKORUPIAKI", "GLUTEN"], sortOrder: 8, estimatedPrepMinutes: 12 },
    { name: "Deska serów", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 48, allergenCodes: ["MLEKO", "ORZECHY"], sortOrder: 9, estimatedPrepMinutes: 8 },
    { name: "Deska wędlin", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 44, allergenCodes: ["GORCZYCA"], sortOrder: 10, estimatedPrepMinutes: 8 },
    { name: "Krokiety z kapustą", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 18, allergenCodes: ["GLUTEN", "JAJA"], sortOrder: 11, estimatedPrepMinutes: 10 },
    { name: "Krokiety z mięsem", categoryId: catPrzystawki.id, taxRateId: taxB.id, priceGross: 20, allergenCodes: ["GLUTEN", "JAJA"], sortOrder: 12, estimatedPrepMinutes: 10 },

    // ========== ZUPY ==========
    { name: "Żurek w chlebie", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 26, allergenCodes: ["GLUTEN", "SELER", "JAJA"], sortOrder: 1, estimatedPrepMinutes: 8 },
    { name: "Żurek tradycyjny", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 18, allergenCodes: ["GLUTEN", "SELER", "JAJA"], sortOrder: 2, estimatedPrepMinutes: 5 },
    { name: "Rosół z makaronem", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 18, allergenCodes: ["GLUTEN", "SELER"], sortOrder: 3, estimatedPrepMinutes: 5 },
    { name: "Barszcz czerwony", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 14, allergenCodes: ["SELER"], sortOrder: 4, estimatedPrepMinutes: 5 },
    { name: "Barszcz z uszkami", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 22, allergenCodes: ["GLUTEN", "SELER", "JAJA"], sortOrder: 5, estimatedPrepMinutes: 6 },
    { name: "Krem z pomidorów", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 16, allergenCodes: ["MLEKO", "SELER"], sortOrder: 6, estimatedPrepMinutes: 5 },
    { name: "Krem z pieczarek", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 18, allergenCodes: ["MLEKO", "SELER"], sortOrder: 7, estimatedPrepMinutes: 5 },
    { name: "Flaki po warszawsku", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 24, allergenCodes: ["SELER"], sortOrder: 8, estimatedPrepMinutes: 6 },
    { name: "Zupa ogórkowa", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 16, allergenCodes: ["MLEKO", "SELER"], sortOrder: 9, estimatedPrepMinutes: 5 },
    { name: "Kapuśniak", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 16, allergenCodes: ["SELER"], sortOrder: 10, estimatedPrepMinutes: 5 },
    { name: "Zupa dnia", categoryId: catZupy.id, taxRateId: taxB.id, priceGross: 14, allergenCodes: ["SELER"], sortOrder: 11, estimatedPrepMinutes: 5 },

    // ========== DANIA MIĘSNE ==========
    { name: "Kotlet schabowy", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 42, allergenCodes: ["GLUTEN", "JAJA"], sortOrder: 1, estimatedPrepMinutes: 18 },
    { name: "Kotlet de volaille", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 44, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 2, estimatedPrepMinutes: 18 },
    { name: "Żeberka BBQ", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 52, allergenCodes: ["GORCZYCA", "SELER", "SOJA"], sortOrder: 3, estimatedPrepMinutes: 25 },
    { name: "Żeberka w miodzie", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 54, allergenCodes: ["GORCZYCA", "SELER"], sortOrder: 4, estimatedPrepMinutes: 25 },
    { name: "Placek po zbójnicku", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 46, allergenCodes: ["GLUTEN", "MLEKO"], sortOrder: 5, estimatedPrepMinutes: 20 },
    { name: "Golonka pieczona", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 58, allergenCodes: ["GORCZYCA", "SELER"], sortOrder: 6, estimatedPrepMinutes: 30 },
    { name: "Kaczka z jabłkami", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 68, allergenCodes: ["SELER"], sortOrder: 7, estimatedPrepMinutes: 35 },
    { name: "Polędwica wołowa", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 78, allergenCodes: ["MLEKO"], sortOrder: 8, estimatedPrepMinutes: 25 },
    { name: "Stek z antrykotu", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 72, allergenCodes: [], sortOrder: 9, estimatedPrepMinutes: 20 },
    { name: "Bitki wołowe", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 48, allergenCodes: ["GLUTEN", "SELER"], sortOrder: 10, estimatedPrepMinutes: 22 },
    { name: "Rolada wołowa", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 52, allergenCodes: ["GLUTEN", "GORCZYCA"], sortOrder: 11, estimatedPrepMinutes: 25 },
    { name: "Gulasz wieprzowy", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 38, allergenCodes: ["GLUTEN", "SELER"], sortOrder: 12, estimatedPrepMinutes: 18 },
    { name: "Gulasz wołowy", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 44, allergenCodes: ["GLUTEN", "SELER"], sortOrder: 13, estimatedPrepMinutes: 18 },
    { name: "Pierogi z mięsem (12szt)", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 32, allergenCodes: ["GLUTEN", "JAJA"], sortOrder: 14, estimatedPrepMinutes: 15 },
    { name: "Schabowy po cygańsku", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 48, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 15, estimatedPrepMinutes: 20 },
    { name: "Filet z kurczaka", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 36, allergenCodes: [], sortOrder: 16, estimatedPrepMinutes: 15 },
    { name: "Kurczak w sosie grzybowym", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 42, allergenCodes: ["MLEKO"], sortOrder: 17, estimatedPrepMinutes: 18 },
    { name: "Schab pieczony", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 44, allergenCodes: [], sortOrder: 18, estimatedPrepMinutes: 22 },
    { name: "Kiełbasa z grilla", categoryId: catMiesne.id, taxRateId: taxB.id, priceGross: 28, allergenCodes: ["GORCZYCA"], sortOrder: 19, estimatedPrepMinutes: 12 },

    // ========== DANIA RYBNE ==========
    { name: "Filet z łososia", categoryId: catRybne.id, taxRateId: taxB.id, priceGross: 58, allergenCodes: ["RYBY"], sortOrder: 1, estimatedPrepMinutes: 18 },
    { name: "Łosoś w sosie koperkowym", categoryId: catRybne.id, taxRateId: taxB.id, priceGross: 62, allergenCodes: ["RYBY", "MLEKO"], sortOrder: 2, estimatedPrepMinutes: 20 },
    { name: "Pstrąg pieczony", categoryId: catRybne.id, taxRateId: taxB.id, priceGross: 52, allergenCodes: ["RYBY"], sortOrder: 3, estimatedPrepMinutes: 22 },
    { name: "Dorsz w panierce", categoryId: catRybne.id, taxRateId: taxB.id, priceGross: 48, allergenCodes: ["RYBY", "GLUTEN", "JAJA"], sortOrder: 4, estimatedPrepMinutes: 18 },
    { name: "Sandacz smażony", categoryId: catRybne.id, taxRateId: taxB.id, priceGross: 56, allergenCodes: ["RYBY", "GLUTEN", "JAJA"], sortOrder: 5, estimatedPrepMinutes: 18 },
    { name: "Ryba dnia", categoryId: catRybne.id, taxRateId: taxB.id, priceGross: 54, allergenCodes: ["RYBY"], sortOrder: 6, estimatedPrepMinutes: 20 },
    { name: "Fish & Chips", categoryId: catRybne.id, taxRateId: taxB.id, priceGross: 44, allergenCodes: ["RYBY", "GLUTEN", "JAJA"], sortOrder: 7, estimatedPrepMinutes: 18 },
    { name: "Karp smażony", categoryId: catRybne.id, taxRateId: taxB.id, priceGross: 46, allergenCodes: ["RYBY", "GLUTEN", "JAJA"], sortOrder: 8, estimatedPrepMinutes: 18 },

    // ========== DANIA WEGETARIAŃSKIE ==========
    { name: "Pierogi ruskie (12szt)", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 28, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 1, estimatedPrepMinutes: 15 },
    { name: "Pierogi z kapustą (12szt)", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 26, allergenCodes: ["GLUTEN", "JAJA"], sortOrder: 2, estimatedPrepMinutes: 15 },
    { name: "Pierogi z jagodami (12szt)", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 26, allergenCodes: ["GLUTEN", "JAJA"], sortOrder: 3, estimatedPrepMinutes: 15 },
    { name: "Naleśniki z serem", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 24, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 4, estimatedPrepMinutes: 12 },
    { name: "Naleśniki ze szpinakiem", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 26, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 5, estimatedPrepMinutes: 12 },
    { name: "Placki ziemniaczane", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 24, allergenCodes: ["GLUTEN", "JAJA"], sortOrder: 6, estimatedPrepMinutes: 15 },
    { name: "Kopytka ze szpinakiem", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 28, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 7, estimatedPrepMinutes: 12 },
    { name: "Burger wegetariański", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 36, allergenCodes: ["GLUTEN", "JAJA", "SOJA"], sortOrder: 8, estimatedPrepMinutes: 15 },
    { name: "Risotto grzybowe", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 38, allergenCodes: ["MLEKO"], sortOrder: 9, estimatedPrepMinutes: 20 },
    { name: "Makaron z warzywami", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 32, allergenCodes: ["GLUTEN"], sortOrder: 10, estimatedPrepMinutes: 15 },
    { name: "Sałatka z halloumi", categoryId: catWege.id, taxRateId: taxB.id, priceGross: 34, allergenCodes: ["MLEKO"], sortOrder: 11, estimatedPrepMinutes: 12 },

    // ========== DESERY ==========
    { name: "Szarlotka z lodami", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 22, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 1, estimatedPrepMinutes: 8 },
    { name: "Szarlotka", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 16, allergenCodes: ["GLUTEN", "JAJA"], sortOrder: 2, estimatedPrepMinutes: 5 },
    { name: "Sernik", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 18, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 3, estimatedPrepMinutes: 5 },
    { name: "Brownie z lodami", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 24, allergenCodes: ["GLUTEN", "JAJA", "MLEKO", "ORZECHY"], sortOrder: 4, estimatedPrepMinutes: 8 },
    { name: "Lody 3 gałki", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 16, allergenCodes: ["MLEKO"], sortOrder: 5, estimatedPrepMinutes: 3 },
    { name: "Lody gałka", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 6, allergenCodes: ["MLEKO"], sortOrder: 6, estimatedPrepMinutes: 2 },
    { name: "Panna cotta", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 18, allergenCodes: ["MLEKO"], sortOrder: 7, estimatedPrepMinutes: 5 },
    { name: "Tiramisu", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 22, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 8, estimatedPrepMinutes: 5 },
    { name: "Crème brûlée", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 20, allergenCodes: ["JAJA", "MLEKO"], sortOrder: 9, estimatedPrepMinutes: 8 },
    { name: "Racuchy z jabłkami", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 18, allergenCodes: ["GLUTEN", "JAJA", "MLEKO"], sortOrder: 10, estimatedPrepMinutes: 12 },
    { name: "Makowiec", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 14, allergenCodes: ["GLUTEN", "JAJA", "ORZECHY"], sortOrder: 11, estimatedPrepMinutes: 5 },
    { name: "Deser lodowy", categoryId: catDesery.id, taxRateId: taxB.id, priceGross: 26, allergenCodes: ["MLEKO", "ORZECHY"], sortOrder: 12, estimatedPrepMinutes: 6 },

    // ========== NAPOJE GORĄCE ==========
    { name: "Kawa espresso", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 9, sortOrder: 1, estimatedPrepMinutes: 3 },
    { name: "Kawa espresso podwójne", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 12, sortOrder: 2, estimatedPrepMinutes: 3 },
    { name: "Kawa americano", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 10, sortOrder: 3, estimatedPrepMinutes: 3 },
    { name: "Kawa latte", nameShort: "Latte", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 14, allergenCodes: ["MLEKO"], sortOrder: 4, estimatedPrepMinutes: 4 },
    { name: "Cappuccino", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 14, allergenCodes: ["MLEKO"], sortOrder: 5, estimatedPrepMinutes: 4 },
    { name: "Flat white", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 14, allergenCodes: ["MLEKO"], sortOrder: 6, estimatedPrepMinutes: 4 },
    { name: "Kawa po irlandzku", categoryId: catNapojeGorace.id, taxRateId: taxA.id, priceGross: 22, allergenCodes: ["MLEKO"], sortOrder: 7, estimatedPrepMinutes: 5 },
    { name: "Herbata czarna", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 8, sortOrder: 8, estimatedPrepMinutes: 3 },
    { name: "Herbata zielona", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 8, sortOrder: 9, estimatedPrepMinutes: 3 },
    { name: "Herbata owocowa", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 8, sortOrder: 10, estimatedPrepMinutes: 3 },
    { name: "Herbata z miodem", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 10, sortOrder: 11, estimatedPrepMinutes: 3 },
    { name: "Gorąca czekolada", categoryId: catNapojeGorace.id, taxRateId: taxB.id, priceGross: 14, allergenCodes: ["MLEKO"], sortOrder: 12, estimatedPrepMinutes: 4 },
    { name: "Grzaniec galicyjski", categoryId: catNapojeGorace.id, taxRateId: taxA.id, priceGross: 18, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 13, estimatedPrepMinutes: 5 },

    // ========== NAPOJE ZIMNE ==========
    { name: "Coca-Cola 0.33l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 10, sortOrder: 1, estimatedPrepMinutes: 1 },
    { name: "Coca-Cola Zero 0.33l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 10, sortOrder: 2, estimatedPrepMinutes: 1 },
    { name: "Fanta 0.33l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 10, sortOrder: 3, estimatedPrepMinutes: 1 },
    { name: "Sprite 0.33l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 10, sortOrder: 4, estimatedPrepMinutes: 1 },
    { name: "Woda mineralna 0.33l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 7, sortOrder: 5, estimatedPrepMinutes: 1 },
    { name: "Woda mineralna 0.5l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 9, sortOrder: 6, estimatedPrepMinutes: 1 },
    { name: "Woda gazowana 0.33l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 7, sortOrder: 7, estimatedPrepMinutes: 1 },
    { name: "Woda gazowana 0.5l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 9, sortOrder: 8, estimatedPrepMinutes: 1 },
    { name: "Sok pomarańczowy 0.3l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 12, sortOrder: 9, estimatedPrepMinutes: 1 },
    { name: "Sok jabłkowy 0.3l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 12, sortOrder: 10, estimatedPrepMinutes: 1 },
    { name: "Sok grejpfrutowy 0.3l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 12, sortOrder: 11, estimatedPrepMinutes: 1 },
    { name: "Lemoniada domowa", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 14, sortOrder: 12, estimatedPrepMinutes: 3 },
    { name: "Lemoniada malinowa", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 16, sortOrder: 13, estimatedPrepMinutes: 3 },
    { name: "Lemoniada ogórkowa", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 16, sortOrder: 14, estimatedPrepMinutes: 3 },
    { name: "Kompot domowy", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 8, sortOrder: 15, estimatedPrepMinutes: 1 },
    { name: "Red Bull 0.25l", categoryId: catNapojeZimne.id, taxRateId: taxB.id, priceGross: 14, sortOrder: 16, estimatedPrepMinutes: 1 },

    // ========== PIWA ==========
    { name: "Tyskie 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 14, allergenCodes: ["GLUTEN"], sortOrder: 1, estimatedPrepMinutes: 2 },
    { name: "Żywiec 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 14, allergenCodes: ["GLUTEN"], sortOrder: 2, estimatedPrepMinutes: 2 },
    { name: "Lech Premium 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 14, allergenCodes: ["GLUTEN"], sortOrder: 3, estimatedPrepMinutes: 2 },
    { name: "Perła 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 13, allergenCodes: ["GLUTEN"], sortOrder: 4, estimatedPrepMinutes: 2 },
    { name: "Kozel ciemny 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 16, allergenCodes: ["GLUTEN"], sortOrder: 5, estimatedPrepMinutes: 2 },
    { name: "Książęce 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 15, allergenCodes: ["GLUTEN"], sortOrder: 6, estimatedPrepMinutes: 2 },
    { name: "Pilsner Urquell 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 18, allergenCodes: ["GLUTEN"], sortOrder: 7, estimatedPrepMinutes: 2 },
    { name: "Heineken 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 16, allergenCodes: ["GLUTEN"], sortOrder: 8, estimatedPrepMinutes: 2 },
    { name: "Paulaner 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 18, allergenCodes: ["GLUTEN"], sortOrder: 9, estimatedPrepMinutes: 2 },
    { name: "Piwo pszeniczne 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 16, allergenCodes: ["GLUTEN"], sortOrder: 10, estimatedPrepMinutes: 2 },
    { name: "Piwo IPA 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 18, allergenCodes: ["GLUTEN"], sortOrder: 11, estimatedPrepMinutes: 2 },
    { name: "Piwo bezalkoholowe 0.5l", categoryId: catPiwa.id, taxRateId: taxB.id, priceGross: 12, allergenCodes: ["GLUTEN"], sortOrder: 12, estimatedPrepMinutes: 2 },
    { name: "Radler cytrynowy 0.5l", categoryId: catPiwa.id, taxRateId: taxA.id, priceGross: 14, allergenCodes: ["GLUTEN"], sortOrder: 13, estimatedPrepMinutes: 2 },

    // ========== WINA ==========
    { name: "Wino czerwone wytrawne kiel", nameShort: "Wino czerw. wytrawne kiel", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 18, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 1, estimatedPrepMinutes: 2 },
    { name: "Wino czerwone półwytrawne kiel", nameShort: "Wino czerw. półwytrawne kiel", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 18, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 2, estimatedPrepMinutes: 2 },
    { name: "Wino białe wytrawne kiel", nameShort: "Wino białe wytrawne kiel", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 16, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 3, estimatedPrepMinutes: 2 },
    { name: "Wino białe półwytrawne kiel", nameShort: "Wino białe półwytrawne kiel", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 16, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 4, estimatedPrepMinutes: 2 },
    { name: "Wino różowe kiel", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 16, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 5, estimatedPrepMinutes: 2 },
    { name: "Prosecco kiel", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 22, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 6, estimatedPrepMinutes: 2 },
    { name: "Szampan kiel", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 38, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 7, estimatedPrepMinutes: 2 },
    { name: "Wino czerwone but. 0.75l", nameShort: "Wino czerwone butelka", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 75, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 8, estimatedPrepMinutes: 3 },
    { name: "Wino białe but. 0.75l", nameShort: "Wino białe butelka", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 68, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 9, estimatedPrepMinutes: 3 },
    { name: "Prosecco but. 0.75l", nameShort: "Prosecco butelka", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 95, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 10, estimatedPrepMinutes: 3 },
    { name: "Aperol Spritz", categoryId: catWina.id, taxRateId: taxA.id, priceGross: 26, allergenCodes: ["DWUTLENEK_SIARKI"], sortOrder: 11, estimatedPrepMinutes: 4 },

    // ========== ALKOHOLE MOCNE ==========
    { name: "Wódka Żubrówka 50ml", nameShort: "Żubrówka 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 12, sortOrder: 1, estimatedPrepMinutes: 1 },
    { name: "Wódka Wyborowa 50ml", nameShort: "Wyborowa 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 12, sortOrder: 2, estimatedPrepMinutes: 1 },
    { name: "Wódka Finlandia 50ml", nameShort: "Finlandia 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 14, sortOrder: 3, estimatedPrepMinutes: 1 },
    { name: "Wódka Grey Goose 50ml", nameShort: "Grey Goose 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 28, sortOrder: 4, estimatedPrepMinutes: 1 },
    { name: "Whisky Jameson 50ml", nameShort: "Jameson 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 18, sortOrder: 5, estimatedPrepMinutes: 1 },
    { name: "Whisky Jack Daniel's 50ml", nameShort: "Jack Daniel's 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 22, sortOrder: 6, estimatedPrepMinutes: 1 },
    { name: "Whisky Johnnie Walker 50ml", nameShort: "J. Walker 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 24, sortOrder: 7, estimatedPrepMinutes: 1 },
    { name: "Whisky Glenfiddich 50ml", nameShort: "Glenfiddich 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 38, sortOrder: 8, estimatedPrepMinutes: 1 },
    { name: "Rum Bacardi 50ml", nameShort: "Bacardi 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 16, sortOrder: 9, estimatedPrepMinutes: 1 },
    { name: "Rum Havana Club 50ml", nameShort: "Havana Club 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 18, sortOrder: 10, estimatedPrepMinutes: 1 },
    { name: "Gin Beefeater 50ml", nameShort: "Beefeater 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 18, sortOrder: 11, estimatedPrepMinutes: 1 },
    { name: "Gin Bombay Sapphire 50ml", nameShort: "Bombay Sapphire 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 22, sortOrder: 12, estimatedPrepMinutes: 1 },
    { name: "Koniak Hennessy 50ml", nameShort: "Hennessy 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 32, sortOrder: 13, estimatedPrepMinutes: 1 },
    { name: "Tequila Sierra 50ml", nameShort: "Sierra 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 16, sortOrder: 14, estimatedPrepMinutes: 1 },
    { name: "Jägermeister 50ml", nameShort: "Jäger 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 16, sortOrder: 15, estimatedPrepMinutes: 1 },
    { name: "Likier Baileys 50ml", nameShort: "Baileys 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 16, allergenCodes: ["MLEKO"], sortOrder: 16, estimatedPrepMinutes: 1 },
    { name: "Likier Amaretto 50ml", nameShort: "Amaretto 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 14, allergenCodes: ["ORZECHY"], sortOrder: 17, estimatedPrepMinutes: 1 },
    { name: "Nalewka wiśniowa 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 14, sortOrder: 18, estimatedPrepMinutes: 1 },
    { name: "Nalewka pigwowa 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 14, sortOrder: 19, estimatedPrepMinutes: 1 },
    { name: "Śliwowica 50ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 18, sortOrder: 20, estimatedPrepMinutes: 1 },
    { name: "Miód pitny 100ml", categoryId: catAlkohole.id, taxRateId: taxA.id, priceGross: 22, sortOrder: 21, estimatedPrepMinutes: 2 },
  ];

  const allergenByCode = await prisma.allergen.findMany().then((list) => Object.fromEntries(list.map((a) => [a.code, a.id])));
  let productCount = 0;
  for (const p of productsData) {
    let product = await prisma.product.findFirst({ where: { name: p.name } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: p.name,
          nameShort: p.nameShort ?? p.name.slice(0, 40),
          categoryId: p.categoryId,
          taxRateId: p.taxRateId,
          priceGross: p.priceGross,
          sortOrder: p.sortOrder,
          estimatedPrepMinutes: p.estimatedPrepMinutes ?? null,
        },
      });
      productCount++;
    }
    if (p.allergenCodes?.length) {
      for (const code of p.allergenCodes) {
        const aid = allergenByCode[code];
        if (aid) {
          await prisma.productAllergen.upsert({
            where: { productId_allergenId: { productId: product.id, allergenId: aid } },
            update: {},
            create: { productId: product.id, allergenId: aid },
          });
        }
      }
    }
  }
  console.log(`  ✓ ${productsData.length} produktów w menu (${productCount} nowych) z cenami, VAT i alergenami`);

  // 8b. Grupy modyfikatorów i modyfikatory
  const ensureModifierGroup = async (name: string, minSelect: number, maxSelect: number, isRequired: boolean) => {
    let g = await prisma.modifierGroup.findFirst({ where: { name } });
    if (!g) g = await prisma.modifierGroup.create({ data: { name, minSelect, maxSelect, isRequired } });
    return g;
  };
  const ensureModifier = async (groupId: string, name: string, priceDelta: number, sortOrder: number) => {
    let m = await prisma.modifier.findFirst({ where: { groupId, name } });
    if (!m) m = await prisma.modifier.create({ data: { groupId, name, priceDelta, sortOrder } });
    return m;
  };

  // Stopień wysmażenia
  const grpWysmaz = await ensureModifierGroup("Stopień wysmażenia", 0, 1, false);
  await ensureModifier(grpWysmaz.id, "Rare (krwisty)", 0, 1);
  await ensureModifier(grpWysmaz.id, "Medium rare", 0, 2);
  await ensureModifier(grpWysmaz.id, "Medium", 0, 3);
  await ensureModifier(grpWysmaz.id, "Medium well", 0, 4);
  await ensureModifier(grpWysmaz.id, "Well done (wysmażony)", 0, 5);

  // Dodatki do dań głównych
  const grpDodatki = await ensureModifierGroup("Dodatki", 0, 3, false);
  await ensureModifier(grpDodatki.id, "Frytki", 8, 1);
  await ensureModifier(grpDodatki.id, "Ziemniaki opiekane", 8, 2);
  await ensureModifier(grpDodatki.id, "Ziemniaki puree", 8, 3);
  await ensureModifier(grpDodatki.id, "Ryż", 6, 4);
  await ensureModifier(grpDodatki.id, "Kasza gryczana", 6, 5);
  await ensureModifier(grpDodatki.id, "Warzywa grillowane", 10, 6);
  await ensureModifier(grpDodatki.id, "Surówka z kapusty", 5, 7);
  await ensureModifier(grpDodatki.id, "Surówka z marchewki", 5, 8);
  await ensureModifier(grpDodatki.id, "Mix sałat", 8, 9);
  await ensureModifier(grpDodatki.id, "Buraki", 5, 10);

  // Sosy
  const grpSosy = await ensureModifierGroup("Sosy", 0, 2, false);
  await ensureModifier(grpSosy.id, "Sos pieprzowy", 6, 1);
  await ensureModifier(grpSosy.id, "Sos grzybowy", 6, 2);
  await ensureModifier(grpSosy.id, "Sos czosnkowy", 4, 3);
  await ensureModifier(grpSosy.id, "Sos tatarski", 4, 4);
  await ensureModifier(grpSosy.id, "Sos BBQ", 4, 5);
  await ensureModifier(grpSosy.id, "Sos miodowo-musztardowy", 5, 6);
  await ensureModifier(grpSosy.id, "Masło czosnkowe", 5, 7);

  // Opcje pierogów
  const grpPierogi = await ensureModifierGroup("Opcje pierogów", 0, 1, false);
  await ensureModifier(grpPierogi.id, "Ze skwarkami", 4, 1);
  await ensureModifier(grpPierogi.id, "Ze śmietaną", 3, 2);
  await ensureModifier(grpPierogi.id, "Z cebulką", 3, 3);

  // Rodzaj mleka do kawy
  const grpMleko = await ensureModifierGroup("Rodzaj mleka", 0, 1, false);
  await ensureModifier(grpMleko.id, "Mleko krowie", 0, 1);
  await ensureModifier(grpMleko.id, "Mleko owsiane", 3, 2);
  await ensureModifier(grpMleko.id, "Mleko sojowe", 3, 3);
  await ensureModifier(grpMleko.id, "Mleko migdałowe", 4, 4);

  // Przypisz grupy modyfikatorów do produktów
  const productsByName = await prisma.product.findMany().then(list => Object.fromEntries(list.map(p => [p.name, p.id])));

  // Steki i dania mięsne z opcją wysmażenia
  const steakProducts = ["Polędwica wołowa", "Stek z antrykotu"];
  for (const name of steakProducts) {
    const pid = productsByName[name];
    if (pid) {
      await prisma.productModifierGroup.upsert({
        where: { productId_modifierGroupId: { productId: pid, modifierGroupId: grpWysmaz.id } },
        update: {},
        create: { productId: pid, modifierGroupId: grpWysmaz.id },
      });
    }
  }

  // Dania główne z dodatkami
  const mainDishProducts = [
    "Kotlet schabowy", "Kotlet de volaille", "Żeberka BBQ", "Żeberka w miodzie",
    "Golonka pieczona", "Kaczka z jabłkami", "Polędwica wołowa", "Stek z antrykotu",
    "Bitki wołowe", "Rolada wołowa", "Gulasz wieprzowy", "Gulasz wołowy",
    "Schabowy po cygańsku", "Filet z kurczaka", "Kurczak w sosie grzybowym", "Schab pieczony",
    "Filet z łososia", "Łosoś w sosie koperkowym", "Pstrąg pieczony", "Dorsz w panierce",
    "Sandacz smażony", "Fish & Chips", "Karp smażony"
  ];
  for (const name of mainDishProducts) {
    const pid = productsByName[name];
    if (pid) {
      await prisma.productModifierGroup.upsert({
        where: { productId_modifierGroupId: { productId: pid, modifierGroupId: grpDodatki.id } },
        update: {},
        create: { productId: pid, modifierGroupId: grpDodatki.id },
      });
      await prisma.productModifierGroup.upsert({
        where: { productId_modifierGroupId: { productId: pid, modifierGroupId: grpSosy.id } },
        update: {},
        create: { productId: pid, modifierGroupId: grpSosy.id },
      });
    }
  }

  // Pierogi z opcjami
  const pierogiProducts = ["Pierogi ruskie (12szt)", "Pierogi z kapustą (12szt)", "Pierogi z mięsem (12szt)"];
  for (const name of pierogiProducts) {
    const pid = productsByName[name];
    if (pid) {
      await prisma.productModifierGroup.upsert({
        where: { productId_modifierGroupId: { productId: pid, modifierGroupId: grpPierogi.id } },
        update: {},
        create: { productId: pid, modifierGroupId: grpPierogi.id },
      });
    }
  }

  // Kawy z wyborem mleka
  const coffeeProducts = ["Kawa latte", "Cappuccino", "Flat white"];
  for (const name of coffeeProducts) {
    const pid = productsByName[name];
    if (pid) {
      await prisma.productModifierGroup.upsert({
        where: { productId_modifierGroupId: { productId: pid, modifierGroupId: grpMleko.id } },
        update: {},
        create: { productId: pid, modifierGroupId: grpMleko.id },
      });
    }
  }
  console.log("  ✓ Grupy modyfikatorów: wysmażenie, dodatki, sosy, pierogi, mleko");

  // 9. Magazyny (Warehouse nie ma @unique na name — findFirst + create)
  const ensureWarehouse = async (name: string, type: "MAIN" | "BAR" | "KITCHEN" | "COLD_STORAGE") => {
    const w = await prisma.warehouse.findFirst({ where: { name } });
    if (!w) await prisma.warehouse.create({ data: { name, type } });
  };
  await ensureWarehouse("Główny", "MAIN");
  await ensureWarehouse("Bar", "BAR");
  await ensureWarehouse("Kuchnia", "KITCHEN");
  await ensureWarehouse("Chłodnia", "COLD_STORAGE");
  console.log("  ✓ Magazyny: Główny, Bar, Kuchnia, Chłodnia");

  // 9b. Przykładowe składniki i stany (dla modułu magazynowego)
  const mainWarehouse = await prisma.warehouse.findFirst({ where: { name: "Główny" } });
  if (mainWarehouse) {
    const ensureIngredient = async (name: string, unit: string, category?: string, defaultSupplier?: string) => {
      let ing = await prisma.ingredient.findFirst({ where: { name } });
      if (!ing) ing = await prisma.ingredient.create({ data: { name, unit, category: category ?? null, defaultSupplier: defaultSupplier ?? null } });
      return ing;
    };
    const ingSchab = await ensureIngredient("Schab wieprzowy", "kg", "Mięso", "Dostawca ABC");
    const ingZiemniaki = await ensureIngredient("Ziemniaki", "kg", "Warzywa", "Dostawca ABC");
    const ingBulka = await ensureIngredient("Bułka tarta", "kg", "Suche", undefined);
    const ingOlej = await ensureIngredient("Olej", "l", "Tłuszcze", undefined);
    const ingPiwo = await ensureIngredient("Piwo jasne", "szt", "Napoje", "Browar X");
    for (const [ing, qty, minQty] of [
      [ingSchab, 10, 5],
      [ingZiemniaki, 50, 20],
      [ingBulka, 2, 1],
      [ingOlej, 5, 2],
      [ingPiwo, 100, 24],
    ] as const) {
      const existing = await prisma.stockItem.findFirst({ where: { warehouseId: mainWarehouse.id, ingredientId: ing.id } });
      if (!existing) {
        await prisma.stockItem.create({
          data: { warehouseId: mainWarehouse.id, ingredientId: ing.id, quantity: qty, unit: ing.unit, minQuantity: minQty },
        });
      }
    }
    console.log("  ✓ Przykładowe składniki i stany w magazynie Główny");
  }

  // 10. Stacje KDS (Kuchnia Ciepła, Kuchnia Zimna, Bar) + przypisanie kategorii
  const ensureKDSStation = async (name: string, displayOrder: number, categoryIds: string[]) => {
    let station = await prisma.kDSStation.findFirst({ where: { name } });
    if (!station) {
      station = await prisma.kDSStation.create({ data: { name, displayOrder } });
    }
    for (const categoryId of categoryIds) {
      await prisma.kDSStationCategory.upsert({
        where: { stationId_categoryId: { stationId: station.id, categoryId } },
        update: {},
        create: { stationId: station.id, categoryId },
      });
    }
    return station;
  };
  await ensureKDSStation("Kuchnia Ciepła", 1, [catZupy.id, catMiesne.id, catRybne.id, catWege.id]);
  await ensureKDSStation("Kuchnia Zimna", 2, [catPrzystawki.id, catDesery.id]);
  await ensureKDSStation("Bar", 3, [catNapojeGorace.id, catNapojeZimne.id, catPiwa.id, catWina.id, catAlkohole.id]);
  console.log("  ✓ Stacje KDS: Kuchnia Ciepła, Kuchnia Zimna, Bar");

  // 11. SystemConfig
  const configs = [
    { key: "companyName", value: "Karczma Łabędź" },
    { key: "sessionTimeoutMinutes", value: 5 },
    { key: "discountThresholdPercent", value: 10 },
  ];
  const kdsRetention = { key: "kdsServedRetentionMinutes", value: 30 };
  const kdsAlarmMinutes = { key: "kdsAlarmAfterMinutes", value: 20 };
  for (const c of [...configs, kdsRetention, kdsAlarmMinutes]) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: { value: c.value as unknown as object },
      create: { key: c.key, value: c.value as unknown as object },
    });
  }
  console.log("  ✓ SystemConfig: nazwa firmy, timeout 5 min, próg rabatu 10%, KDS retencja 30 min, alarm 20 min");

  // 12. Promocje / Happy Hour
  const now = new Date();
  const yearFromNow = new Date(now);
  yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);

  const happyHourPromo = await prisma.promotion.findFirst({ where: { name: "Happy Hour Piwa" } });
  if (!happyHourPromo) {
    await prisma.promotion.create({
      data: {
        name: "Happy Hour Piwa",
        type: "happy_hour",
        rulesJson: {
          categoryId: catPiwa.id,
          discountPercent: 20,
          timeFrom: "15:00",
          timeTo: "18:00",
        },
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        isActive: true,
        validFrom: now,
        validTo: yearFromNow,
      },
    });
  }

  const lunchPromo = await prisma.promotion.findFirst({ where: { name: "Lunch Special" } });
  if (!lunchPromo) {
    await prisma.promotion.create({
      data: {
        name: "Lunch Special",
        type: "daily_special",
        rulesJson: {
          categoryId: catZupy.id,
          discountPercent: 15,
          timeFrom: "11:00",
          timeTo: "14:00",
        },
        daysOfWeek: [1, 2, 3, 4, 5],
        isActive: true,
        validFrom: now,
        validTo: yearFromNow,
      },
    });
  }
  console.log("  ✓ Promocje: Happy Hour Piwa, Lunch Special");

  // 13. Rabaty (Discount)
  const ensureDiscount = async (name: string, type: "PERCENT" | "AMOUNT" | "PROMO", value: number) => {
    let d = await prisma.discount.findFirst({ where: { name } });
    if (!d) {
      d = await prisma.discount.create({
        data: { name, type, value, isActive: true },
      });
    }
    return d;
  };
  await ensureDiscount("Rabat 10%", "PERCENT", 10);
  await ensureDiscount("Rabat 20%", "PERCENT", 20);
  await ensureDiscount("Rabat 50 zł", "AMOUNT", 50);
  await ensureDiscount("Rabat VIP", "PERCENT", 15);
  await ensureDiscount("Kod promocyjny", "PROMO", 25);
  console.log("  ✓ Rabaty: 10%, 20%, 50zł, VIP, Kod promocyjny");

  // 14. Vouchery / Bony podarunkowe
  const ensureGiftVoucher = async (code: string, value: number, balance?: number) => {
    let v = await prisma.giftVoucher.findFirst({ where: { code } });
    if (!v) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      v = await prisma.giftVoucher.create({
        data: {
          code,
          initialValue: value,
          balance: balance ?? value,
          isActive: true,
          expiresAt,
        },
      });
    }
    return v;
  };
  await ensureGiftVoucher("BON100", 100);
  await ensureGiftVoucher("BON200", 200);
  await ensureGiftVoucher("BON500", 500);
  await ensureGiftVoucher("TESTBON50", 50);
  await ensureGiftVoucher("ZEROSALDO", 100, 0); // voucher z zerowym saldem do testów negatywnych
  console.log("  ✓ Vouchery: BON100, BON200, BON500, TESTBON50, ZEROSALDO");

  // 15. Strefy dostawy
  const ensureDeliveryZone = async (number: number, name: string, deliveryCost: number, estimatedMinutes: number, minOrderFree?: number) => {
    let z = await prisma.deliveryZone.findFirst({ where: { number } });
    if (!z) {
      z = await prisma.deliveryZone.create({
        data: {
          number,
          name,
          deliveryCost,
          driverCommission: deliveryCost * 0.5,
          estimatedMinutes,
          minOrderForFreeDelivery: minOrderFree ?? null,
          isActive: true,
          sortOrder: number,
        },
      });
    }
    return z;
  };
  await ensureDeliveryZone(1, "Centrum", 0, 20, 50);
  await ensureDeliveryZone(2, "Obrzeża miasta", 10, 35, 100);
  await ensureDeliveryZone(3, "Przedmieścia", 15, 45, 150);
  await ensureDeliveryZone(4, "Okolice (daleko)", 25, 60, 200);
  console.log("  ✓ Strefy dostawy: Centrum, Obrzeża, Przedmieścia, Okolice");

  // 16. Upewnij się, że stoliki mają status FREE
  const tablesUpdated = await prisma.table.updateMany({
    where: { status: { not: "FREE" } },
    data: { status: "FREE" },
  });
  if (tablesUpdated.count > 0) {
    console.log(`  ✓ Reset ${tablesUpdated.count} stolików na FREE`);
  }

  // 17. Aktywna zmiana dla testów
  const testUser = await prisma.user.findFirst({ where: { name: "Kelner 1" } });
  if (testUser) {
    const existingShift = await prisma.shift.findFirst({
      where: { userId: testUser.id, status: "OPEN" },
    });
    if (!existingShift) {
      await prisma.shift.create({
        data: {
          userId: testUser.id,
          cashStart: 500,
          status: "OPEN",
        },
      });
      console.log("  ✓ Otwarta zmiana dla Kelner 1");
    } else {
      console.log("  ✓ Zmiana dla Kelner 1 już istnieje");
    }
  }

  // 18. Testowi kierowcy dostawy (powiązani z User)
  const ensureDeliveryDriver = async (userName: string, pin: string, phone: string, vehicleType: string, isAvailable: boolean) => {
    let user = await prisma.user.findFirst({ where: { name: userName } });
    const pinHash = await hashPin(pin);
    if (!user) {
      user = await prisma.user.create({
        data: { name: userName, pin: pinHash, roleId: roleWaiter.id, isOwner: false },
      });
    }
    let driver = await prisma.deliveryDriver.findFirst({ where: { userId: user.id } });
    if (!driver) {
      driver = await prisma.deliveryDriver.create({
        data: { userId: user.id, phoneNumber: phone, vehicleType, isAvailable },
      });
    }
    return driver;
  };
  await ensureDeliveryDriver("Kierowca Jan", "5555", "500100200", "car", true);
  await ensureDeliveryDriver("Kierowca Adam", "6666", "500200300", "scooter", true);
  await ensureDeliveryDriver("Kierowca Piotr", "7777", "500300400", "bike", false); // nieaktywny
  console.log("  ✓ Kierowcy: Kierowca Jan, Kierowca Adam, Kierowca Piotr");

  // 19. Testowe zamówienie (otwarte) dla testów
  const firstTable = await prisma.table.findFirst({ where: { status: "FREE" } });
  const testWaiter = await prisma.user.findFirst({ where: { name: "Kelner 1" } });
  if (firstTable && testWaiter) {
    const existingTestOrder = await prisma.order.findFirst({
      where: { tableId: firstTable.id, status: "OPEN" },
    });
    if (!existingTestOrder) {
      const testProduct = await prisma.product.findFirst({ where: { name: "Kotlet schabowy" } });
      const testProduct2 = await prisma.product.findFirst({ where: { name: "Żurek w chlebie" } });
      if (testProduct && testProduct2) {
        const order = await prisma.order.create({
          data: {
            tableId: firstTable.id,
            roomId: firstTable.roomId,
            userId: testWaiter.id,
            status: "OPEN",
            type: "DINE_IN",
            guestCount: 2,
          },
        });
        // Dodaj pozycje
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: testProduct.id,
            quantity: 2,
            unitPrice: testProduct.priceGross,
            taxRateId: testProduct.taxRateId,
            courseNumber: 2,
          },
        });
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: testProduct2.id,
            quantity: 2,
            unitPrice: testProduct2.priceGross,
            taxRateId: testProduct2.taxRateId,
            courseNumber: 1,
          },
        });
        // Oznacz stolik jako zajęty
        await prisma.table.update({
          where: { id: firstTable.id },
          data: { status: "OCCUPIED" },
        });
        console.log(`  ✓ Testowe zamówienie #${order.orderNumber} na stoliku ${firstTable.number}`);
      }
    } else {
      console.log("  ✓ Testowe zamówienie już istnieje");
    }
  }

  // 20. Pozostaw co najmniej 5 wolnych stolików do testów
  const occupiedTables = await prisma.table.findMany({ where: { status: "OCCUPIED" } });
  const freeTables = await prisma.table.findMany({ where: { status: "FREE" } });
  if (freeTables.length < 5 && occupiedTables.length > 1) {
    // Zwolnij część stolików (nie ruszaj pierwszego zajętego z testowym zamówieniem)
    const toFree = occupiedTables.slice(1, Math.min(5, occupiedTables.length));
    for (const t of toFree) {
      await prisma.table.update({ where: { id: t.id }, data: { status: "FREE" } });
    }
    console.log(`  ✓ Zwolniono ${toFree.length} stolików`);
  }
  console.log(`  ✓ Wolne stoliki: ${freeTables.length >= 5 ? freeTables.length : '>=5'}`);

  console.log("✅ Seed zakończony.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
