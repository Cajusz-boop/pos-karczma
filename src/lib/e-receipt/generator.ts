export type ReceiptData = {
  orderNumber: number;
  date: string; // ISO date
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    vatSymbol: string;
  }>;
  subtotal: number;
  discountAmount: number;
  total: number;
  vatBreakdown: Record<
    string,
    { net: number; vat: number; gross: number }
  >;
  paymentMethod: string;
  companyName: string;
  companyNip: string;
  companyAddress: string;
  buyerNip?: string;
};

function formatMoney(value: number): string {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: "Gotówka",
    CARD: "Karta",
    BLIK: "Blik",
    TRANSFER: "Przelew",
    VOUCHER: "Voucher",
  };
  return labels[method] ?? method;
}

export function generateReceiptHtml(data: ReceiptData): string {
  const dateFormatted = formatDate(data.date);
  const paymentLabel = paymentMethodLabel(data.paymentMethod);

  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(item.unitPrice)} zł</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(item.quantity * item.unitPrice)} zł</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;">${escapeHtml(item.vatSymbol)}</td>
    </tr>`
    )
    .join("");

  const vatRows = Object.entries(data.vatBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([sym, vals]) => `
    <tr>
      <td style="padding:4px 8px;font-size:12px;">VAT ${escapeHtml(sym)}</td>
      <td style="padding:4px 8px;text-align:right;font-size:12px;">${formatMoney(vals.net)} zł</td>
      <td style="padding:4px 8px;text-align:right;font-size:12px;">${formatMoney(vals.vat)} zł</td>
      <td style="padding:4px 8px;text-align:right;font-size:12px;">${formatMoney(vals.gross)} zł</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>E-paragon #${data.orderNumber}</title>
</head>
<body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;">
  <div style="max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">
    <header style="padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;">${escapeHtml(data.companyName)}</h1>
      <p style="margin:0;font-size:12px;opacity:0.95;">NIP: ${escapeHtml(data.companyNip)}</p>
      <p style="margin:4px 0 0;font-size:11px;opacity:0.9;">${escapeHtml(data.companyAddress)}</p>
    </header>
    <div style="padding:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;">
        <span>Paragon nr ${data.orderNumber}</span>
        <span>${dateFormatted}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px;text-align:left;font-weight:600;">Produkt</th>
            <th style="padding:8px;text-align:center;font-weight:600;">Ilość</th>
            <th style="padding:8px;text-align:right;font-weight:600;">Cena/jedn.</th>
            <th style="padding:8px;text-align:right;font-weight:600;">Wartość</th>
            <th style="padding:8px;text-align:center;font-weight:600;">VAT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      ${data.discountAmount > 0 ? `
      <div style="margin-top:12px;padding:8px;background:#fef3c7;border-radius:6px;font-size:13px;">
        <span>Rabat:</span>
        <strong style="float:right;">−${formatMoney(data.discountAmount)} zł</strong>
      </div>
      ` : ""}
      <table style="width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;">
        <thead>
          <tr>
            <th style="padding:6px 8px;text-align:left;">Stawka</th>
            <th style="padding:6px 8px;text-align:right;">Netto</th>
            <th style="padding:6px 8px;text-align:right;">VAT</th>
            <th style="padding:6px 8px;text-align:right;">Brutto</th>
          </tr>
        </thead>
        <tbody>
          ${vatRows}
        </tbody>
      </table>
      <div style="margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;">
        <div style="font-size:12px;opacity:0.9;">RAZEM DO ZAPŁATY</div>
        <div style="font-size:28px;font-weight:700;margin-top:4px;">${formatMoney(data.total)} zł</div>
      </div>
      <div style="margin-top:12px;font-size:13px;color:#6b7280;">
        <strong>Płatność:</strong> ${escapeHtml(paymentLabel)}
      </div>
      ${data.buyerNip ? `
      <div style="margin-top:8px;font-size:13px;color:#6b7280;">
        <strong>NIP nabywcy:</strong> ${escapeHtml(data.buyerNip)}
      </div>
      ` : ""}
    </div>
    <footer style="padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;">
      E-paragon wygenerowany elektronicznie
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (c) => map[c] ?? c);
}

/**
 * Extracts body inner HTML from a full document string.
 * Use when embedding receipt HTML inside a page (to avoid nested html/body).
 */
export function extractReceiptBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1].trim() : html;
}
