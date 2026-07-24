export interface ConsultationRecord {
  consultationId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: string;
  treatmentIds: string[];
  prescriptionIds: string[];
}

export const consultationRecords: ConsultationRecord[] = [
  { consultationId: "CON-001", appointmentId: "APT-1001", patientId: "PAT-001", patientName: "Michael Brown", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", date: "2026-05-28", symptoms: "Chest pain on exertion, shortness of breath, mild fatigue", diagnosis: "Stable angina pectoris. ECG showed ST changes consistent with ischemia.", notes: "Patient advised to reduce salt intake, increase walking. Follow up in 4 weeks.", followUpRequired: true, followUpDate: "2026-07-28", treatmentIds: ["TRT-001", "TRT-002"], prescriptionIds: ["PRESC-001", "PRESC-002"] },
  { consultationId: "CON-002", appointmentId: "APT-1005", patientId: "PAT-003", patientName: "Liam Anderson", doctorId: "DOC-008", doctorName: "Dr. James Clark", date: "2026-06-01", symptoms: "Suspicious mole on left forearm, itching, slight color change", diagnosis: "Atypical melanocytic nevus — biopsy ordered", notes: "Biopsy sent to pathology. Results in 1 week.", followUpRequired: true, followUpDate: "2026-06-15", treatmentIds: ["TRT-003"], prescriptionIds: [] },
  { consultationId: "CON-003", appointmentId: "APT-1006", patientId: "PAT-007", patientName: "Maria Santos", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", date: "2026-06-03", symptoms: "Exertional chest tightness, palpitations, mild dyspnea", diagnosis: "Worsening angina symptoms. Stress test ordered.", notes: "Patient has Penicillin allergy (Severe) — documented. Avoid beta-lactam antibiotics.", followUpRequired: true, followUpDate: "2026-07-25", treatmentIds: ["TRT-004", "TRT-005"], prescriptionIds: ["PRESC-003"] },
  { consultationId: "CON-004", appointmentId: "APT-1007", patientId: "PAT-010", patientName: "Noah Garcia", doctorId: "DOC-002", doctorName: "Dr. Alan James", date: "2026-06-08", symptoms: "Wheezing, mild cough, seasonal symptoms", diagnosis: "Mild persistent asthma exacerbation", notes: "Salbutamol inhaler prescribed for PRN use. Spirometry next visit.", followUpRequired: false, treatmentIds: ["TRT-006"], prescriptionIds: ["PRESC-004"] },
  { consultationId: "CON-005", appointmentId: "APT-1008", patientId: "PAT-012", patientName: "Ethan Moore", doctorId: "DOC-009", doctorName: "Dr. Rachel Park", date: "2026-06-12", symptoms: "Bilateral knee pain, stiffness in morning, difficulty descending stairs", diagnosis: "Grade 2 bilateral knee osteoarthritis. X-ray confirms joint space narrowing.", notes: "Referred to physiotherapy. NSAIDs if tolerated. Consider joint injection if no improvement.", followUpRequired: true, followUpDate: "2026-08-12", treatmentIds: ["TRT-007", "TRT-008"], prescriptionIds: ["PRESC-005"] },
  { consultationId: "CON-006", appointmentId: "APT-1009", patientId: "PAT-014", patientName: "Alexander Jackson", doctorId: "DOC-003", doctorName: "Dr. Yashfin Jhosof", date: "2026-06-15", symptoms: "Irregular heartbeat, occasional dizziness, fatigue", diagnosis: "Paroxysmal atrial fibrillation confirmed on Holter monitor", notes: "Rate control achieved. Anticoagulation with Warfarin initiated. Monthly INR monitoring.", followUpRequired: true, followUpDate: "2026-07-15", treatmentIds: ["TRT-009"], prescriptionIds: ["PRESC-006", "PRESC-007"] },
  { consultationId: "CON-007", appointmentId: "APT-1011", patientId: "PAT-021", patientName: "Abraham Brakering", doctorId: "DOC-003", doctorName: "Dr. Yashfin Jhosof", date: "2025-12-10", symptoms: "Routine cardiac review, mild hypertension concern", diagnosis: "Well-controlled hypertension. Cardiac function normal.", notes: "Continue Amlodipine 5mg. Diet and lifestyle counseling provided.", followUpRequired: true, followUpDate: "2026-12-31", treatmentIds: [], prescriptionIds: ["PRESC-008"] },
  { consultationId: "CON-010", appointmentId: "APT-1010", patientId: "PAT-005", patientName: "Daniel Martinez", doctorId: "DOC-005", doctorName: "Dr. Emily Carter", date: "2026-06-05", symptoms: "Persistent headaches, occasional visual aura, memory issues", diagnosis: "Migraine with aura, likely related to stress and sleep deprivation", notes: "Lifestyle changes recommended. Sumatriptan for acute attacks. Follow-up MRI if persists.", followUpRequired: true, followUpDate: "2026-09-05", treatmentIds: ["TRT-010"], prescriptionIds: ["PRESC-009"] },
];

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

export const prescriptionItems: PrescriptionItem[] = [
  { prescriptionId: "PRESC-001", consultationId: "CON-001", patientId: "PAT-001", patientName: "Michael Brown", doctorId: "DOC-001", medicationId: "MED-004", medicationName: "Atorvastatin 40mg", dosage: "40mg", frequency: "Once daily at night", duration: "90 days", instructions: "Take with or without food at bedtime", dispensed: true, dispensedAt: "2026-05-28T14:00:00", dispensedBy: "EMP-003", pickedUp: true, issuedDate: "2026-05-28" },
  { prescriptionId: "PRESC-002", consultationId: "CON-001", patientId: "PAT-001", patientName: "Michael Brown", doctorId: "DOC-001", medicationId: "MED-008", medicationName: "Amlodipine 5mg", dosage: "5mg", frequency: "Once daily", duration: "90 days", instructions: "Take in the morning with water", dispensed: true, dispensedAt: "2026-05-28T14:05:00", dispensedBy: "EMP-003", pickedUp: true, issuedDate: "2026-05-28" },
  { prescriptionId: "PRESC-003", consultationId: "CON-003", patientId: "PAT-007", patientName: "Maria Santos", doctorId: "DOC-001", medicationId: "MED-003", medicationName: "Lisinopril 10mg", dosage: "10mg", frequency: "Once daily", duration: "60 days", instructions: "Take in morning. Monitor blood pressure.", dispensed: false, pickedUp: false, issuedDate: "2026-06-03" },
  { prescriptionId: "PRESC-004", consultationId: "CON-004", patientId: "PAT-010", patientName: "Noah Garcia", doctorId: "DOC-002", medicationId: "MED-005", medicationName: "Salbutamol Inhaler", dosage: "100mcg/dose", frequency: "As needed", duration: "6 months", instructions: "Shake before use. 1-2 puffs when wheezing. Max 4 times/day.", dispensed: true, dispensedAt: "2026-06-08T16:30:00", dispensedBy: "EMP-003", pickedUp: true, issuedDate: "2026-06-08" },
  { prescriptionId: "PRESC-005", consultationId: "CON-005", patientId: "PAT-012", patientName: "Ethan Moore", doctorId: "DOC-009", medicationId: "MED-010", medicationName: "Ibuprofen 400mg", dosage: "400mg", frequency: "3 times daily with food", duration: "14 days", instructions: "Take with meals. Stop if GI upset occurs.", dispensed: false, pickedUp: false, issuedDate: "2026-06-12" },
  { prescriptionId: "PRESC-006", consultationId: "CON-006", patientId: "PAT-014", patientName: "Alexander Jackson", doctorId: "DOC-003", medicationId: "MED-009", medicationName: "Warfarin 5mg", dosage: "5mg", frequency: "Once daily", duration: "Ongoing", instructions: "Take at same time daily. Monthly INR check required.", dispensed: true, dispensedAt: "2026-06-15T15:00:00", dispensedBy: "EMP-008", pickedUp: true, issuedDate: "2026-06-15" },
  { prescriptionId: "PRESC-007", consultationId: "CON-006", patientId: "PAT-014", patientName: "Alexander Jackson", doctorId: "DOC-003", medicationId: "MED-008", medicationName: "Amlodipine 5mg", dosage: "5mg", frequency: "Once daily", duration: "Ongoing", instructions: "Rate control for AFib. Report palpitations.", dispensed: true, dispensedAt: "2026-06-15T15:05:00", dispensedBy: "EMP-008", pickedUp: true, issuedDate: "2026-06-15" },
  { prescriptionId: "PRESC-008", consultationId: "CON-007", patientId: "PAT-021", patientName: "Abraham Brakering", doctorId: "DOC-003", medicationId: "MED-008", medicationName: "Amlodipine 5mg", dosage: "5mg", frequency: "Once daily", duration: "Ongoing", instructions: "Continue as before. Monitor BP weekly.", dispensed: true, dispensedAt: "2025-12-10T12:00:00", dispensedBy: "EMP-003", pickedUp: true, issuedDate: "2025-12-10" },
  { prescriptionId: "PRESC-009", consultationId: "CON-010", patientId: "PAT-005", patientName: "Daniel Martinez", doctorId: "DOC-005", medicationId: "MED-014", medicationName: "Paracetamol 500mg", dosage: "500-1000mg", frequency: "Every 6 hours PRN", duration: "30 days", instructions: "For acute migraine. Max 4g daily. Avoid alcohol.", dispensed: false, pickedUp: false, issuedDate: "2026-06-05" },
];
