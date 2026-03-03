import { ReceiptPage } from "@/components/receipt/ReceiptPage";

type Props = {
  params: Promise<{ qrId: string }>;
};

export function generateStaticParams() {
  return [{ qrId: "_" }];
}

export default async function ReceiptByQrPage({ params }: Props) {
  const { qrId } = await params;
  return <ReceiptPage qrId={qrId} />;
}
