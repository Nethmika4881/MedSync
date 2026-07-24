export interface Condition {
  conditionId: string;
  name: string;
  category: string;
}

export const conditions: Condition[] = [
  { conditionId: "COND-001", name: "Type 2 Diabetes", category: "Endocrine" },
  { conditionId: "COND-002", name: "Hypertension", category: "Cardiovascular" },
  { conditionId: "COND-003", name: "Asthma", category: "Respiratory" },
  { conditionId: "COND-004", name: "Coronary Artery Disease", category: "Cardiovascular" },
  { conditionId: "COND-005", name: "Chronic Kidney Disease", category: "Renal" },
  { conditionId: "COND-006", name: "Depression", category: "Mental Health" },
  { conditionId: "COND-007", name: "Anxiety Disorder", category: "Mental Health" },
  { conditionId: "COND-008", name: "Hypothyroidism", category: "Endocrine" },
  { conditionId: "COND-009", name: "Osteoarthritis", category: "Musculoskeletal" },
  { conditionId: "COND-010", name: "GERD", category: "Gastrointestinal" },
  { conditionId: "COND-011", name: "Migraine", category: "Neurological" },
  { conditionId: "COND-012", name: "Atrial Fibrillation", category: "Cardiovascular" },
];

export interface PatientCondition {
  pcId: string;
  patientId: string;
  conditionId: string;
  conditionName: string;
  status: "Active" | "Managed" | "Resolved";
  diagnosedDate: string;
  notes: string;
}

export const patientConditions: PatientCondition[] = [
  { pcId: "PC-001", patientId: "PAT-007", conditionId: "COND-001", conditionName: "Type 2 Diabetes", status: "Active", diagnosedDate: "2016-05-12", notes: "On Metformin 500mg twice daily. HbA1c: 7.2%" },
  { pcId: "PC-002", patientId: "PAT-007", conditionId: "COND-002", conditionName: "Hypertension", status: "Managed", diagnosedDate: "2018-09-03", notes: "Controlled on Lisinopril 10mg daily. BP avg: 128/82" },
  { pcId: "PC-003", patientId: "PAT-001", conditionId: "COND-002", conditionName: "Hypertension", status: "Active", diagnosedDate: "2020-03-15", notes: "Recent BP: 145/90, adjusting medication" },
  { pcId: "PC-004", patientId: "PAT-003", conditionId: "COND-004", conditionName: "Coronary Artery Disease", status: "Active", diagnosedDate: "2019-11-20", notes: "Post-CABG, on aspirin + statin therapy" },
  { pcId: "PC-005", patientId: "PAT-005", conditionId: "COND-001", conditionName: "Type 2 Diabetes", status: "Active", diagnosedDate: "2010-06-08", notes: "Long-standing DM2, on insulin therapy" },
  { pcId: "PC-006", patientId: "PAT-010", conditionId: "COND-003", conditionName: "Asthma", status: "Managed", diagnosedDate: "2014-08-22", notes: "Using Ventolin PRN, well-controlled" },
  { pcId: "PC-007", patientId: "PAT-012", conditionId: "COND-009", conditionName: "Osteoarthritis", status: "Active", diagnosedDate: "2021-02-10", notes: "Bilateral knee OA, physiotherapy ongoing" },
  { pcId: "PC-008", patientId: "PAT-014", conditionId: "COND-012", conditionName: "Atrial Fibrillation", status: "Active", diagnosedDate: "2018-04-30", notes: "Paroxysmal AFib, on anticoagulation" },
  { pcId: "PC-009", patientId: "PAT-020", conditionId: "COND-006", conditionName: "Depression", status: "Managed", diagnosedDate: "2020-01-14", notes: "On SSRIs, regular therapy sessions" },
  { pcId: "PC-010", patientId: "PAT-021", conditionId: "COND-007", conditionName: "Anxiety Disorder", status: "Managed", diagnosedDate: "2022-06-20", notes: "Managed with CBT and occasional Lorazepam" },
];
