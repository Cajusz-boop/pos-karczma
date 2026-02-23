import UserPermissionsClient from "./UserPermissionsClient";

export async function generateStaticParams() {
  return [{ id: "_" }];
}

export default function UserPermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <UserPermissionsClient params={params} />;
}
