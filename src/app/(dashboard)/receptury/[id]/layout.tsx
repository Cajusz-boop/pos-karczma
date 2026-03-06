// Dla builda Capacitor (output: export). Jedna placeholder ścieżka dla [id] i wszystkich podstron.
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function RecepturyIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
