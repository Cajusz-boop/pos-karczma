import TimeTrackingClient from "./TimeTrackingClient";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";

export default function TimeTrackingPage() {
  return <TimeTrackingClient />;
}
