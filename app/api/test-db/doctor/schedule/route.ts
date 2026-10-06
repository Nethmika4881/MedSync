import db from "@/lib/db";
import { doctorRoute, readJson } from "@/lib/server/apiHandler";
import { scheduleSlotSchema } from "@/lib/server/doctorSchemas";
import { addScheduleSlot, fetchDoctorSchedule } from "@/lib/server/sql/doctorSchedule";
import type { ScheduleSlotInput } from "@/lib/doctorTypes";

// GET /api/doctor/schedule  -> weekly working hours
export function GET() {
  return doctorRoute((doctor) => fetchDoctorSchedule(db, doctor.userId));
}

// POST /api/doctor/schedule  { branchId, dayOfWeek, startTime, endTime, slotDurationMinutes }
export function POST(request: Request) {
  return doctorRoute(async (doctor) => {
    const slot = scheduleSlotSchema.parse(await readJson(request)) as ScheduleSlotInput;
    await addScheduleSlot(db, doctor.userId, slot);
    return fetchDoctorSchedule(db, doctor.userId);
  });
}
