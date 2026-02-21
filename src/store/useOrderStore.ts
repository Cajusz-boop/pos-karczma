import { create } from "zustand";

export interface OrderItemLine {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRateId: string;
  modifiersJson?: Array<{ modifierId: string; name: string; priceDelta: number }>;
  note?: string;
  courseNumber: number;
  status: "ORDERED" | "SENT" | "CANCELLED";
}

interface OrderState {
  orderId: string | null;
  orderNumber: number | null;
  tableNumber: number | null;
  items: OrderItemLine[];
  setOrder: (orderId: string, orderNumber: number, tableNumber: number | null, items: OrderItemLine[]) => void;
  addItem: (item: Omit<OrderItemLine, "status"> & { status?: OrderItemLine["status"] }) => void;
  updateQuantity: (index: number, delta: number) => void;
  updateNote: (index: number, note: string) => void;
  removeItem: (index: number) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orderId: null,
  orderNumber: null,
  tableNumber: null,
  items: [],

  setOrder: (orderId, orderNumber, tableNumber, items) =>
    set({ orderId, orderNumber, tableNumber, items }),

  addItem: (item) =>
    set((s) => ({
      items: [
        ...s.items,
        {
          ...item,
          status: (item.status ?? "ORDERED") as OrderItemLine["status"],
        },
      ],
    })),

  updateQuantity: (index, delta) =>
    set((s) => {
      const items = [...s.items];
      const line = items[index];
      if (!line || line.status === "SENT") return s;
      const q = Math.max(0, line.quantity + delta);
      if (q === 0) {
        items.splice(index, 1);
        return { items };
      }
      items[index] = { ...line, quantity: q };
      return { items };
    }),

  updateNote: (index, note) =>
    set((s) => {
      const items = [...s.items];
      if (items[index]?.status === "SENT") return s;
      items[index] = { ...items[index]!, note };
      return { items };
    }),

  removeItem: (index) =>
    set((s) => {
      const items = [...s.items];
      if (items[index]?.status === "SENT") return s;
      items.splice(index, 1);
      return { items };
    }),

  clearOrder: () =>
    set({ orderId: null, orderNumber: null, tableNumber: null, items: [] }),
}));
