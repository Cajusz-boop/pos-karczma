import DisplayPageClient from "./DisplayPageClient";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export function generateStaticParams() {
  return [{ id: "0" }];
}

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DisplayPageClient displayId={id} />;
}
