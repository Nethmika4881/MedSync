import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getFrontDeskStats, getFrontDeskWaitingQueue } from "@/lib/actions/frontdesk-dashboard";
import { redirect } from "next/navigation";
import DashboardPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const [stats, queue] = await Promise.all([
    getFrontDeskStats(user.branchId),
    getFrontDeskWaitingQueue(user.branchId),
  ]);

  return <DashboardPage user={user} initialStats={stats} initialQueue={queue} />;
}
