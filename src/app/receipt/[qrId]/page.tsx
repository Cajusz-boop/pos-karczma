import { ReceiptPage } from "@/components/receipt/ReceiptPage";

type Props = {
  params: Promise<{ qrId: string }>;
};

export const dynamic = "force-dynamic";

export default async function ReceiptByQrPage({ params }: Props) {
  const { qrId } = await params;
  return <ReceiptPage qrId={qrId} />;
}
