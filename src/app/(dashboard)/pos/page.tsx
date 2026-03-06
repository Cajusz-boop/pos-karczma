export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

import { PosPageClient } from "./PosPageClient";

export default function PosPage() {
  return <PosPageClient />;
}
