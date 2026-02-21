import { OrderPageClient } from "./OrderPageClient";

export default async function PosOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderPageClient orderId={orderId} />;
}
