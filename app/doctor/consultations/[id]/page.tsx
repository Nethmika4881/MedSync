import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getConsultationWorkspace } from "@/lib/actions/doctor-consultations";
import { getMedications, getTreatmentCatalogue } from "@/lib/actions/doctor-catalogue";
import { appointmentIdSchema } from "@/lib/server/doctorSchemas";
import ConsultationDetailPage from "./_client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") redirect("/login?clear=1");

  const { id } = await params;
  if (!appointmentIdSchema.safeParse(id).success) notFound();

  const [workspace, catalogue, medications] = await Promise.all([
    getConsultationWorkspace(id),
    getTreatmentCatalogue(),
    getMedications(),
  ]);
  if (!workspace) notFound();

  return (
    <ConsultationDetailPage
      key={`${workspace.appointment.appointmentId}-${workspace.isLocked}`}
      workspace={workspace}
      catalogue={catalogue}
      medications={medications}
    />
  );
}
