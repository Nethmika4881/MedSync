import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import {
  getAdminBranchOptions,
  getAdminPatients,
} from "@/lib/actions/admin-patients";
import AdminPatientsClient from "./_client";

export default async function AdminPatientsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?clear=1");
  }

  if (user.role !== "admin") {
    redirect(`/${user.role}/dashboard`);
  }

  const [patients, branches] = await Promise.all([
    getAdminPatients(),
    getAdminBranchOptions(),
  ]);

  return <AdminPatientsClient initialPatients={patients} branches={branches} />;
}
