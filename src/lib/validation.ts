import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Parse and validate request body with a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<
  | { data: z.infer<T>; error?: never }
  | { data?: never; error: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: "Nieprawidłowy format JSON" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    );
    return {
      error: NextResponse.json(
        { error: "Błąd walidacji", details: messages },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

/**
 * Parse body that may be empty (e.g. optional JSON).
 * Returns empty object if body is missing/empty.
 */
export async function parseBodyOptional<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<
  | { data: z.infer<T>; error?: never }
  | { data?: never; error: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    );
    return {
      error: NextResponse.json(
        { error: "Błąd walidacji", details: messages },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

// ─── Auth ────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  userId: z.string().min(1, "Wymagany userId"),
  pin: z.string().min(1, "Wymagany PIN"),
});

export const tokenLoginSchema = z.object({
  tokenId: z.string().min(1, "Wymagany identyfikator tokenu (NFC/barcode/karta)"),
});

// ─── Orders ──────────────────────────────────────────────────────────
export const createOrderSchema = z.object({
  tableId: z.string().min(1).optional(),
  roomId: z.string().min(1).optional(),
  userId: z.string().min(1, "Wymagany userId"),
  guestCount: z.number().int().min(1, "Minimalna liczba gości: 1"),
  type: z.enum(["DINE_IN", "TAKEAWAY", "BANQUET"]).optional(),
});

export const sendItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  quantity: z.number().positive("Ilość musi być > 0"),
  unitPrice: z.number().min(0, "Cena nie może być ujemna"),
  taxRateId: z.string().min(1),
  modifiersJson: z.unknown().optional(),
  note: z.string().max(200).optional(),
  courseNumber: z.number().int().min(1).optional(),
});

export const sendOrderSchema = z.object({
  items: z.array(sendItemSchema).min(1, "Wymagana co najmniej 1 pozycja"),
});

export const updateOrderSchema = z.object({
  guestCount: z.number().int().min(1).optional(),
  discountJson: z.unknown().optional(),
  note: z.string().max(500).optional(),
}).passthrough();

export const closeOrderSchema = z.object({
  receipt: z.boolean().optional().default(true),
  buyerNip: z.string().max(20).optional(),
});

export const splitOrderSchema = z.object({
  itemIdsForNewOrder: z.array(z.string().min(1)).min(1, "Podaj pozycje do przeniesienia"),
  targetTableId: z.string().optional(),
});

export const moveOrderSchema = z.object({
  targetTableId: z.string().min(1, "Podaj docelowy stolik"),
  mergeIfOccupied: z.boolean().optional(),
});

export const mergeOrdersSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(2, "Podaj co najmniej 2 zamówienia"),
  leadingUserId: z.string().optional(),
});

export const cancelItemSchema = z.object({
  reason: z.string().max(200).optional(),
  userId: z.string().optional(),
}).optional().default({});

export const updateItemStatusSchema = z.object({
  status: z.enum(["ORDERED", "SENT", "IN_PROGRESS", "READY", "SERVED", "CANCELLED"]),
});

export const releaseCourseSchema = z.object({
  courseNumber: z.number().int().min(1),
});

// ─── Payments ────────────────────────────────────────────────────────
const paymentMethodEnum = z.enum(["CASH", "CARD", "BLIK", "TRANSFER", "VOUCHER", "ROOM_CHARGE"]);

export const paymentInputSchema = z.object({
  method: paymentMethodEnum,
  amount: z.number().positive("Kwota musi być > 0"),
  transactionRef: z.string().max(100).optional(),
});

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Wymagany orderId"),
  payments: z.array(paymentInputSchema).min(1, "Wymagana co najmniej 1 płatność"),
  tipAmount: z.number().min(0).optional(),
  tipUserId: z.string().optional(),
});

