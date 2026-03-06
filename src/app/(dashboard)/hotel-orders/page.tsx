export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

import { HotelOrdersClient } from "./HotelOrdersClient";

export default function HotelOrdersPage() {
  return <HotelOrdersClient />;
}
