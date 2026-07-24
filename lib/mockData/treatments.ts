export interface Treatment {
  treatmentId: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  treatmentName: string;
  category: "Laboratory" | "Radiology" | "Procedure" | "Therapy";
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
  status: "Ordered" | "In-Progress" | "Completed" | "Cancelled";
  orderedAt: string;
  performedAt?: string;
  performedBy?: string;
  resultFile?: string;
  branchId: string;
}

export const treatments: Treatment[] = [
  { treatmentId: "TRT-001", consultationId: "CON-001", patientId: "PAT-001", patientName: "Michael Brown", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", treatmentName: "ECG (12-lead)", category: "Procedure", description: "12-lead electrocardiogram", unitPrice: 90, quantity: 1, total: 90, status: "Completed", orderedAt: "2026-05-28T11:30:00", performedAt: "2026-05-28T12:00:00", performedBy: "EMP-002", branchId: "BR-001" },
  { treatmentId: "TRT-002", consultationId: "CON-001", patientId: "PAT-001", patientName: "Michael Brown", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", treatmentName: "Blood Panel", category: "Laboratory", description: "Full blood count + metabolic panel", unitPrice: 50, quantity: 1, total: 50, status: "Completed", orderedAt: "2026-05-28T11:35:00", performedAt: "2026-05-28T13:00:00", performedBy: "EMP-007", resultFile: "report_PAT-001_bloodpanel.pdf", branchId: "BR-001" },
  { treatmentId: "TRT-003", consultationId: "CON-002", patientId: "PAT-003", patientName: "Liam Anderson", doctorId: "DOC-008", doctorName: "Dr. James Clark", treatmentName: "Skin Biopsy", category: "Procedure", description: "Punch biopsy of atypical nevus, left forearm", unitPrice: 45, quantity: 1, total: 45, status: "Completed", orderedAt: "2026-06-01T17:45:00", performedAt: "2026-06-01T18:00:00", performedBy: "EMP-002", resultFile: "report_PAT-003_biopsy.pdf", branchId: "BR-003" },
  { treatmentId: "TRT-004", consultationId: "CON-003", patientId: "PAT-007", patientName: "Maria Santos", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", treatmentName: "Cardiac Stress Test", category: "Procedure", description: "Exercise treadmill stress test with ECG monitoring", unitPrice: 200, quantity: 1, total: 200, status: "Completed", orderedAt: "2026-06-03T10:15:00", performedAt: "2026-06-03T11:00:00", performedBy: "EMP-002", resultFile: "report_PAT-007_stress_test.pdf", branchId: "BR-001" },
  { treatmentId: "TRT-005", consultationId: "CON-003", patientId: "PAT-007", patientName: "Maria Santos", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", treatmentName: "Chest X-Ray", category: "Radiology", description: "PA and lateral chest radiograph", unitPrice: 70, quantity: 1, total: 70, status: "Completed", orderedAt: "2026-06-03T10:20:00", performedAt: "2026-06-03T10:45:00", performedBy: "EMP-004", resultFile: "report_PAT-007_cxr.pdf", branchId: "BR-001" },
  { treatmentId: "TRT-006", consultationId: "CON-004", patientId: "PAT-010", patientName: "Noah Garcia", doctorId: "DOC-002", doctorName: "Dr. Alan James", treatmentName: "Urinalysis", category: "Laboratory", description: "Routine urinalysis with microscopy", unitPrice: 30, quantity: 1, total: 30, status: "Completed", orderedAt: "2026-06-08T14:15:00", performedAt: "2026-06-08T14:30:00", performedBy: "EMP-007", resultFile: "report_PAT-010_ua.pdf", branchId: "BR-001" },
  { treatmentId: "TRT-007", consultationId: "CON-005", patientId: "PAT-012", patientName: "Ethan Moore", doctorId: "DOC-009", doctorName: "Dr. Rachel Park", treatmentName: "Knee X-Ray (Bilateral)", category: "Radiology", description: "Weight-bearing AP and lateral views both knees", unitPrice: 55, quantity: 2, total: 110, status: "Completed", orderedAt: "2026-06-12T09:15:00", performedAt: "2026-06-12T09:45:00", performedBy: "EMP-004", resultFile: "report_PAT-012_knee_xray.pdf", branchId: "BR-001" },
  { treatmentId: "TRT-008", consultationId: "CON-005", patientId: "PAT-012", patientName: "Ethan Moore", doctorId: "DOC-009", doctorName: "Dr. Rachel Park", treatmentName: "Physiotherapy Session", category: "Therapy", description: "Initial physiotherapy assessment + treatment", unitPrice: 80, quantity: 1, total: 80, status: "Completed", orderedAt: "2026-06-12T09:20:00", performedAt: "2026-06-12T14:00:00", performedBy: "EMP-005", branchId: "BR-001" },
  { treatmentId: "TRT-009", consultationId: "CON-006", patientId: "PAT-014", patientName: "Alexander Jackson", doctorId: "DOC-003", doctorName: "Dr. Yashfin Jhosof", treatmentName: "Echocardiogram", category: "Procedure", description: "Transthoracic 2D echocardiography with Doppler", unitPrice: 250, quantity: 1, total: 250, status: "Completed", orderedAt: "2026-06-15T11:45:00", performedAt: "2026-06-15T13:00:00", performedBy: "EMP-002", resultFile: "report_PAT-014_echo.pdf", branchId: "BR-001" },
  // Pending lab orders — visible in Lab Tech queue
  { treatmentId: "TRT-010", consultationId: "CON-010", patientId: "PAT-005", patientName: "Daniel Martinez", doctorId: "DOC-005", doctorName: "Dr. Emily Carter", treatmentName: "Brain MRI (Contrast)", category: "Radiology", description: "MRI brain with gadolinium contrast for migraine work-up", unitPrice: 800, quantity: 1, total: 800, status: "Ordered", orderedAt: "2026-06-05T10:30:00", branchId: "BR-002" },
  { treatmentId: "TRT-011", consultationId: "CON-008", patientId: "PAT-007", patientName: "Maria Santos", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", treatmentName: "HbA1c Blood Test", category: "Laboratory", description: "Glycated hemoglobin for diabetes monitoring", unitPrice: 45, quantity: 1, total: 45, status: "Ordered", orderedAt: "2026-07-25T10:30:00", branchId: "BR-001" },
  { treatmentId: "TRT-012", consultationId: "CON-008", patientId: "PAT-007", patientName: "Maria Santos", doctorId: "DOC-001", doctorName: "Dr. Sarah Mitchell", treatmentName: "Lipid Panel", category: "Laboratory", description: "Total cholesterol, LDL, HDL, triglycerides", unitPrice: 60, quantity: 1, total: 60, status: "Ordered", orderedAt: "2026-07-25T10:35:00", branchId: "BR-001" },
];

export interface TreatmentCatalogueItem {
  catalogueId: string;
  name: string;
  category: "Laboratory" | "Radiology" | "Procedure" | "Therapy";
  description: string;
  unitPrice: number;
}

export const treatmentCatalogue: TreatmentCatalogueItem[] = [
  { catalogueId: "CAT-001", name: "ECG (12-lead)", category: "Procedure", description: "Standard 12-lead electrocardiogram", unitPrice: 90 },
  { catalogueId: "CAT-002", name: "Blood Panel (Full)", category: "Laboratory", description: "CBC + Comprehensive metabolic panel", unitPrice: 50 },
  { catalogueId: "CAT-003", name: "Chest X-Ray", category: "Radiology", description: "PA and lateral chest radiograph", unitPrice: 70 },
  { catalogueId: "CAT-004", name: "Echocardiogram", category: "Procedure", description: "2D echo with Doppler", unitPrice: 250 },
  { catalogueId: "CAT-005", name: "Cardiac Stress Test", category: "Procedure", description: "Treadmill stress test with ECG", unitPrice: 200 },
  { catalogueId: "CAT-006", name: "MRI Brain (Contrast)", category: "Radiology", description: "Brain MRI with gadolinium", unitPrice: 800 },
  { catalogueId: "CAT-007", name: "HbA1c", category: "Laboratory", description: "Glycated hemoglobin test", unitPrice: 45 },
  { catalogueId: "CAT-008", name: "Lipid Panel", category: "Laboratory", description: "Cholesterol + triglycerides", unitPrice: 60 },
  { catalogueId: "CAT-009", name: "Urinalysis", category: "Laboratory", description: "Routine urinalysis with microscopy", unitPrice: 30 },
  { catalogueId: "CAT-010", name: "Knee X-Ray", category: "Radiology", description: "Weight-bearing AP + lateral", unitPrice: 55 },
  { catalogueId: "CAT-011", name: "Physiotherapy Session", category: "Therapy", description: "Assessment + treatment session", unitPrice: 80 },
  { catalogueId: "CAT-012", name: "Skin Biopsy", category: "Procedure", description: "Punch biopsy with pathology", unitPrice: 45 },
  { catalogueId: "CAT-013", name: "EEG", category: "Procedure", description: "Electroencephalogram", unitPrice: 70 },
  { catalogueId: "CAT-014", name: "Blood Pressure Monitoring", category: "Procedure", description: "24-hour ABPM", unitPrice: 50 },
  { catalogueId: "CAT-015", name: "Pulmonary Function Test", category: "Procedure", description: "Spirometry + flow-volume loop", unitPrice: 120 },
];
