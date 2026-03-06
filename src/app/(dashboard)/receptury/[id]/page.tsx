import RecepturaPageClient from "./RecepturaPageClient";

export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function RecepturaPage() {
  return <RecepturaPageClient />;
}
