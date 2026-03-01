import Dexie, { type Table } from "dexie";

// ============================================================
// SYNC METADATA — dla rekordów read-write
// ============================================================

export interface SyncableRecord {
  _localId: string;
  _serverId?: string;
  _syncStatus: "synced" | "pending" | "conflict" | "error";
  _localVersion: number;
  _serverVersion?: number;
  _updatedAt: string; // ISO string (Dexie serializes better than Date)
  _syncedAt?: string;
  _syncError?: string;
  // P4-FIX: Payment lock moved to separate table `paymentLocks`
  // Te pola NIGDY nie syncują się na serwer — są czysto lokalne
}

// Cached auth — kelner loguje się online RAZ, sesja w Dexie, offline PIN przez 7 dni
export interface CachedSession {
  userId: string;
  userName: string;
  userRole: string;
  isOwner: boolean;
  pinHash: string;
  cachedAt: string;
  expiresAt: string;
}

// P4-FIX: Osobna tabela na locki — nie zanieczyszcza SyncableRecord
export interface PaymentLock {
  orderLocalId: string; // PK
  userId: string;
  lockedAt: string;
  // P10-FIX: Lock timeout 30s zamiast 2min (wystarczające na flow płatności)
}

// ============================================================
// READ-ONLY TABLES — sync z serwera
// ============================================================

export interface LocalProduct {
  id: string;
  name: string;
  nameShort?: string;
  categoryId: string;
  priceGross: number;
  taxRateId: string;
  isActive: boolean;
  isAvailable: boolean;
  sortOrder: number;
  color?: string;
  imageUrl?: string;
  isWeightBased: boolean;
  unit?: string;
  productType: "REGULAR" | "SET" | "HELPER_SET" | "ADDON" | "ADDON_GLOBAL";
  isSet: boolean;
  estimatedPrepMinutes?: number;
  noPrintKitchen: boolean;
  modifierGroupIds: string[];
  allergenIds: string[];
  _serverUpdatedAt: string;
}

export interface LocalCategory {
  id: string;
  name: string;
  parentId?: string;
  sortOrder: number;
  color?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  isSeasonal: boolean;
  seasonStart?: string;
  seasonEnd?: string;
  _serverUpdatedAt: string;
}

export interface LocalRoom {
  id: string;
  name: string;
  type: "RESTAURANT" | "BANQUET" | "OUTDOOR" | "PRIVATE";
  capacity: number;
  /** W bazie 0/1 (number), TypeScript akceptuje też boolean */
  isActive: boolean | number;
  isSeasonal: boolean;
  sortOrder: number;
  _serverUpdatedAt: string;
}

export interface LocalTable {
  id: string;
  roomId: string;
  number: number;
  seats: number;
  shape: "RECTANGLE" | "ROUND" | "LONG";
  status: "FREE" | "OCCUPIED" | "BILL_REQUESTED" | "RESERVED" | "BANQUET_MODE" | "INACTIVE";
  isAvailable: boolean;
  description?: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  _serverUpdatedAt: string;
}

export interface LocalModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  modifiers: Array<{
    id: string;
    name: string;
    priceDelta: number;
    sortOrder: number;
  }>;
  _serverUpdatedAt: string;
}

export interface LocalTaxRate {
  id: string;
  name: string;
  ratePercent: number;
  fiscalSymbol: string;
  isDefault: boolean;
  _serverUpdatedAt: string;
}

export interface LocalAllergen {
  id: string;
  code: string;
  name: string;
  icon?: string;
  _serverUpdatedAt: string;
}

// ============================================================
// READ-WRITE TABLES — pełna obsługa offline
// ============================================================

export interface LocalOrder extends SyncableRecord {
  orderNumber?: number;
  tableId?: string;
  roomId?: string;
  userId: string;
  userName?: string;
  status: "OPEN" | "SENT_TO_KITCHEN" | "IN_PROGRESS" | "READY" | "SERVED" | "BILL_REQUESTED" | "CLOSED" | "CANCELLED";
  type: "DINE_IN" | "TAKEAWAY" | "BANQUET" | "PHONE" | "DELIVERY" | "HOTEL_ROOM";
  guestCount: number;
  note?: string;
  discountJson?: {
    type: "PERCENT" | "AMOUNT";
    value: number;
    reason?: string;
    authorizedBy?: string;
  };
  createdAt: string;
  closedAt?: string;
  totalGross: number;
  itemCount: number;
  tableNumber?: number;
  roomName?: string;
}

