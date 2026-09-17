export type AppointmentStatus =
  | "Confirmed"
  | "Checked-in"
  | "Checked-out"
  | "Completed"
  | "Cancelled"
  | "Rescheduled"
  | "Pending";

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

export type SessionType = "Morning" | "Midday" | "Afternoon" | "Evening";

/** UI display metadata for each session — never show session names raw, always use this */
export const SESSION_META: Record<SessionType, {
  label: string;         // internal label (not shown in patient UI)
  timeRange: string;     // shown to patients e.g. "8:00 AM – 11:00 AM"
  startHour: number;     // used when setting dateTime
  emoji: string;
  color: string;         // tailwind bg color for badge
  textColor: string;     // tailwind text color for badge
}> = {
  Morning:   { label: "Morning",   timeRange: "8:00 AM – 11:00 AM",  startHour: 8,  emoji: "🌅", color: "bg-amber-50  border-amber-200",  textColor: "text-amber-700" },
  Midday:    { label: "Midday",    timeRange: "11:00 AM – 2:00 PM",  startHour: 11, emoji: "☀️", color: "bg-sky-50    border-sky-200",    textColor: "text-sky-700"   },
  Afternoon: { label: "Afternoon", timeRange: "2:00 PM – 5:00 PM",   startHour: 14, emoji: "🌤️", color: "bg-teal-50   border-teal-200",   textColor: "text-teal-700"  },
  Evening:   { label: "Evening",   timeRange: "5:00 PM – 8:00 PM",   startHour: 17, emoji: "🌙", color: "bg-indigo-50 border-indigo-200", textColor: "text-indigo-700"},
};


export type PaymentStatus = "Paid" | "Unpaid" | "Due" | "Partial" | "Insurance";

export interface Appointment {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  branchId: string;
  branchName: string;
  dateTime: string;
  duration?: number; // legacy, can be kept for backward compatibility if needed
  session: SessionType;
  ticketNumber: number;
  visitType: VisitType;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  source: "Booked" | "Walk-in" | "Emergency";
  cancelReason?: string;
  rescheduledFrom?: string;
  notes?: string;
  consultationId?: string;
  invoiceId?: string;
}

