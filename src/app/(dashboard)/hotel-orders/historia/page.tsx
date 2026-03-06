export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

import { HotelOrdersHistoryClient } from "./HotelOrdersHistoryClient";

export default function HotelOrdersHistoryPage() {
  return <HotelOrdersHistoryClient />;
}