export interface LocalOrderItem extends SyncableRecord {
  orderId: string; // _localId of parent order
  orderServerId?: string;
  productId: string;
  productName: string;
  productNameShort?: string;
  quantity: number;
  unitPrice: number;
  taxRateId: string;
  taxRatePercent: number;
  fiscalSymbol: string;
  discountAmount: number;
  modifiersJson?: Array<{
    modifierId: string;
    name: string;
    priceDelta: number;
  }>;
  note?: string;
  courseNumber: number;
  status: "ORDERED" | "SENT" | "IN_PROGRESS" | "READY" | "SERVED" | "CANCELLED";
  sentToKitchenAt?: string;
  readyAt?: string;
  servedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  isTakeaway: boolean;
  isFire: boolean;
  isRush: boolean;
}

export interface LocalPayment extends SyncableRecord {
  orderId: string;
  orderServerId?: string;
  method: "CASH" | "CARD" | "BLIK" | "TRANSFER" | "VOUCHER" | "ROOM_CHARGE";
  amount: number;
  tipAmount: number;
  transactionRef?: string;
  createdAt: string;
  // SPLIT/LEDGER: kierunek i status płatności
  direction: "IN" | "OUT"; // IN = normalna płatność, OUT = zwrot/refund
  status: "PENDING" | "CONFIRMED" | "CANCELLED"; // PENDING → CONFIRMED (po sync) lub CANCELLED (void)
  // Terminal SoftPOS
  terminalStatus: "none" | "pending" | "approved" | "declined" | "timeout";
  terminalProvider: "stripe_tap" | "polcard" | "manual_cash" | "demo";
  terminalTransactionId?: string;
  cardLastFour?: string;
  cardBrand?: string;
  // E-paragon
  receiptStatus: "pending" | "fiscalizing" | "generated" | "error";
  receiptUrl?: string;
  receiptQrData?: string;
  customerNip?: string;
  customerEmail?: string;
  // Fiskalizacja
  fiscalStatus: "pending" | "sent_to_printer" | "fiscalized" | "error";
  fiscalNumber?: string;
  fiscalPrintedAt?: string;
  // Refund tracking
  refundsPaymentLocalId?: string; // jeśli direction=OUT, wskazuje na oryginalną płatność
}

// ============================================================
// SYNC INFRASTRUCTURE
// ============================================================

export interface SyncQueueItem {
  id?: number;
  operationId: string; // UUID — idempotency key (serwer odrzuca duplikaty)
  operation: "CREATE" | "UPDATE" | "DELETE";
  table: "orders" | "orderItems" | "payments";
  localId: string;
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
  lastAttemptAt?: string;
  lastError?: string;
  priority: number; // 3=orders, 2=items, 1=payments
  dependsOn?: string[];
}

export interface SyncCheckpoint {
  id: string; // 'products', 'categories', etc.
  lastSyncAt: string;
  lastServerTimestamp?: string;
  recordCount?: number;
}

// ============================================================
// DATABASE CLASS
// ============================================================

export class PosOfflineDB extends Dexie {
  products!: Table<LocalProduct, string>;
  categories!: Table<LocalCategory, string>;
  rooms!: Table<LocalRoom, string>;
  posTables!: Table<LocalTable, string>; // "tables" conflicts with Dexie base class
  modifierGroups!: Table<LocalModifierGroup, string>;
  taxRates!: Table<LocalTaxRate, string>;
  allergens!: Table<LocalAllergen, string>;

  orders!: Table<LocalOrder, string>;
  orderItems!: Table<LocalOrderItem, string>;
  payments!: Table<LocalPayment, string>;

  syncQueue!: Table<SyncQueueItem, number>;
  syncCheckpoints!: Table<SyncCheckpoint, string>;
  paymentLocks!: Table<PaymentLock, string>; // P4-FIX
  cachedSessions!: Table<CachedSession, string>;

