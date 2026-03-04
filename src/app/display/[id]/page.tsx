import DisplayPageClient from "./DisplayPageClient";

export const dynamic = "force-dynamic";

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DisplayPageClient displayId={id} />;
}
