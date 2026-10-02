import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import TreatmentsPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <TreatmentsPage user={user} />;
}
