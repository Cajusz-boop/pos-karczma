import ReservationsPageClient from "./ReservationsPageClient";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export default function ReservationsPage() {
  return <ReservationsPageClient />;
}
