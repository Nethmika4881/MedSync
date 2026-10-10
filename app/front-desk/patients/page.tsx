import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getBranchPatients } from "@/lib/actions/frontdesk-patients";
import { redirect } from "next/navigation";
import PatientsClientPage from "./_client";

export default async function PatientsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const patients = await getBranchPatients(user.branchId);

  return <PatientsClientPage initialPatients={patients} branchId={user.branchId} />;
}
