import ExcelJS from "exceljs";

export type SheetColumn = { header: string; key: string; width?: number };

/**
 * Tworzy arkusz z nagłówkami i wierszami, zwraca buffer .xlsx
 */
export async function createWorkbook(
  sheets: { name: string; columns: SheetColumn[]; rows: Record<string, unknown>[] }[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "POS Karczma Łabędź";
  workbook.created = new Date();

  for (const { name, columns, rows } of sheets) {
    const sheet = workbook.addWorksheet(name, {
      headerFooter: { firstHeader: name },
      properties: { defaultRowHeight: 20 },
    });
    sheet.columns = columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 14,
    }));
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    sheet.addRows(rows);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Zwraca nazwę pliku dla eksportu (bez rozszerzenia)
 */
export function exportFilename(prefix: string, dateFrom: string, dateTo?: string): string {
  const from = dateFrom.slice(0, 10);
  const to = dateTo ? dateTo.slice(0, 10) : from;
  return `${prefix}_${from}_${to}`;
}
