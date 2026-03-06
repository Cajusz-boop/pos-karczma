import PrinterTemplatesClient from "./PrinterTemplatesClient";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function PrinterTemplatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PrinterTemplatesClient params={params} />;
}
