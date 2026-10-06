import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getPatientDetail } from "@/lib/actions/doctor-patients";
import PatientDetailPage from "./_client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");

  const { id } = await params;
  const patient = await getPatientDetail(id);
  if (!patient) notFound();

  return <PatientDetailPage patient={patient} />;
}
