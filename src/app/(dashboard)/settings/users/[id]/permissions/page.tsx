import UserPermissionsClient from "./UserPermissionsClient";

export const dynamic = "force-dynamic";

export default function UserPermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <UserPermissionsClient params={params} />;
}
