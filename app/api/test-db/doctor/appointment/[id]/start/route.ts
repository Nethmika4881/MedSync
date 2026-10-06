import db from "@/lib/db";
import { doctorRoute } from "@/lib/server/apiHandler";
import { appointmentIdSchema } from "@/lib/server/doctorSchemas";
import { startConsultation } from "@/lib/server/sql/doctorAppointments";

export function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return doctorRoute(async (doctor) => {
    const { id } = await params;
    await startConsultation(db, doctor.userId, appointmentIdSchema.parse(id));
    return { started: true };
  });
}
