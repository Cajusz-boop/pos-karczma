import { redirect } from "next/navigation";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export default function Home() {
  redirect("/login");
}