export const appointments: Appointment[] = [
  // ===== PAST COMPLETED =====
  { appointmentId: "APT-1001", patientId: "PAT-001", patientName: "Michael Brown", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", doctorSpecialization: "Cardiology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-05-28T09:00:00", session: "Morning", ticketNumber: 1, visitType: "Follow-up", status: "Completed", paymentStatus: "Paid", source: "Booked", consultationId: "CON-001", invoiceId: "INV-2028" },
  { appointmentId: "APT-1002", patientId: "PAT-005", patientName: "Daniel Martinez", doctorId: "DOC-005", doctorName: "Dr. Emily Carter", doctorSpecialization: "Neurology", branchId: "BR-002", branchName: "Healthora Westside", dateTime: "2026-05-29T09:00:00", session: "Morning", ticketNumber: 2, visitType: "Consultation", status: "Rescheduled", paymentStatus: "Unpaid", source: "Booked", notes: "Rescheduled by patient" },
  { appointmentId: "APT-1010", patientId: "PAT-005", patientName: "Daniel Martinez", doctorId: "DOC-005", doctorName: "Dr. Emily Carter", doctorSpecialization: "Neurology", branchId: "BR-002", branchName: "Healthora Westside", dateTime: "2026-06-05T10:00:00", session: "Morning", ticketNumber: 1, visitType: "Consultation", status: "Completed", paymentStatus: "Paid", source: "Booked", rescheduledFrom: "APT-1002", consultationId: "CON-010", invoiceId: "INV-2030" },
  { appointmentId: "APT-1003", patientId: "PAT-002", patientName: "Emma Taylor", doctorId: "DOC-006", doctorName: "Dr. David Wilson", doctorSpecialization: "Pediatrics", branchId: "BR-002", branchName: "Healthora Westside", dateTime: "2026-05-30T14:00:00", session: "Afternoon", ticketNumber: 1, visitType: "General Checkup", status: "Cancelled", paymentStatus: "Due", source: "Booked", cancelReason: "Patient request" },
  { appointmentId: "APT-1004", patientId: "PAT-004", patientName: "Sofia Rodriguez", doctorId: "DOC-007", doctorName: "Dr. Sophia Adams", doctorSpecialization: "Gynecology", branchId: "BR-002", branchName: "Healthora Westside", dateTime: "2026-05-31T09:00:00", session: "Morning", ticketNumber: 3, visitType: "New Patient", status: "Cancelled", paymentStatus: "Unpaid", source: "Booked", cancelReason: "Doctor unavailable" },
  { appointmentId: "APT-1005", patientId: "PAT-003", patientName: "Liam Anderson", doctorId: "DOC-008", doctorName: "Dr. James Clark", doctorSpecialization: "Dermatology", branchId: "BR-003", branchName: "Healthora South Bay", dateTime: "2026-06-01T18:00:00", session: "Evening", ticketNumber: 1, visitType: "Routine Check", status: "Checked-out", paymentStatus: "Due", source: "Walk-in", consultationId: "CON-002", invoiceId: "INV-2029" },
  { appointmentId: "APT-1006", patientId: "PAT-007", patientName: "Maria Santos", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", doctorSpecialization: "Cardiology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-06-03T09:00:00", session: "Morning", ticketNumber: 4, visitType: "Follow-up", status: "Completed", paymentStatus: "Insurance", source: "Booked", consultationId: "CON-003", invoiceId: "INV-2031" },
  { appointmentId: "APT-1007", patientId: "PAT-010", patientName: "Noah Garcia", doctorId: "DOC-002", doctorName: "Dr. Alan James", doctorSpecialization: "General Practice", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-06-08T14:00:00", session: "Afternoon", ticketNumber: 2, visitType: "General Checkup", status: "Completed", paymentStatus: "Paid", source: "Booked", consultationId: "CON-004", invoiceId: "INV-2032" },
  { appointmentId: "APT-1008", patientId: "PAT-012", patientName: "Ethan Moore", doctorId: "DOC-009", doctorName: "Dr. Rachel Park", doctorSpecialization: "Orthopedics", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-06-12T09:00:00", session: "Morning", ticketNumber: 5, visitType: "Consultation", status: "Completed", paymentStatus: "Paid", source: "Booked", consultationId: "CON-005", invoiceId: "INV-2033" },
  { appointmentId: "APT-1009", patientId: "PAT-014", patientName: "Alexander Jackson", doctorId: "DOC-003", doctorName: "Dr. Yashfin Jhosof", doctorSpecialization: "Cardiology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-06-15T09:00:00", session: "Morning", ticketNumber: 6, visitType: "Follow-up", status: "Completed", paymentStatus: "Paid", source: "Booked", consultationId: "CON-006", invoiceId: "INV-2034" },
  { appointmentId: "APT-1011", patientId: "PAT-021", patientName: "Abraham Brakering", doctorId: "DOC-003", doctorName: "Dr. Yashfin Jhosof", doctorSpecialization: "Cardiology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-12-10T09:00:00", session: "Morning", ticketNumber: 7, visitType: "Consultation", status: "Completed", paymentStatus: "Paid", source: "Booked", consultationId: "CON-007", invoiceId: "INV-2035" },
  { appointmentId: "APT-1012", patientId: "PAT-021", patientName: "Abraham Brakering", doctorId: "DOC-002", doctorName: "Dr. Alan James", doctorSpecialization: "General Practice", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2025-12-19T09:00:00", session: "Morning", ticketNumber: 8, visitType: "General Checkup", status: "Completed", paymentStatus: "Paid", source: "Booked" },

  // ===== TODAY / UPCOMING =====
  { appointmentId: "APT-1013", patientId: "PAT-021", patientName: "Abraham Brakering", doctorId: "DOC-003", doctorName: "Dr. Yashfin Jhosof", doctorSpecialization: "Cardiology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-12-31T09:00:00", session: "Morning", ticketNumber: 9, visitType: "Video Consultation", status: "Confirmed", paymentStatus: "Paid", source: "Booked", notes: "Annual heart health review" },
  { appointmentId: "APT-1014", patientId: "PAT-001", patientName: "Michael Brown", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", doctorSpecialization: "Cardiology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-07-28T09:00:00", session: "Morning", ticketNumber: 1, visitType: "Follow-up", status: "Confirmed", paymentStatus: "Paid", source: "Booked" },
  { appointmentId: "APT-1015", patientId: "PAT-005", patientName: "Daniel Martinez", doctorId: "DOC-002", doctorName: "Dr. Alan James", doctorSpecialization: "General Practice", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-07-29T09:00:00", session: "Morning", ticketNumber: 2, visitType: "Consultation", status: "Confirmed", paymentStatus: "Unpaid", source: "Booked" },
  { appointmentId: "APT-1016", patientId: "PAT-002", patientName: "Emma Taylor", doctorId: "DOC-004", doctorName: "Dr. Toshid Khomsi", doctorSpecialization: "Dermatology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-07-30T14:00:00", session: "Afternoon", ticketNumber: 3, visitType: "General Checkup", status: "Confirmed", paymentStatus: "Unpaid", source: "Booked" },
  { appointmentId: "APT-1017", patientId: "PAT-006", patientName: "Sarah Johnson", doctorId: "DOC-011", doctorName: "Dr. Patricia Lee", doctorSpecialization: "General Practice", branchId: "BR-003", branchName: "Healthora South Bay", dateTime: "2026-07-31T09:00:00", session: "Morning", ticketNumber: 3, visitType: "New Patient", status: "Confirmed", paymentStatus: "Unpaid", source: "Booked" },
  { appointmentId: "APT-1018", patientId: "PAT-008", patientName: "James Wilson", doctorId: "DOC-014", doctorName: "Dr. Omar Hassan", doctorSpecialization: "Orthopedics", branchId: "BR-002", branchName: "Healthora Westside", dateTime: "2026-07-25T18:00:00", session: "Evening", ticketNumber: 2, visitType: "Consultation", status: "Checked-in", paymentStatus: "Unpaid", source: "Walk-in" },
  { appointmentId: "APT-1019", patientId: "PAT-007", patientName: "Maria Santos", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", doctorSpecialization: "Cardiology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-07-25T09:00:00", session: "Morning", ticketNumber: 4, visitType: "Follow-up", status: "Confirmed", paymentStatus: "Insurance", source: "Booked", consultationId: "CON-008" },
  { appointmentId: "APT-1020", patientId: "PAT-011", patientName: "Isabella Davis", doctorId: "DOC-013", doctorName: "Dr. Natasha Ivanova", doctorSpecialization: "Neurology", branchId: "BR-002", branchName: "Healthora Westside", dateTime: "2026-07-26T09:00:00", session: "Morning", ticketNumber: 5, visitType: "Consultation", status: "Confirmed", paymentStatus: "Unpaid", source: "Booked" },
  { appointmentId: "APT-1021", patientId: "PAT-013", patientName: "Mia White", doctorId: "DOC-010", doctorName: "Dr. Marcus Williams", doctorSpecialization: "Psychology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-07-26T14:00:00", session: "Afternoon", ticketNumber: 4, visitType: "Consultation", status: "Confirmed", paymentStatus: "Unpaid", source: "Booked" },
  { appointmentId: "APT-1022", patientId: "PAT-015", patientName: "Charlotte Harris", doctorId: "DOC-015", doctorName: "Dr. Elena Rossi", doctorSpecialization: "Pediatrics", branchId: "BR-003", branchName: "Healthora South Bay", dateTime: "2026-07-28T09:00:00", session: "Morning", ticketNumber: 6, visitType: "General Checkup", status: "Confirmed", paymentStatus: "Paid", source: "Booked" },
  { appointmentId: "APT-1023", patientId: "PAT-016", patientName: "Benjamin Lee", doctorId: "DOC-016", doctorName: "Dr. Andre Dupont", doctorSpecialization: "Gynecology", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-07-29T14:00:00", session: "Afternoon", ticketNumber: 5, visitType: "Consultation", status: "Pending", paymentStatus: "Unpaid", source: "Booked" },
  { appointmentId: "APT-1024", patientId: "PAT-017", patientName: "Amelia Clark", doctorId: "DOC-017", doctorName: "Dr. Mei Chen", doctorSpecialization: "General Practice", branchId: "BR-002", branchName: "Healthora Westside", dateTime: "2026-07-30T09:00:00", session: "Morning", ticketNumber: 7, visitType: "Follow-up", status: "Confirmed", paymentStatus: "Insurance", source: "Booked" },
  { appointmentId: "APT-1025", patientId: "PAT-019", patientName: "Harper Robinson", doctorId: "DOC-009", doctorName: "Dr. Rachel Park", doctorSpecialization: "Orthopedics", branchId: "BR-001", branchName: "Healthora Central", dateTime: "2026-08-01T09:00:00", session: "Morning", ticketNumber: 8, visitType: "Consultation", status: "Pending", paymentStatus: "Unpaid", source: "Booked" },
];
