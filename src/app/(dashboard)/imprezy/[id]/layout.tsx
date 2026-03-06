// Dla builda Capacitor (output: export). Jedna placeholder ścieżka.
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function ImprezyIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
