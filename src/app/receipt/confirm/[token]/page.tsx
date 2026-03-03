import { ReceiptConfirmClient } from "./ReceiptConfirmClient";

export function generateStaticParams() {
  return [{ token: "_" }];
}

export default function ReceiptConfirmPage() {
  return <ReceiptConfirmClient />;
}
