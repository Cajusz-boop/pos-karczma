import UserPermissionsClient from "./UserPermissionsClient";

// Dla builda Capacitor (output: export) — jedna placeholder strona.
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function UserPermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <UserPermissionsClient params={params} />;
}
