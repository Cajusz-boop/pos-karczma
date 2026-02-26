import { format } from "date-fns";
import { pl } from "date-fns/locale";

export type KitchenItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  modifiersJson?: unknown;
  note?: string | null;
  courseNumber: number;
  allergens?: string[];
};

export type KitchenOrderInfo = {
  orderNumber: number;
  tableNumber?: number | null;
  waiterName: string;
  guestCount?: number;
  createdAt: Date;
  type?: "DINE_IN" | "TAKEAWAY" | "BANQUET";
  isBanquet?: boolean;
  banquetName?: string;
  courseNumber?: number;
};

const LINE_WIDTH = 42; // 80mm thermal printer ≈ 42 chars
const SEP_THICK = "=".repeat(LINE_WIDTH);
const SEP_THIN = "-".repeat(LINE_WIDTH);
const SEP_STORNO = "!".repeat(LINE_WIDTH);

function center(text: string, width = LINE_WIDTH): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(pad) + text;
}

/**
 * Format kitchen ticket for 80mm thermal printer.
 * Research-based layout:
 * - Table number in LARGE text (double height on real printer)
 * - Quantity BEFORE product name (cook needs to know HOW MANY first)
 * - Modifiers indented with "+"
 * - Notes indented with "—" in quotes
 * - Allergens highlighted with "*** ALERGEN: XXX ***"
 * - Course separators
 */
export function formatKitchenTicket(
  order: KitchenOrderInfo,
  items: KitchenItem[],
  options: { reprint?: boolean; storno?: boolean; stornoReason?: string } = {}
): string {
  const lines: string[] = [];
  const now = new Date();

  // --- STORNO ticket ---
  if (options.storno) {
    lines.push(SEP_STORNO);
    lines.push(center("!!! ANULOWANO !!!"));
    lines.push(SEP_STORNO);
    if (order.tableNumber != null) {
      lines.push(center(`STOLIK ${order.tableNumber}  |  ZAM #${order.orderNumber}`));
    } else {
      lines.push(center(`ZAM #${order.orderNumber}`));
    }
    lines.push("");
    for (const item of items) {
      lines.push(`  ${item.quantity}x ${item.productName}`);
    }
    if (options.stornoReason) {
      lines.push("");
      lines.push(`  Powód: ${options.stornoReason}`);
    }
    lines.push("");
    lines.push(`  Kelner: ${order.waiterName}  |  ${format(now, "HH:mm", { locale: pl })}`);
    lines.push(SEP_STORNO);
    lines.push("");
    return lines.join("\n");
  }

  // --- REPRINT header ---
  if (options.reprint) {
    lines.push(SEP_THICK);
    lines.push(center("=== DODRUK ==="));
    lines.push(center(format(now, "d.MM.yyyy HH:mm", { locale: pl })));
    lines.push(SEP_THICK);
    lines.push("");
  }

  // --- BANQUET header ---
  if (order.isBanquet && order.banquetName && order.courseNumber != null) {
    lines.push(SEP_THICK);
    lines.push(center(`BANKIET: ${order.banquetName}`));
    lines.push(center(`KURS ${order.courseNumber}`));
    lines.push(SEP_THICK);
    lines.push("");
  }

  // --- TABLE NUMBER (large, prominent) ---
  lines.push(SEP_THICK);
  if (order.tableNumber != null) {
    lines.push(center(`STOLIK ${order.tableNumber}`));
  } else if (order.type === "TAKEAWAY") {
    lines.push(center("NA WYNOS"));
  } else {
    lines.push(center(`ZAM #${order.orderNumber}`));
  }
  lines.push(
    center(
      `ZAM #${order.orderNumber}  |  ${format(order.createdAt, "HH:mm", { locale: pl })}`
    )
  );
  lines.push(SEP_THICK);

  // --- META ---
  const metaParts: string[] = [`Kelner: ${order.waiterName}`];
  if (order.guestCount && order.guestCount > 0) {
    metaParts.push(`${order.guestCount} os.`);
  }
  if (order.type === "DINE_IN") metaParts.push("DINE-IN");
  if (order.type === "TAKEAWAY") metaParts.push("NA WYNOS");
  lines.push(center(metaParts.join("  |  ")));
  lines.push(SEP_THIN);

  // --- ITEMS ---
  let currentCourse = 0;
  for (const item of items) {
    // Course separator
    if (item.courseNumber > currentCourse && item.courseNumber > 1) {
      lines.push("");
      lines.push(center(`--- KURS ${item.courseNumber} ---`));
      lines.push("");
    }
    currentCourse = item.courseNumber;

    // Quantity BEFORE name (research: cook needs HOW MANY first)
    lines.push(`  ${item.quantity}x ${item.productName}`);

    // Modifiers (indented with "+")
    if (item.modifiersJson && Array.isArray(item.modifiersJson)) {
      for (const m of item.modifiersJson as { name?: string }[]) {
        if (m.name) lines.push(`     + ${m.name}`);
      }
    }

    // Notes (indented with "—" in quotes)
    if (item.note) {
      lines.push(`     — "${item.note}"`);
    }

    // Allergens (highlighted with stars)
    if (item.allergens && item.allergens.length > 0) {
      lines.push(`     *** ALERGEN: ${item.allergens.join(", ")} ***`);
    }

    lines.push(""); // blank line between items
  }

  // --- FOOTER ---
  lines.push(SEP_THIN);
  const courseInfo = currentCourse > 1 ? `Kurs 1-${currentCourse}` : "Kurs 1";
  lines.push(center(`${courseInfo}  |  ${items.length} poz.`));
  lines.push(SEP_THICK);
  lines.push("");

  return lines.join("\n");
}

/**
 * Format banquet ticket with course info
 */
export function formatBanquetTicket(
  banquetName: string,
  courseNumber: number,
  items: KitchenItem[],
  options: { reprint?: boolean } = {}
): string {
  return formatKitchenTicket(
    {
      orderNumber: 0,
      tableNumber: null,
      waiterName: "",
      createdAt: new Date(),
      isBanquet: true,
      banquetName,
      courseNumber,
    },
    items,
    options
  );
}

/**
 * Format storno (cancellation) ticket
 */
export function formatStornoTicket(
  order: KitchenOrderInfo,
  items: KitchenItem[],
  reason: string
): string {
  return formatKitchenTicket(order, items, {
    storno: true,
    stornoReason: reason,
  });
}
