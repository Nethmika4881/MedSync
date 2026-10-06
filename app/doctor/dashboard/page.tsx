import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorAppointments } from "@/lib/actions/doctor-appointments";
import { clinicToday } from "@/lib/server/doctorAuth";
import { shiftDay } from "@/lib/doctorFormat";
import DashboardPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");

  const today = clinicToday();
  const appointments = await getDoctorAppointments(today, shiftDay(today, 6));

  return <DashboardPage user={user} today={today} appointments={appointments} />;
}
