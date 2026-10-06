import db from "@/lib/db";
import { doctorRoute, notFound, readJson } from "@/lib/server/apiHandler";
import { appointmentIdSchema as idSchema, scheduleSlotSchema } from "@/lib/server/doctorSchemas";
import { fetchDoctorSchedule, removeScheduleSlot, updateScheduleSlot } from "@/lib/server/sql/doctorSchedule";
import type { ScheduleSlotInput } from "@/lib/doctorTypes";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/doctor/schedule/:id  -> replace one working-hours slot
export function PUT(request: Request, { params }: Ctx) {
  return doctorRoute(async (doctor) => {
    const { id } = await params;
    const slot = scheduleSlotSchema.parse(await readJson(request)) as ScheduleSlotInput;
    if (!(await updateScheduleSlot(db, doctor.userId, idSchema.parse(id), slot))) throw notFound("Slot");
    return fetchDoctorSchedule(db, doctor.userId);
  });
}

// DELETE /api/doctor/schedule/:id
export function DELETE(_request: Request, { params }: Ctx) {
  return doctorRoute(async (doctor) => {
    const { id } = await params;
    if (!(await removeScheduleSlot(db, doctor.userId, idSchema.parse(id)))) throw notFound("Slot");
    return fetchDoctorSchedule(db, doctor.userId);
  });
}
