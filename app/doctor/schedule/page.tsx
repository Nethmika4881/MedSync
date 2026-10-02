import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import SchedulePage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");
  return <SchedulePage user={user} />;
}
