import { ReceiptConfirmClient } from "./ReceiptConfirmClient";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export function generateStaticParams() {
  return [{ token: "0" }];
}

export default function ReceiptConfirmPage() {
  return <ReceiptConfirmClient />;
}
