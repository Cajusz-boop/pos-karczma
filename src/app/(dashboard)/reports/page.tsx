import ReportsPageClient from "./ReportsPageClient";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export default function ReportsPage() {
  return <ReportsPageClient />;
}
