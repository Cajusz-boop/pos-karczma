import PrinterTemplatesClient from "./PrinterTemplatesClient";

export const dynamic = "force-dynamic";

export default function PrinterTemplatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PrinterTemplatesClient params={params} />;
}
