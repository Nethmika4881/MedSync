import db from "@/lib/db";
import { doctorRoute, notFound } from "@/lib/server/apiHandler";
import { appointmentIdSchema as idSchema } from "@/lib/server/doctorSchemas";
import { fetchPatientDetail } from "@/lib/server/sql/doctorPatients";

export function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return doctorRoute(async (doctor) => {
    const { id } = await params;
    const patient = await fetchPatientDetail(db, doctor.userId, idSchema.parse(id));
    if (!patient) throw notFound("Patient");
    return patient;
  });
}
