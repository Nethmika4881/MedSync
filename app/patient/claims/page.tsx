import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import PatientClaimsClient from "./_client";

export default async function ClaimsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");
  return <PatientClaimsClient user={user} />;
}
