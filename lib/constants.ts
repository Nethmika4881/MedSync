// lib/constants.ts
// Temporary file to satisfy UI components that previously imported arrays from mock data.
// As pages are wired to the DB / Zustand stores, these will be progressively removed.

export { SESSION_META, DAYS_OF_WEEK } from "@/lib/types";
export type { SessionType, DayOfWeek, DoctorScheduleSlot, SessionConfig } from "@/lib/types";
import type {
  Doctor,
  DoctorScheduleSlot,
  Employee,
  InsuranceProvider,
  Medication,
  Patient,
  SessionConfig,
  TreatmentCatalogueItem,
} from "@/lib/types";

interface LegacyBranch {
  branchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  managerName: string;
  isActive: boolean;
  doctorCount: number;
  patientCount: number;
  createdAt: string;
}

interface InsurancePackage {
  packageId: string;
  packageName: string;
  providerId: string;
  providerName: string;
  annualLimit: number;
  copayPercent: number;
  coverage: string[];
}

interface RevenuePoint {
  month: string;
  revenue: number;
}

interface AppointmentPoint {
  month: string;
  completed: number;
  cancelled: number;
}

interface PatientGrowthPoint {
  month: string;
  patients: number;
}

// Empty arrays to prevent UI crashes while DB is disconnected
export const branches: LegacyBranch[] = [];
export const doctors: Doctor[] = [];
export const patients: Patient[] = [];
export const employees: Employee[] = [];
export const medications: Medication[] = [];
export const treatmentCatalogue: TreatmentCatalogueItem[] = [];
export const insuranceProviders: InsuranceProvider[] = [];
export const insurancePackages: InsurancePackage[] = [];

// For charts
export const revenueByMonth: RevenuePoint[] = [];
export const appointmentsByMonth: AppointmentPoint[] = [];
export const patientGrowthByMonth: PatientGrowthPoint[] = [];

// Fallbacks for stores
export const sessionConfigs: SessionConfig[] = [];
export const doctorSchedules: DoctorScheduleSlot[] = [];
