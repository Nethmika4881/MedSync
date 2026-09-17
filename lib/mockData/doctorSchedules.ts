export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export const DAYS_OF_WEEK: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Mirrors the `doctor_schedule` table in Database/schema.sql
// (schedule_id, doctor_id, branch_id, day_of_week, start_time, end_time, slot_duration_minutes).
export interface DoctorScheduleSlot {
  scheduleId: string;
  doctorId: string;
  branchId: string;
  branchName: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  slotDurationMinutes: number;
}

export const doctorSchedules: DoctorScheduleSlot[] = [
  { scheduleId: "SCH-001", doctorId: "USR-002", branchId: "BR-001", branchName: "Healthora Central", dayOfWeek: "Monday", startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 },
  { scheduleId: "SCH-002", doctorId: "USR-002", branchId: "BR-001", branchName: "Healthora Central", dayOfWeek: "Wednesday", startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 },
  { scheduleId: "SCH-003", doctorId: "USR-002", branchId: "BR-002", branchName: "Healthora Westside", dayOfWeek: "Friday", startTime: "14:00", endTime: "18:00", slotDurationMinutes: 20 },
];
