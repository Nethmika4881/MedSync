import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorAppointments } from "@/lib/actions/doctor-appointments";
import { getDoctorConsultations } from "@/lib/actions/doctor-consultations";
import { clinicToday } from "@/lib/server/doctorAuth";
import ConsultationsPage from "./_client";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; date?: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");
  const params = await searchParams;
  const today = clinicToday();
  const initialTab = params.tab === "records" ? "records" : "queue";
  const recordDate = params.date === "today" ? today : undefined;

  const [queue, records] = await Promise.all([getDoctorAppointments(), getDoctorConsultations()]);

  return <ConsultationsPage queue={queue} records={records} initialTab={initialTab} recordDate={recordDate} />;
}
