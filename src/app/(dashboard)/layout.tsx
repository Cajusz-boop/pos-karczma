import { DashboardShell } from "@/components/layout/DashboardShell";
import { TrainingModeBanner } from "@/components/TrainingModeBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      {children}
      <TrainingModeBanner />
    </DashboardShell>
  );
}
