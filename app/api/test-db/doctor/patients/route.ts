import db from "@/lib/db";
import { doctorRoute } from "@/lib/server/apiHandler";
import { fetchDoctorPatients } from "@/lib/server/sql/doctorPatients";

export function GET() {
  return doctorRoute((doctor) => fetchDoctorPatients(db, doctor.userId));
}
