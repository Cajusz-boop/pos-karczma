import { prisma } from "@/lib/prisma";
import { buildKitchenTicket } from "./escpos";
import net from "net";

export interface PrintRequest {
  printerId: string;
  orderId?: string;
  orderNumber?: number;
  printType: "KITCHEN_ORDER" | "KITCHEN_STORNO" | "KITCHEN_CHANGE" | "RECEIPT" | "INVOICE" | "REPORT" | "TEST";
  content: Buffer | string;
  userId?: string;
}

export interface PrintResult {
  success: boolean;
  logId: string;
  error?: string;
}

/**
 * Send print job to printer
 */
export async function sendToPrinter(request: PrintRequest): Promise<PrintResult> {
  const { printerId, orderId, orderNumber, printType, content, userId } = request;

  const log = await prisma.printLog.create({
    data: {
      printerId,
      printType,
      orderId,
      orderNumber,
      contentJson: typeof content === "string" ? { text: content } : { bytes: content.length },
      status: "PENDING",
      userId,
    },
  });

  try {
    const printer = await prisma.printer.findUnique({
      where: { id: printerId },
    });

    if (!printer) {
      throw new Error("Drukarka nie istnieje");
    }

    if (!printer.isActive) {
      throw new Error("Drukarka jest nieaktywna");
    }

    const data = typeof content === "string" ? Buffer.from(content) : content;

    if (printer.connectionType === "TCP" && printer.address && printer.port) {
      await sendTCP(printer.address, printer.port, data);
    } else if (printer.remoteServer) {
      await sendToRemoteServer(printer.remoteServer, printerId, data);
    } else {
      console.log(`[PrintService] Would send ${data.length} bytes to ${printer.name}`);
    }

    await prisma.printLog.update({
      where: { id: log.id },
      data: {
        status: "PRINTED",
        printedAt: new Date(),
      },
    });

    return { success: true, logId: log.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

    await prisma.printLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        errorMessage,
      },
    });

    return { success: false, logId: log.id, error: errorMessage };
  }
}

async function sendTCP(host: string, port: number, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("Timeout połączenia z drukarką"));
    }, 5000);

    client.connect(port, host, () => {
      client.write(data, (err) => {
        clearTimeout(timeout);
        client.end();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function sendToRemoteServer(serverUrl: string, printerId: string, data: Buffer): Promise<void> {
  const response = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Printer-Id": printerId,
    },
    body: new Uint8Array(data),
  });

  if (!response.ok) {
    throw new Error(`Błąd serwera wydruku: ${response.status}`);
  }
}

/**
 * Print kitchen ticket for an order
 */
export async function printKitchenTicket(
  orderId: string,
  options?: {
    courseNumber?: number;
    itemIds?: string[];
    isStorno?: boolean;
  }
): Promise<PrintResult[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: options?.itemIds
          ? { id: { in: options.itemIds } }
          : options?.courseNumber
          ? { courseNumber: options.courseNumber, status: { not: "CANCELLED" } }
          : { status: { not: "CANCELLED" } },
        include: {
          product: {
            include: {
              category: { select: { id: true } },
            },
          },
        },
      },
      table: { select: { number: true } },
      user: { select: { name: true } },
    },
  });

  if (!order) {
    throw new Error("Zamówienie nie istnieje");
  }

  const printerCategories = await prisma.printerCategory.findMany({
    where: {
      printer: { type: "KITCHEN", isActive: true },
    },
    include: {
      printer: true,
    },
  });

  const printerItems = new Map<string, typeof order.items>();

  for (const item of order.items) {
    const categoryId = item.product.categoryId;
    const assignment = printerCategories.find((pc) => pc.categoryId === categoryId);

    if (assignment) {
      const existing = printerItems.get(assignment.printerId) ?? [];
      existing.push(item);
      printerItems.set(assignment.printerId, existing);
    }
  }

  const results: PrintResult[] = [];

  for (const [printerId, items] of printerItems) {
    const printer = printerCategories.find((pc) => pc.printerId === printerId)?.printer;
    if (!printer) continue;

    const ticket = buildKitchenTicket({
      orderNumber: order.orderNumber,
      tableNumber: order.table?.number,
      waiterName: order.user.name,
      items: items.map((item) => ({
        name: item.product.name,
        quantity: Number(item.quantity),
        note: item.note ?? undefined,
        isFire: item.isFire,
        isSubtracted: Number(item.unitPrice) < 0,
        courseNumber: item.courseNumber,
      })),
      charsPerLine: printer.charsPerLine,
    });

    const result = await sendToPrinter({
      printerId,
      orderId,
      orderNumber: order.orderNumber,
      printType: options?.isStorno ? "KITCHEN_STORNO" : "KITCHEN_ORDER",
      content: ticket,
    });

    results.push(result);
  }

  return results;
}