  constructor() {
    super("PosKarczma");

    // ── SCHEMA VERSIONING STRATEGY (P3-FIX) ──────────────
    // Przy dodawaniu pól: bump version, dodaj upgrade() z transformacją
    // Przy dodawaniu tabeli: bump version, dodaj stores z nową tabelą
    // Przy usuwaniu tabeli: bump version, ustaw null w stores
    // NIGDY nie zmieniaj indeksów istniejącej tabeli bez migracji!
    // Przykład migracji:
    //   this.version(2).stores({...}).upgrade(tx => {
    //     return tx.table("orders").toCollection().modify(order => {
    //       order.newField = defaultValue;
    //     });
    //   });

    this.version(1).stores({
      products: "id, categoryId, isActive, isAvailable, sortOrder, [categoryId+isActive+sortOrder], [isActive+isAvailable]",
      categories: "id, parentId, isActive, sortOrder, [parentId+sortOrder], [isActive+sortOrder]",
      rooms: "id, isActive, sortOrder",
      posTables: "id, roomId, status, number, [roomId+status], [roomId+number]",
      modifierGroups: "id",
      taxRates: "id, isDefault",
      allergens: "id, code",

      orders: "_localId, _serverId, _syncStatus, tableId, status, userId, createdAt, [status+createdAt], [tableId+status], [_syncStatus+_updatedAt]",
      orderItems: "_localId, _serverId, _syncStatus, orderId, orderServerId, productId, status, [orderId+status], [orderId+courseNumber]",
      payments: "_localId, _serverId, _syncStatus, orderId, orderServerId, createdAt",

      syncQueue: "++id, operationId, table, localId, priority, timestamp, [priority+timestamp]",
      syncCheckpoints: "id",
      paymentLocks: "orderLocalId", // P4-FIX
    });

    this.version(2).stores({
      products: "id, categoryId, isActive, isAvailable, sortOrder, [categoryId+isActive+sortOrder], [isActive+isAvailable]",
      categories: "id, parentId, isActive, sortOrder, [parentId+sortOrder], [isActive+sortOrder]",
      rooms: "id, isActive, sortOrder",
      posTables: "id, roomId, status, number, [roomId+status], [roomId+number]",
      modifierGroups: "id",
      taxRates: "id, isDefault",
      allergens: "id, code",

      orders: "_localId, _serverId, _syncStatus, tableId, status, userId, createdAt, [status+createdAt], [tableId+status], [_syncStatus+_updatedAt]",
      orderItems: "_localId, _serverId, _syncStatus, orderId, orderServerId, productId, status, [orderId+status], [orderId+courseNumber]",
      payments: "_localId, _serverId, _syncStatus, orderId, orderServerId, createdAt",

      syncQueue: "++id, operationId, table, localId, priority, timestamp, [priority+timestamp]",
      syncCheckpoints: "id",
      paymentLocks: "orderLocalId",
      cachedSessions: "userId, userName",
    });

    // FIX: Baza mogła zostać utworzona z uszkodzonym schematem (np. v20 z 0 tabel).
    // Wersja 21 wymusi migrację i utworzenie wszystkich object stores.
    this.version(21).stores({
      products: "id, categoryId, isActive, isAvailable, sortOrder, [categoryId+isActive+sortOrder], [isActive+isAvailable]",
      categories: "id, parentId, isActive, sortOrder, [parentId+sortOrder], [isActive+sortOrder]",
      rooms: "id, isActive, sortOrder",
      posTables: "id, roomId, status, number, [roomId+status], [roomId+number]",
      modifierGroups: "id",
      taxRates: "id, isDefault",
      allergens: "id, code",

      orders: "_localId, _serverId, _syncStatus, tableId, status, userId, createdAt, [status+createdAt], [tableId+status], [_syncStatus+_updatedAt]",
      orderItems: "_localId, _serverId, _syncStatus, orderId, orderServerId, productId, status, [orderId+status], [orderId+courseNumber]",
      payments: "_localId, _serverId, _syncStatus, orderId, orderServerId, createdAt",

      syncQueue: "++id, operationId, table, localId, priority, timestamp, [priority+timestamp]",
      syncCheckpoints: "id",
      paymentLocks: "orderLocalId",
      cachedSessions: "userId, userName",
    });
  }

  static generateLocalId(): string {
    // P1-FIX: Pełny UUID — brak ryzyka kolizji przy szybkim tapowaniu
    return `local_${crypto.randomUUID()}`;
  }

  static isLocalId(id: string): boolean {
    return id.startsWith("local_");
  }

