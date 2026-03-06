import { ReceiptPage } from "@/components/receipt/ReceiptPage";

type Props = {
  params: Promise<{ qrId: string }>;
};

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export function generateStaticParams() {
  return [{ qrId: "0" }];
}

export default async function ReceiptByQrPage({ params }: Props) {
  const { qrId } = await params;
  return <ReceiptPage qrId={qrId} />;
}
