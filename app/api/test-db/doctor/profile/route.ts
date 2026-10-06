import db from "@/lib/db";
import { doctorRoute, notFound, readJson } from "@/lib/server/apiHandler";
import { updateProfileSchema } from "@/lib/server/doctorSchemas";
import { fetchDoctorProfile, updateDoctorProfile } from "@/lib/server/sql/doctorProfile";

// GET /api/doctor/profile
export function GET() {
  return doctorRoute(async (doctor) => {
    const profile = await fetchDoctorProfile(db, doctor.userId);
    if (!profile) throw notFound("Profile");
    return profile;
  });
}

// PATCH /api/doctor/profile  { roomNo, qualification, yearsExperience, isAvailable, phone }
export function PATCH(request: Request) {
  return doctorRoute(async (doctor) => {
    await updateDoctorProfile(db, doctor.userId, updateProfileSchema.parse(await readJson(request)));
    return fetchDoctorProfile(db, doctor.userId);
  });
}
