import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorAppointments } from "@/lib/actions/doctor-appointments";
import { getDoctorConsultations } from "@/lib/actions/doctor-consultations";
import ConsultationsPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");

  const [queue, records] = await Promise.all([getDoctorAppointments(), getDoctorConsultations()]);

  return <ConsultationsPage queue={queue} records={records} />;
}
