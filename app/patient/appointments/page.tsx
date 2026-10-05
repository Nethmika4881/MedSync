import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import { getPatientAppointments } from "@/lib/actions/patient-appointments";
import PatientAppointmentsClient from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    redirect("/login?clear=1");
  }

  // Load patient's appointments from PostgreSQL server-side
  const initialAppointments = await getPatientAppointments();

  return (
    <PatientAppointmentsClient
      user={user}
      initialAppointments={initialAppointments}
    />
  );
}
