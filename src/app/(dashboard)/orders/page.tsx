export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

import OrdersPageClient from "./OrdersPageClient";

export default function OrdersPage() {
  return <OrdersPageClient />;
}
