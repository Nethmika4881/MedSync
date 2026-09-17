// lib/types.ts
// Canonical TypeScript interfaces for every domain.
// These are the shapes that Server Actions return and UI components consume.
// They must stay in sync with the database schema in Database/schema.sql.

// ─── Auth / Users ─────────────────────────────────────────────────────────────

export type UserRole = "admin" | "doctor" | "patient" | "receptionist";

export interface AuthUser {
  userId: string;
  role: UserRole;
  name: string;
  firstName: string;
  email: string;
  branchId: string;
  avatar: string; // initials, e.g. "JT"
  blurb: string;
}

// ─── Branch ───────────────────────────────────────────────────────────────────

export interface Branch {
  branchId: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  managerName: string | null;
  isActive: boolean;
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface Doctor {
  doctorId: string;
  name: string;
  specialization: string;
  branchId: string;
  branchName: string;
  consultationFee: number;
  experience: number;
  education: string;
  bio: string;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  avatar: string;
  phone: string;
  email: string;
  // UI legacy fields
  fullyBookedDate?: string;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  branchId: string;
  registeredAt: string;
  isActive: boolean;
  avatar: string;
  insuranceProvider?: string;
  insurancePolicyNo?: string;
  // UI legacy fields
  age?: number;
  dob?: string;
  insuranceId?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  city?: string;
  firstName?: string;
  lastName?: string;
}

export interface PatientAllergy {
  allergyId: string;
  patientId: string;
  allergenName: string;
  reaction: string;
  severity: "Mild" | "Moderate" | "Severe" | "Life-threatening";
}

export interface PatientCondition {
  conditionId: string;
  patientId: string;
  conditionName: string;
  diagnosedDate: string;
  isActive: boolean;
  notes?: string;
  // UI legacy fields
  pcId?: string;
  status?: "Active" | "Resolved";
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "Checked-in"
  | "In-Progress"
  | "Checked-out"
  | "Completed"
  | "Cancelled"
  | "Rescheduled";

export type VisitType =
  | "General Checkup"
  | "Follow-up"
  | "Consultation"
  | "New Patient"
  | "Routine Check"
  | "Emergency"
  | "Walk-in"
  | "Video Consultation"
  | "Pre-Visit";

export interface Appointment {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  branchId: string;
  dateTime: string;        // ISO 8601
  duration: number;        // minutes
  visitType: VisitType;
  status: AppointmentStatus;
  notes?: string;
  cancelReason?: string;
  paymentStatus?: "Paid" | "Unpaid" | "Partial" | "Insurance";
  fee: number;
  // UI legacy fields
  doctorSpecialization?: string;
  session?: SessionType;
  ticketNumber?: number;
  branchName?: string;
  source?: string;
  invoiceId?: string;
  consultationId?: string;
}

// ─── Consultation / Clinical ───────────────────────────────────────────────────

export interface ConsultationRecord {
  consultationId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  symptoms: string;
  diagnosis: string | null;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: string;
  // UI legacy fields
  treatmentIds?: string[];
  prescriptionIds?: string[];
}

// ─── Treatments ───────────────────────────────────────────────────────────────

export type TreatmentCategory = "Laboratory" | "Radiology" | "Procedure" | "Therapy";
export type TreatmentStatus = "Ordered" | "In-Progress" | "Completed" | "Cancelled";

export interface Treatment {
  treatmentId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  treatmentName: string;
  category: TreatmentCategory;
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
  status: TreatmentStatus;
  orderedAt: string;
  performedAt?: string;
  performedBy?: string;
  resultFile?: string;
  branchId: string;
}

export interface TreatmentCatalogueItem {
  catalogueId: string;    // treatment_service_code in DB
  name: string;
  category: TreatmentCategory;
  description: string;
  unitPrice: number;
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

export interface Prescription {
  prescriptionId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  notes?: string;
  allergyChecked: boolean;
  dispensed: boolean;
  dispensedAt?: string;
  dispensedBy?: string;
  prescribedAt: string;
}

export interface Medication {
  medicationId: string;
  genericName: string;
  brandName?: string;
  contraindications?: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = "Draft" | "Unpaid" | "Partial" | "Paid" | "Overdue" | "Cancelled" | "Overpaid";
export type ClaimStatus = "Submitted" | "UnderReview" | "Approved" | "Rejected" | "Settled";

export interface Invoice {
  invoiceId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  branchId: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  creditBalance?: number;
  status: InvoiceStatus | "Due";
  issuedAt: string;
  issueDate?: string;
  dueDate: string;
  paidAt?: string;
}

export interface RefundTask {
  taskId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  refundAmount: number;
  reason: string;
  status: "Pending" | "Processed" | "Dismissed";
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface Payment {
  paymentId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  amount: number;
  method: "Cash" | "Card" | "Online" | "Bank Transfer";
  paidAt: string;
  reference: string;
  status: "Successful" | "Failed" | "Pending";
}

export interface Claim {
  claimId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  insuranceProviderId: string;
  providerName: string;
  policyNumber: string;
  claimedAmount: number;
  approvedAmount: number;
  status: ClaimStatus;
  submittedDate: string;
  reviewedDate?: string;
  notes?: string;
}

// ─── Insurance ────────────────────────────────────────────────────────────────

export interface InsuranceProvider {
  providerId: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  isActive: boolean;
}

export interface InsurancePolicy {
  policyId: string;
  patientId: string;
  providerId: string;
  providerName: string;
  policyNumber: string;
  coverageAmount: number;
  usedCoverageAmount: number;
  expiryDate: string;
  isActive: boolean;
}

// ─── Staff / Employees ────────────────────────────────────────────────────────

export interface Employee {
  employeeId: string;
  name: string;
  role: string;
  branchId: string;
  branchName: string;
  email: string;
  phone: string;
  avatar: string;
  hireDate: string;
  isActive: boolean;
  department: string;
}

// ─── Appointments — UI constants ──────────────────────────────────────────────

export type SessionType = "Morning" | "Midday" | "Afternoon" | "Evening";

export const SESSION_META: Record<
  SessionType,
  { label: string; timeRange: string; startHour: number; emoji: string; color: string; textColor: string }
> = {
  Morning:   { label: "Morning",   timeRange: "8:00 AM – 11:00 AM",  startHour: 8,  emoji: "🌅", color: "bg-amber-50  border-amber-200",  textColor: "text-amber-700"  },
  Midday:    { label: "Midday",    timeRange: "11:00 AM – 2:00 PM",  startHour: 11, emoji: "☀️", color: "bg-sky-50    border-sky-200",    textColor: "text-sky-700"    },
  Afternoon: { label: "Afternoon", timeRange: "2:00 PM – 5:00 PM",   startHour: 14, emoji: "🌤️", color: "bg-teal-50   border-teal-200",   textColor: "text-teal-700"   },
  Evening:   { label: "Evening",   timeRange: "5:00 PM – 8:00 PM",   startHour: 17, emoji: "🌙", color: "bg-indigo-50 border-indigo-200", textColor: "text-indigo-700" },
};

// ─── Prescriptions (pharmacy) ─────────────────────────────────────────────────

export interface PrescriptionItem {
  prescriptionId: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  dispensed: boolean;
  dispensedAt?: string;
  dispensedBy?: string;
  pickedUp: boolean;
  issuedDate: string;
}

export interface MedicationStock {
  stockId: string;
  medicationId: string;
  medicationName: string;
  branchId: string;
  quantityOnHand: number;
  reorderLevel: number;
  lastRestocked: string;
}

// ─── Doctor Schedules ─────────────────────────────────────────────────────────

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export const DAYS_OF_WEEK: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface DoctorScheduleSlot {
  scheduleId: string;
  doctorId: string;
  branchId: string;
  branchName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
  slotDurationMinutes: number;
}

export interface SessionConfig {
  doctorId: string;
  session: SessionType;
  maxTickets: number;
  isEnabled: boolean;
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export interface Conversation {
  conversationId: string;
  participants: { userId: string; name: string; avatar: string; role: string }[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isArchived: boolean;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: string;
  isRead: boolean;
  isOutgoing: boolean;
}
