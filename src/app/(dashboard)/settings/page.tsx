import SettingsPageClient from "./SettingsPageClient";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export default function SettingsPage() {
  return <SettingsPageClient />;
}
