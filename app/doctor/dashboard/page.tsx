import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorAppointments, getUnfinishedConsultations } from "@/lib/actions/doctor-appointments";
import { clinicToday } from "@/lib/server/doctorAuth";
import { shiftDay } from "@/lib/doctorFormat";
import DashboardPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");

  const today = clinicToday();
  const [appointments, unfinished] = await Promise.all([
    getDoctorAppointments(today, shiftDay(today, 6)),
    getUnfinishedConsultations(),
  ]);

  return <DashboardPage user={user} today={today} appointments={appointments} unfinished={unfinished} />;
}
