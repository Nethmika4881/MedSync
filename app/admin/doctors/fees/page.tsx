import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorDirectory } from "@/lib/actions/doctors";
import DoctorFeesPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?clear=1");
  }

  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const doctors = await getDoctorDirectory();

  return <DoctorFeesPage doctors={doctors} />;
}
