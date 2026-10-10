import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import DoctorsPage from "./_client";
import { getDoctorDirectory } from "@/lib/actions/doctors";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  if (user.role !== "admin") throw new Error("unauthorized")

  const doctor = await getDoctorDirectory();
  return <DoctorsPage user={user} doctor={doctor} />;
}