// ─── Invoices ────────────────────────────────────────────────────────
export const createInvoiceSchema = z.object({
  orderId: z.string().min(1),
  buyerName: z.string().min(1, "Wymagana nazwa nabywcy"),
  buyerNip: z.string().min(1, "Wymagany NIP"),
  buyerAddress: z.string().optional(),
}).passthrough();

export const advanceInvoiceSchema = z.object({
  banquetEventId: z.string().min(1, "Wymagany banquetEventId"),
  amount: z.number().positive("Kwota musi być > 0"),
  paymentMethod: z.string().optional(),
  buyerNip: z.string().optional(),
  buyerName: z.string().optional(),
  buyerAddress: z.string().optional(),
});

// ─── Shifts ──────────────────────────────────────────────────────────
export const createShiftSchema = z.object({
  userId: z.string().min(1, "Wymagany userId"),
  cashStart: z.number().min(0).optional().default(0),
});

export const closeShiftSchema = z.object({
  cashEnd: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
}).passthrough();

// ─── Reservations ────────────────────────────────────────────────────
export const createReservationSchema = z.object({
  roomId: z.string().min(1, "Wymagana sala"),
  tableId: z.string().nullable().optional(),
  date: z.string().min(1, "Wymagana data"),
  timeFrom: z.string().min(1, "Wymagana godzina"),
  timeTo: z.string().nullable().optional(),
  guestName: z.string().min(1, "Wymagane imię gościa"),
  guestPhone: z.string().nullable().optional(),
  guestEmail: z.string().email().optional().or(z.literal("")).nullable().optional(),
  guestCount: z.number().int().min(1).optional().default(1),
  notes: z.string().max(500).nullable().optional(),
}).passthrough();

// ─── Banquets ────────────────────────────────────────────────────────
export const createBanquetSchema = z.object({
  roomIds: z.array(z.string().min(1)).min(1, "Wymagana co najmniej 1 sala"),
  eventType: z.string().min(1, "Wymagany typ imprezy"),
  guestCount: z.number().int().min(1),
  contactPerson: z.string().min(1, "Wymagana osoba kontaktowa"),
  contactPhone: z.string().min(1, "Wymagany telefon"),
  date: z.string().min(1, "Wymagana data"),
  timeFrom: z.string().min(1, "Wymagana godzina"),
}).passthrough();

export const banquetMenuSchema = z.object({
  name: z.string().min(1),
  banquetId: z.string().optional(),
}).passthrough();

// ─── Warehouse ───────────────────────────────────────────────────────
export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Wymagana nazwa magazynu"),
  type: z.enum(["MAIN", "BAR", "KITCHEN", "COLD_STORAGE"]),
}).passthrough();

export const stockMoveSchema = z.object({
  warehouseId: z.string().min(1),
  ingredientId: z.string().min(1),
  quantity: z.number(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "TRANSFER", "WASTE"]),
}).passthrough();

export const ingredientSchema = z.object({
  name: z.string().min(1, "Wymagana nazwa składnika"),
  unit: z.string().min(1, "Wymagana jednostka"),
  category: z.string().optional(),
  defaultSupplier: z.string().optional(),
}).passthrough();

export const recipeSchema = z.object({
  productId: z.string().min(1),
  items: z.array(z.object({
    ingredientId: z.string().min(1),
    quantity: z.number().positive(),
  })).min(1),
}).passthrough();

export const inventorySchema = z.object({
  warehouseId: z.string().min(1),
  items: z.array(z.object({
    stockItemId: z.string().min(1),
    countedQuantity: z.number().min(0),
  })).min(1),
}).passthrough();

// ─── Printers ────────────────────────────────────────────────────────
export const createPrinterSchema = z.object({
  name: z.string().min(1, "Wymagana nazwa drukarki"),
  type: z.enum(["KITCHEN", "BAR", "FISCAL", "RECEIPT"]),
  connectionType: z.enum(["USB", "NETWORK", "BLUETOOTH"]),
}).passthrough();

