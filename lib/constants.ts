// lib/constants.ts
// Temporary file to satisfy UI components that previously imported arrays from mock data.
// As pages are wired to the DB / Zustand stores, these will be progressively removed.

export { SESSION_META, DAYS_OF_WEEK } from "@/lib/types";
export type { SessionType, DayOfWeek, DoctorScheduleSlot, SessionConfig } from "@/lib/types";

// Empty arrays to prevent UI crashes while DB is disconnected
export const branches: any[] = [];
export const doctors: any[] = [];
export const patients: any[] = [];
export const employees: any[] = [];
export const medications: any[] = [];
export const treatmentCatalogue: any[] = [];
export const insuranceProviders: any[] = [];
export const insurancePackages: any[] = [];

// For charts
export const revenueByMonth: any[] = [];
export const appointmentsByMonth: any[] = [];
export const patientGrowthByMonth: any[] = [];

// Fallbacks for stores
export const sessionConfigs: any[] = [];
export const doctorSchedules: any[] = [];
