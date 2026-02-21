/**
 * ESC/POS Printer Commands Library
 * 
 * Basic implementation for thermal kitchen printers.
 * Supports common ESC/POS commands for text formatting,
 * cutting, and drawer opening.
 */

export const ESC = 0x1b;
export const GS = 0x1d;
export const LF = 0x0a;
export const CR = 0x0d;

export const ESCPOS = {
  INIT: Buffer.from([ESC, 0x40]),

  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: Buffer.from([ESC, 0x61, 0x02]),

  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),

  UNDERLINE_ON: Buffer.from([ESC, 0x2d, 0x01]),
  UNDERLINE_OFF: Buffer.from([ESC, 0x2d, 0x00]),

  DOUBLE_HEIGHT_ON: Buffer.from([ESC, 0x21, 0x10]),
  DOUBLE_WIDTH_ON: Buffer.from([ESC, 0x21, 0x20]),
  DOUBLE_SIZE_ON: Buffer.from([ESC, 0x21, 0x30]),
  NORMAL_SIZE: Buffer.from([ESC, 0x21, 0x00]),

  INVERT_ON: Buffer.from([GS, 0x42, 0x01]),
  INVERT_OFF: Buffer.from([GS, 0x42, 0x00]),

  FEED_LINE: Buffer.from([LF]),
  FEED_LINES: (n: number) => Buffer.from([ESC, 0x64, n]),

  CUT_PARTIAL: Buffer.from([GS, 0x56, 0x01]),
  CUT_FULL: Buffer.from([GS, 0x56, 0x00]),

  OPEN_DRAWER: Buffer.from([ESC, 0x70, 0x00, 0x19, 0xfa]),

  BEEP: Buffer.from([ESC, 0x42, 0x03, 0x02]),

  CODE_PAGE_PC852: Buffer.from([ESC, 0x74, 0x12]),
  CODE_PAGE_WIN1250: Buffer.from([ESC, 0x74, 0x2d]),
  CODE_PAGE_UTF8: Buffer.from([ESC, 0x74, 0x00]),
};

export function textToBuffer(text: string, codePage: string = "CP852"): Buffer {
  const polishMap: Record<string, string> = {
    ą: "\xA5",
    ć: "\x8F",
    ę: "\xA9",
    ł: "\x88",
    ń: "\xE4",
    ó: "\xA2",
    ś: "\x97",
    ź: "\xA7",
    ż: "\xBE",
    Ą: "\xA4",
    Ć: "\x8F",
    Ę: "\xA8",
    Ł: "\x9D",
    Ń: "\xE3",
    Ó: "\xA3",
    Ś: "\x98",
    Ź: "\x8D",
    Ż: "\xBD",
  };

  if (codePage === "CP852") {
    let converted = text;
    for (const [pl, code] of Object.entries(polishMap)) {
      converted = converted.replace(new RegExp(pl, "g"), code);
    }
    return Buffer.from(converted, "latin1");
  }

  return Buffer.from(text, "utf8");
}

export function padText(text: string, width: number, align: "left" | "center" | "right" = "left"): string {
  if (text.length >= width) {
    return text.slice(0, width);
  }

  const padding = width - text.length;

  switch (align) {
    case "center":
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return " ".repeat(left) + text + " ".repeat(right);
    case "right":
      return " ".repeat(padding) + text;
    default:
      return text + " ".repeat(padding);
  }
}

export function formatLine(left: string, right: string, width: number): string {
  const gap = width - left.length - right.length;
  if (gap < 1) {
    return left.slice(0, width - right.length - 1) + " " + right;
  }
  return left + " ".repeat(gap) + right;
}

export interface PrintJob {
  commands: Buffer[];
  totalBytes: number;
}

export function createPrintJob(): PrintJob {
  return {
    commands: [ESCPOS.INIT],
    totalBytes: ESCPOS.INIT.length,
  };
}

export function addText(job: PrintJob, text: string, codePage?: string): void {
  const buf = textToBuffer(text + "\n", codePage);
  job.commands.push(buf);
  job.totalBytes += buf.length;
}

export function addCommand(job: PrintJob, cmd: Buffer): void {
  job.commands.push(cmd);
  job.totalBytes += cmd.length;
}

export function finalize(job: PrintJob, cut: boolean = true, openDrawer: boolean = false): Buffer {
  if (openDrawer) {
    addCommand(job, ESCPOS.OPEN_DRAWER);
  }

  addCommand(job, ESCPOS.FEED_LINES(3));

  if (cut) {
    addCommand(job, ESCPOS.CUT_PARTIAL);
  }

  return Buffer.concat(job.commands);
}

export function buildKitchenTicket(data: {
  orderNumber: number;
  tableNumber?: number;
  waiterName: string;
  items: Array<{
    name: string;
    quantity: number;
    note?: string;
    isFire?: boolean;
    isSubtracted?: boolean;
    courseNumber?: number;
  }>;
  charsPerLine?: number;
}): Buffer {
  const { orderNumber, tableNumber, waiterName, items, charsPerLine = 42 } = data;
  const job = createPrintJob();

  const now = new Date();
  const dateStr = now.toLocaleDateString("pl-PL");
  const timeStr = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

  addCommand(job, ESCPOS.ALIGN_CENTER);
  addCommand(job, ESCPOS.DOUBLE_SIZE_ON);
  addText(job, `ZAM #${orderNumber}`);
  addCommand(job, ESCPOS.NORMAL_SIZE);

  addText(job, "=".repeat(charsPerLine));

  addCommand(job, ESCPOS.ALIGN_LEFT);
  addText(job, formatLine(`${dateStr} ${timeStr}`, tableNumber ? `St.${tableNumber}` : "", charsPerLine));
  addText(job, `Kelner: ${waiterName}`);

  addText(job, "-".repeat(charsPerLine));

  let currentCourse = 0;
  for (const item of items) {
    if (item.courseNumber && item.courseNumber !== currentCourse) {
      currentCourse = item.courseNumber;
      addCommand(job, ESCPOS.BOLD_ON);
      addText(job, `--- DANIE ${currentCourse} ---`);
      addCommand(job, ESCPOS.BOLD_OFF);
    }

    if (item.isFire) {
      addCommand(job, ESCPOS.INVERT_ON);
      addCommand(job, ESCPOS.BOLD_ON);
    }

    const prefix = item.isSubtracted ? "BRAK " : "";
    const qty = item.quantity !== 1 ? `${item.quantity}x ` : "";
    addText(job, `${prefix}${qty}${item.name}`);

    if (item.isFire) {
      addCommand(job, ESCPOS.BOLD_OFF);
      addCommand(job, ESCPOS.INVERT_OFF);
    }

    if (item.note) {
      addText(job, `   > ${item.note}`);
    }
  }

  addText(job, "=".repeat(charsPerLine));

  return finalize(job, true, false);
}
