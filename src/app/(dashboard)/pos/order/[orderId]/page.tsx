import { OrderPageClient } from "./OrderPageClient";

// Dla builda Capacitor (output: export) — jedna placeholder strona.
export function generateStaticParams() {
  return [{ orderId: "0" }];
}

export default async function PosOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderPageClient orderId={orderId} />;
}
