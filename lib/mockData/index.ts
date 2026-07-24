export { branches } from "./branches";
export { doctors } from "./doctors";
export { patients } from "./patients";
export { patientAllergies } from "./patientAllergies";
export { conditions, patientConditions } from "./conditions";
export { medications, medicationStock } from "./medications";
export { appointments } from "./appointments";
export { invoices, payments } from "./billing";
export { insuranceProviders, insurancePackages, insurances } from "./insurance";
export { claims } from "./claims";
export { employees } from "./employees";
export { consultationRecords, prescriptionItems } from "./consultations";
export { treatments, treatmentCatalogue } from "./treatments";
export { conversations, messages } from "./messages";
export { mockUsers, roleConfig } from "./users";

// Schedules — doctor availability blocks
export const doctorSchedules = [
  { scheduleId: "SCH-001", doctorId: "DOC-001", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: true },
  { scheduleId: "SCH-002", doctorId: "DOC-001", dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isAvailable: true },
  { scheduleId: "SCH-003", doctorId: "DOC-001", dayOfWeek: 3, startTime: "09:00", endTime: "13:00", isAvailable: true },
  { scheduleId: "SCH-004", doctorId: "DOC-001", dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isAvailable: true },
  { scheduleId: "SCH-005", doctorId: "DOC-001", dayOfWeek: 5, startTime: "09:00", endTime: "15:00", isAvailable: true },
  // DOC-005 Monday is fully booked (isAvailable false)
  { scheduleId: "SCH-010", doctorId: "DOC-005", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: false },
  { scheduleId: "SCH-011", doctorId: "DOC-005", dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isAvailable: true },
  { scheduleId: "SCH-012", doctorId: "DOC-005", dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isAvailable: true },
  { scheduleId: "SCH-013", doctorId: "DOC-005", dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isAvailable: true },
  { scheduleId: "SCH-014", doctorId: "DOC-005", dayOfWeek: 5, startTime: "09:00", endTime: "13:00", isAvailable: true },
];

// Revenue data for charts
export const revenueByMonth = [
  { month: "Jan", revenue: 42000, appointments: 148 },
  { month: "Feb", revenue: 38500, appointments: 132 },
  { month: "Mar", revenue: 51200, appointments: 179 },
  { month: "Apr", revenue: 47800, appointments: 163 },
  { month: "May", revenue: 55600, appointments: 192 },
  { month: "Jun", revenue: 61300, appointments: 218 },
  { month: "Jul", revenue: 58900, appointments: 207 },
  { month: "Aug", revenue: 64200, appointments: 234 },
  { month: "Sep", revenue: 59700, appointments: 215 },
  { month: "Oct", revenue: 68400, appointments: 248 },
  { month: "Nov", revenue: 71200, appointments: 261 },
  { month: "Dec", revenue: 75800, appointments: 278 },
];

export const appointmentsByMonth = [
  { month: "Jan", total: 148, completed: 118, cancelled: 12 },
  { month: "Feb", total: 132, completed: 105, cancelled: 15 },
  { month: "Mar", total: 179, completed: 151, cancelled: 18 },
  { month: "Apr", total: 163, completed: 138, cancelled: 14 },
  { month: "May", total: 192, completed: 164, cancelled: 20 },
  { month: "Jun", total: 218, completed: 189, cancelled: 22 },
  { month: "Jul", total: 207, completed: 178, cancelled: 19 },
  { month: "Aug", total: 234, completed: 201, cancelled: 24 },
  { month: "Sep", total: 215, completed: 187, cancelled: 21 },
  { month: "Oct", total: 248, completed: 219, cancelled: 23 },
  { month: "Nov", total: 261, completed: 231, cancelled: 25 },
  { month: "Dec", total: 278, completed: 246, cancelled: 28 },
];

export const patientGrowthByMonth = [
  { month: "Jan", patients: 180 },
  { month: "Feb", patients: 210 },
  { month: "Mar", patients: 240 },
  { month: "Apr", patients: 265 },
  { month: "May", patients: 295 },
  { month: "Jun", patients: 320 },
  { month: "Jul", patients: 345 },
  { month: "Aug", patients: 380 },
  { month: "Sep", patients: 400 },
  { month: "Oct", patients: 425 },
  { month: "Nov", patients: 450 },
  { month: "Dec", patients: 480 },
];
