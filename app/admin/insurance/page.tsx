import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getPackages, getProviders, getStats } from "@/lib/actions/admin-insurance";
import { redirect } from "next/navigation";
import InsurancePage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const [stats, providers, packages] = await Promise.all([
    getStats(),
    getProviders(),
    getPackages(),
  ]);

  return <InsurancePage initialStats={stats} initialProviders={providers} initialPackages={packages} />;
}
