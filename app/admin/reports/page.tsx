import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import ReportsPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ReportsPage user={user} />;
}