  // Czyszczenie starych zamówień — wywoływać co 24h
  // P20-FIX: timestamp purge zapisany w syncCheckpoints (Dexie), nie localStorage
  async purgeOldOrders(olderThanDays = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffStr = cutoff.toISOString();

    return await this.transaction("rw", [this.orders, this.orderItems, this.payments, this.syncQueue, this.syncCheckpoints], async () => {
      const oldOrders = await this.orders
        .where("status").equals("CLOSED")
        .filter(o => o._syncStatus === "synced" && !!o.closedAt && o.closedAt < cutoffStr)
        .toArray();

      let deleted = 0;
      for (const order of oldOrders) {
        await this.orderItems.where("orderId").equals(order._localId).delete();
        await this.payments.where("orderId").equals(order._localId).delete();
        await this.orders.delete(order._localId);
        deleted++;
      }

      // P20-FIX: Zapisz timestamp purge w Dexie, nie localStorage
      await this.syncCheckpoints.put({
        id: "_lastPurge",
        lastSyncAt: new Date().toISOString(),
      });

      return deleted;
    });
  }

  // P4/P10-FIX: Payment lock w osobnej tabeli, timeout 30s
  static LOCK_TIMEOUT_MS = 30_000; // 30s — wystarczające na flow płatności

  async acquirePaymentLock(orderLocalId: string, userId: string): Promise<boolean> {
    const existing = await this.paymentLocks.get(orderLocalId);

    if (existing && existing.userId !== userId) {
      const lockAge = Date.now() - new Date(existing.lockedAt).getTime();
      if (lockAge < PosOfflineDB.LOCK_TIMEOUT_MS) return false;
      // Lock expired — overwrite
    }

    await this.paymentLocks.put({
      orderLocalId,
      userId,
      lockedAt: new Date().toISOString(),
    });
    return true;
  }

  async releasePaymentLock(orderLocalId: string, userId: string): Promise<void> {
    const lock = await this.paymentLocks.get(orderLocalId);
    if (lock && lock.userId === userId) {
      await this.paymentLocks.delete(orderLocalId);
    }
  }

  // P19-FIX: Force refresh — wyczyść całą bazę i pobierz od nowa
  async forceRefresh(): Promise<void> {
    await this.transaction("rw",
      [this.products, this.categories, this.rooms, this.posTables,
       this.modifierGroups, this.taxRates, this.allergens, this.syncCheckpoints],
      async () => {
        await this.products.clear();
        await this.categories.clear();
        await this.rooms.clear();
        await this.posTables.clear();
        await this.modifierGroups.clear();
        await this.taxRates.clear();
        await this.allergens.clear();
        await this.syncCheckpoints.clear();
      }
    );
    // Trigger fresh initial sync
    const { initialSync } = await import("./initial-sync");
    await initialSync();
  }

  // P21-FIX: Clear all local orders and re-sync from server
  async clearAllLocalOrders(): Promise<number> {
    return await this.transaction("rw", 
      [this.orders, this.orderItems, this.payments, this.syncQueue, this.paymentLocks],
      async () => {
        const count = await this.orders.count();
        await this.orders.clear();
        await this.orderItems.clear();
        await this.payments.clear();
        await this.paymentLocks.clear();
        // Clear sync queue for orders/items/payments
        await this.syncQueue.where("table").anyOf(["orders", "orderItems", "payments"]).delete();
        return count;
      }
    );
  }
}

// Lazy init — Dexie/IndexedDB only in browser; avoids "reading 'call'" during SSR
let _dbInstance: PosOfflineDB | null = null;
function getDb(): PosOfflineDB {
  if (typeof window === "undefined") throw new Error("offline-db is browser-only");
  if (!_dbInstance) _dbInstance = new PosOfflineDB();
  return _dbInstance;
}
export const db =
  typeof window !== "undefined"
    ? (new Proxy({} as PosOfflineDB, {
        get(_, prop: keyof PosOfflineDB) {
          return (getDb() as unknown as Record<string, unknown>)[prop as string];
        },
      }) as PosOfflineDB)
    : ({} as PosOfflineDB);

// ============================================================
// TYPE HELPERS
// ============================================================

export type OrderStatus = LocalOrder["status"];
export type OrderType = LocalOrder["type"];
export type PaymentMethod = LocalPayment["method"];
export type TableStatus = LocalTable["status"];
