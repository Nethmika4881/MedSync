import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorAppointments } from "@/lib/actions/doctor-appointments";
import { getDoctorSchedule } from "@/lib/actions/doctor-schedule";
import { clinicToday } from "@/lib/server/doctorAuth";
import { dateSchema } from "@/lib/server/doctorSchemas";
import MySchedulePage from "./_client";

export default async function Page({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");

  const { date: requested } = await searchParams;
  const parsed = dateSchema.safeParse(requested);
  const date = parsed.success ? parsed.data : clinicToday();

  const [appointments, weeklyHours] = await Promise.all([
    getDoctorAppointments(date, date),
    getDoctorSchedule(),
  ]);

  return <MySchedulePage date={date} today={clinicToday()} appointments={appointments} weeklyHours={weeklyHours} />;
}
