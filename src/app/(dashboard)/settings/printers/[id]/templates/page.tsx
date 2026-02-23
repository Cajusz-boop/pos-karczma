import PrinterTemplatesClient from "./PrinterTemplatesClient";

export async function generateStaticParams() {
  return [{ id: "_" }];
}

export default function PrinterTemplatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PrinterTemplatesClient params={params} />;
}
