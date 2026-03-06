import HistoriaPageClient from "./HistoriaPageClient";

export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function HistoriaPage() {
  return <HistoriaPageClient />;
}
