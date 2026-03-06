import ImprezaDetailClient from "./ImprezaDetailClient";

// Wymagane dla output: export (build Capacitor). Jedna placeholder strona.
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function ImprezaDetailPage() {
  return <ImprezaDetailClient />;
}
