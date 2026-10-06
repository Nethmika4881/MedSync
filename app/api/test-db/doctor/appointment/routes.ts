import { NextRequest } from "next/server";
import db from "@/lib/db";
import { doctorRoute } from "@/lib/server/apiHandler";
import { clinicToday } from "@/lib/server/doctorAuth";
import { dateSchema } from "@/lib/server/doctorSchemas";
import { fetchDoctorAppointments } from "@/lib/server/sql/doctorAppointments";

export function GET(request: NextRequest) {
  return doctorRoute(async (doctor) => {
    const params = request.nextUrl.searchParams;
    const from = dateSchema.parse(params.get("from") ?? clinicToday());
    const to = dateSchema.parse(params.get("to") ?? from);
    return fetchDoctorAppointments(db, doctor.userId, from, to);
  });
}