// ─── KDS ─────────────────────────────────────────────────────────────
export const kdsMessageSchema = z.object({
  orderId: z.string().optional(),
  tableId: z.string().optional(),
  message: z.string().min(1, "Treść wiadomości jest wymagana").max(500),
});

// ─── Config ──────────────────────────────────────────────────────────
export const configPatchSchema = z.union([
  z.array(z.object({
    key: z.string().min(1),
    value: z.unknown(),
  })),
  z.record(z.string(), z.unknown()),
]);

// ─── Customers ───────────────────────────────────────────────────────
export const createCustomerSchema = z.object({
  phone: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
}).passthrough();

// ─── E-receipt SMS ───────────────────────────────────────────────────
export const sendSmsSchema = z.object({
  receiptId: z.string().min(1, "Wymagany ID paragonu"),
  phone: z.string().min(1, "Wymagany numer telefonu"),
});

// ─── Suggestions ─────────────────────────────────────────────────────
export const createSuggestionSchema = z.object({
  productId: z.string().min(1, "Wymagany productId"),
  suggestedId: z.string().min(1, "Wymagany suggestedId"),
  type: z.string().min(1, "Wymagany typ sugestii"),
  priority: z.number().optional(),
});

// ─── Time tracking ───────────────────────────────────────────────────
export const timeTrackingSchema = z.object({
  userId: z.string().min(1, "Wymagany userId"),
  action: z.enum(["clock-in", "clock-out"], { message: "Użyj clock-in lub clock-out" }),
});

// ─── Print kitchen ───────────────────────────────────────────────────
export const printKitchenSchema = z.object({
  orderId: z.string().min(1),
}).passthrough();

// ─── Products ────────────────────────────────────────────────────────
export const createProductSchema = z.object({
  name: z.string().min(1, "Wymagana nazwa produktu").max(100),
  nameShort: z.string().max(40).optional(),
  categoryId: z.string().min(1),
  taxRateId: z.string().min(1),
  priceGross: z.number().min(0),
  color: z.string().optional(),
  sortOrder: z.number().int().optional(),
}).passthrough();

export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameShort: z.string().max(40).optional().nullable(),
  categoryId: z.string().min(1).optional(),
  taxRateId: z.string().min(1).optional(),
  priceGross: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  color: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
}).passthrough();

// ─── Users ──────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().min(1, "Wymagane imię i nazwisko").max(100),
  pin: z.string().min(4, "PIN musi mieć min. 4 cyfry").max(8).regex(/^\d+$/, "PIN musi składać się z cyfr"),
  roleId: z.string().min(1, "Wymagana rola"),
  isOwner: z.boolean().optional().default(false),
  authMethod: z.enum(["PIN", "NFC", "BARCODE", "CARD"]).optional().default("PIN"),
  expiresAt: z.string().optional().nullable(),
}).passthrough();

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pin: z.string().min(4).max(8).regex(/^\d+$/, "PIN musi składać się z cyfr").optional(),
  roleId: z.string().min(1).optional(),
  isOwner: z.boolean().optional(),
  isActive: z.boolean().optional(),
  authMethod: z.enum(["PIN", "NFC", "BARCODE", "CARD"]).optional(),
  tokenId: z.string().optional().nullable(),
  tokenType: z.enum(["NFC", "BARCODE", "CARD"]).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
}).passthrough();

// ─── Fiscal ──────────────────────────────────────────────────────────
export const fiscalPeriodReportSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
}).optional().default({});

// ─── Reservations online ─────────────────────────────────────────────
export const onlineReservationSchema = z.object({
  roomId: z.string().min(1),
  guestName: z.string().min(1),
  guestPhone: z.string().min(1),
  guestEmail: z.string().email().optional().or(z.literal("")),
  guestCount: z.number().int().min(1),
  dateTime: z.string().min(1),
  notes: z.string().max(500).optional(),
}).passthrough();
