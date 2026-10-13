import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import NewAppointmentClient from "@/components/frontdesk/new-appointment-client";

export default async function NewAppointmentPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "receptionist" && user.role !== "admin")) {
    redirect("/login");
  }
  return <NewAppointmentClient user={user} />;
}