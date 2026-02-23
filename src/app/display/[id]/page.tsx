import DisplayPageClient from "./DisplayPageClient";

export async function generateStaticParams() {
  return [{ id: "_" }];
}

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DisplayPageClient displayId={id} />;
}
