import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorPatients } from "@/lib/actions/doctor-patients";
import PatientsPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");

  const patients = await getDoctorPatients();
  return <PatientsPage patients={patients} />;
}
