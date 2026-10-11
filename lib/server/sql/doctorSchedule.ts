import { dbDayToUi, dbTimeToUi, uiDayToDb } from "@/lib/db/dayOfWeek";
import type { BranchOption, ScheduleSlotInput } from "@/lib/doctorTypes";
import type { DoctorScheduleSlot } from "@/lib/types";
import type { Queryable } from "./queryable";

function mapScheduleRow(row: Record<string, unknown>): DoctorScheduleSlot {
  return {
    scheduleId: String(row.scheduleId),
    doctorId: String(row.doctorId),
    branchId: String(row.branchId),
    branchName: String(row.branchName),
    dayOfWeek: dbDayToUi(Number(row.dayOfWeek)),
    startTime: dbTimeToUi(String(row.startTime)),
    endTime: dbTimeToUi(String(row.endTime)),
    slotDurationMinutes: Number(row.slotDurationMinutes),
  };
}

export async function fetchDoctorSchedule(db: Queryable, doctorId: string): Promise<DoctorScheduleSlot[]> {
  const { rows } = await db.query(
    `SELECT schedule_id                      AS "scheduleId",
            doctor_id                        AS "doctorId",
            branch_id                        AS "branchId",
            branch_name                      AS "branchName",
            day_of_week                      AS "dayOfWeek",
            TO_CHAR(start_time, 'HH24:MI')   AS "startTime",
            TO_CHAR(end_time, 'HH24:MI')     AS "endTime",
            COALESCE(slot_duration_minutes, 15) AS "slotDurationMinutes"
     FROM v_doctor_weekly_schedule
     WHERE doctor_id = $1
     ORDER BY day_of_week, start_time`,
    [doctorId]
  );

  return rows.map(mapScheduleRow);
}

export async function fetchAdminDoctorSchedules(db: Queryable): Promise<DoctorScheduleSlot[]> {
  const { rows } = await db.query(
    `SELECT schedule.schedule_id AS "scheduleId",
            schedule.doctor_id AS "doctorId",
            schedule.branch_id AS "branchId",
            schedule.branch_name AS "branchName",
            schedule.day_of_week AS "dayOfWeek",
            TO_CHAR(schedule.start_time, 'HH24:MI') AS "startTime",
            TO_CHAR(schedule.end_time, 'HH24:MI') AS "endTime",
            COALESCE(schedule.slot_duration_minutes, 15) AS "slotDurationMinutes"
     FROM v_doctor_weekly_schedule schedule
     INNER JOIN employee ON employee.employee_id = schedule.doctor_id
     WHERE employee.is_active = TRUE
     ORDER BY schedule.doctor_id, schedule.day_of_week, schedule.start_time`
  );

  return rows.map(mapScheduleRow);
}

export async function fetchBranchOptions(db: Queryable): Promise<BranchOption[]> {
  const { rows } = await db.query(
    `SELECT branch_id AS "branchId", branch_name AS "branchName"
     FROM branch
     WHERE is_active = TRUE
     ORDER BY branch_name`
  );
  return rows.map((r) => ({ branchId: String(r.branchId), branchName: String(r.branchName) }));
}

// The no-overlap trigger rejects clashing hours with a readable message.
export async function addScheduleSlot(db: Queryable, doctorId: string, slot: ScheduleSlotInput): Promise<void> {
  await db.query(
    `INSERT INTO doctor_schedule (doctor_id, branch_id, day_of_week, start_time, end_time, slot_duration_minutes)
     VALUES ($1, $2, $3, $4::time, $5::time, $6)`,
    [doctorId, slot.branchId, uiDayToDb(slot.dayOfWeek), slot.startTime, slot.endTime, slot.slotDurationMinutes]
  );
}

// False when the slot doesn't exist or belongs to another doctor.
export async function updateScheduleSlot(
  db: Queryable,
  doctorId: string,
  scheduleId: string,
  slot: ScheduleSlotInput
): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE doctor_schedule
        SET branch_id = $3, day_of_week = $4, start_time = $5::time, end_time = $6::time,
            slot_duration_minutes = $7
      WHERE schedule_id = $2 AND doctor_id = $1`,
    [doctorId, scheduleId, slot.branchId, uiDayToDb(slot.dayOfWeek), slot.startTime, slot.endTime, slot.slotDurationMinutes]
  );
  return (rowCount ?? 0) > 0;
}

export async function removeScheduleSlot(db: Queryable, doctorId: string, scheduleId: string): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM doctor_schedule WHERE schedule_id = $2 AND doctor_id = $1`, [
    doctorId,
    scheduleId,
  ]);
  return (rowCount ?? 0) > 0;
}
