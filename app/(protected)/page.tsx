import { DuendeDashboard } from "@/components/dashboard/duende-dashboard";
import { getDashboardSnapshot } from "@/lib/data/dashboard-snapshot";

export default async function Home() {
  const snapshot = await getDashboardSnapshot();
  return <DuendeDashboard initialSnapshot={snapshot} />;
}
