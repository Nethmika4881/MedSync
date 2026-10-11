import { getAdminDoctorScheduleData } from "@/lib/actions/admin-doctor-schedules";
import SchedulesPage from "./_client";

export default async function Page() {
  const data = await getAdminDoctorScheduleData();

  return <SchedulesPage {...data} />;
}
