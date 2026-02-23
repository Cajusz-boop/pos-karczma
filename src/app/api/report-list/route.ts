import { NextResponse } from "next/server";

/** GET /api/report-list — lista typów raportów (alias dla /api/reports, unika konfliktu ścieżek przy export) */
export async function GET() {
  return NextResponse.json({
    reports: [
      { type: "daily", path: "/api/reports/daily", description: "Raport dobowy" },
      { type: "shift", path: "/api/reports/shift", description: "Raport zmianowy" },
      { type: "products", path: "/api/reports/products", description: "Raport produktowy" },
      { type: "warehouse", path: "/api/reports/warehouse", description: "Raport magazynowy" },
      { type: "vat", path: "/api/reports/vat", description: "Raport VAT" },
      { type: "banquets", path: "/api/reports/banquets", description: "Raport bankietowy" },
      { type: "audit", path: "/api/reports/audit", description: "Log audytowy" },
    ],
    exportPath: "/api/reports/export",
  });
}
