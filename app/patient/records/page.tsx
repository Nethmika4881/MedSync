import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import RecordsPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <RecordsPage user={user} />;
}
