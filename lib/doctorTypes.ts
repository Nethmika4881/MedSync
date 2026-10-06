import type { Appointment, DayOfWeek, TreatmentCategory, TreatmentStatus } from "@/lib/types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

//  Consultation workspace 

export interface WorkspaceConsultation {
  consultationId: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  followUpRequired: boolean;
  followUpDate: string; // "YYYY-MM-DD" or ""
}

export interface WorkspaceTreatment {
  appointmentTreatmentId: string;
  treatmentServiceCode: string;
  name: string;
  category: TreatmentCategory;
  unitPrice: number;
  quantity: number;
  total: number;
  status: TreatmentStatus; // only "Ordered" can still be edited by the doctor
  performedAt?: string;
}

export interface WorkspacePrescription {
  prescriptionId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  notes: string;
  allergyChecked: boolean;
  contraindications: string; // medication.contraindications, "" when none are recorded
}

export interface ConsultationWorkspace {
  appointment: Appointment;
  consultation: WorkspaceConsultation | null; // null until the first save
  treatments: WorkspaceTreatment[];
  prescriptions: WorkspacePrescription[];
  invoiceId: string | null;
  isLocked: boolean; // appointment is Completed
}

export interface SaveConsultationInput {
  appointmentId: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: string;
  treatments: { treatmentServiceCode: string; quantity: number }[];
  prescriptions: {
    medicationId: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    notes: string;
    allergyChecked: boolean; // the doctor confirmed the patient's allergies against this medication
  }[];
}

//  Past records 

export type ConsultationRecordStatus = "Draft" | "Completed" | "Follow-up";

export interface ConsultationHistoryItem {
  consultationId: string;
  appointmentId: string;
  patientName: string;
  date: string; // "YYYY-MM-DD"
  diagnosis: string | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  status: ConsultationRecordStatus;
  treatmentCount: number;
  prescriptionCount: number;
}

//  Working hours 

export interface BranchOption {
  branchId: string;
  branchName: string;
}

export interface ScheduleSlotInput {
  branchId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  slotDurationMinutes: number;
}

//  Profile 

export interface DoctorProfile {
  doctorId: string;
  fullName: string;
  email: string;
  licenceNo: string;
  roomNo: string;
  qualification: string;
  yearsExperience: number | null;
  consultationFee: number;
  isAvailable: boolean;
  branchName: string;
  phone: string;
  specializations: string;
}

export interface UpdateProfileInput {
  roomNo: string;
  qualification: string;
  yearsExperience: number | null;
  isAvailable: boolean;
  phone: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

//  Patients 

export interface DoctorPatientListItem {
  patientId: string;
  patientName: string;
  age: number | null;
  gender: string;
  bloodGroup: string;
  visitCount: number;
  lastVisitDate: string; // "YYYY-MM-DD"
}

export interface PatientHistoryVisit {
  appointmentId: string;
  date: string; // "YYYY-MM-DD"
  doctorName: string;
  isMine: boolean; // the logged-in doctor saw this visit
  symptoms: string;
  diagnosis: string;
  notes: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  treatments: { name: string; quantity: number }[];
  prescriptions: { medication: string; dosage: string; frequency: string; durationDays: number | null }[];
}

export interface PatientDetail {
  patientId: string;
  fullName: string;
  age: number | null;
  gender: string;
  bloodGroup: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  history: PatientHistoryVisit[]; // newest first
}
