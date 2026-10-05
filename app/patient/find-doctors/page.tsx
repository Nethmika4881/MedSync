import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import FindDoctorsPage from "./_client";
import {
  getDoctorDirectory,
  getBranchOptions,
  getSpecializationOptions,
} from "@/lib/actions/doctors";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  // Fetch all data server-side — no patient ID exposed to browser
  const [doctors, branches, specializations] = await Promise.all([
    getDoctorDirectory().catch(() => []),
    getBranchOptions().catch(() => []),
    getSpecializationOptions().catch(() => []),
  ]);

  return (
    <FindDoctorsPage
      user={user}
      doctors={doctors}
      branches={branches}
      specializations={specializations}
    />
  );
}
