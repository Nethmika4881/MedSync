import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorProfile } from "@/lib/actions/doctor-profile";
import { getBranchOptions, getDoctorSchedule } from "@/lib/actions/doctor-schedule";
import SettingsPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");

  const [profile, schedule, branches] = await Promise.all([
    getDoctorProfile(),
    getDoctorSchedule(),
    getBranchOptions(),
  ]);
  if (!profile) notFound();

  return <SettingsPage profile={profile} schedule={schedule} branches={branches} />;
}
