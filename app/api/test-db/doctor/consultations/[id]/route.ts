import db from "@/lib/db";
import { doctorRoute, notFound, readJson } from "@/lib/server/apiHandler";
import { appointmentIdSchema, saveConsultationSchema } from "@/lib/server/doctorSchemas";
import {
  completeConsultation,
  fetchConsultationWorkspace,
  saveConsultationDraft,
} from "@/lib/server/sql/doctorConsultations";

type Ctx = { params: Promise<{ id: string }> };

export function GET(_request: Request, { params }: Ctx) {
  return doctorRoute(async (doctor) => {
    const { id } = await params;
    const workspace = await fetchConsultationWorkspace(db, doctor.userId, appointmentIdSchema.parse(id));
    if (!workspace) throw notFound("Consultation");
    return workspace;
  });
}

export function PUT(request: Request, { params }: Ctx) {
  return doctorRoute(async (doctor) => {
    const { id } = await params;
    const body = (await readJson(request)) as Record<string, unknown>;
    const valid = saveConsultationSchema.parse({ ...body, appointmentId: appointmentIdSchema.parse(id) });
    if (new URL(request.url).searchParams.get("complete") === "1") {
      return { invoiceId: await completeConsultation(db, doctor.userId, valid) };
    }
    return { consultationId: await saveConsultationDraft(db, doctor.userId, valid) };
  });
}
