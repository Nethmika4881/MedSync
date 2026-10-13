import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getBranchAppointments } from "@/lib/actions/frontdesk-appointments";
import { redirect } from "next/navigation";
import AppointmentsPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const initialAppointments = await getBranchAppointments(user.branchId);

  return <AppointmentsPage initialAppointments={initialAppointments} />;
}
