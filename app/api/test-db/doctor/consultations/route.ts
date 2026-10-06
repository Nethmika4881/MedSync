import db from "@/lib/db";
import { doctorRoute } from "@/lib/server/apiHandler";
import { fetchConsultationHistory } from "@/lib/server/sql/doctorConsultations";

export function GET() {
  return doctorRoute((doctor) => fetchConsultationHistory(db, doctor.userId));
}
