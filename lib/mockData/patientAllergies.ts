export interface PatientAllergy {
  allergyId: string;
  patientId: string;
  allergenName: string;
  severity: "Mild" | "Moderate" | "Severe" | "Life-threatening";
  reaction: string;
  diagnosedDate: string;
}

// === SEED: PAT-007 Maria Santos has PENICILLIN allergy — Severe ===
// This triggers ContraindicationBanner when Amoxicillin (a penicillin-class drug) is prescribed
export const patientAllergies: PatientAllergy[] = [
  { allergyId: "ALG-001", patientId: "PAT-007", allergenName: "Penicillin", severity: "Severe", reaction: "Anaphylaxis, severe rash, throat swelling", diagnosedDate: "2018-03-10" },
  { allergyId: "ALG-002", patientId: "PAT-007", allergenName: "Latex", severity: "Moderate", reaction: "Contact dermatitis, hives", diagnosedDate: "2020-06-15" },
  { allergyId: "ALG-003", patientId: "PAT-001", allergenName: "Sulfonamides", severity: "Moderate", reaction: "Rash, fever, photosensitivity", diagnosedDate: "2019-08-20" },
  { allergyId: "ALG-004", patientId: "PAT-003", allergenName: "Aspirin", severity: "Mild", reaction: "Stomach upset, mild rash", diagnosedDate: "2021-02-14" },
  { allergyId: "ALG-005", patientId: "PAT-005", allergenName: "Codeine", severity: "Moderate", reaction: "Nausea, vomiting, respiratory depression", diagnosedDate: "2015-11-30" },
  { allergyId: "ALG-006", patientId: "PAT-010", allergenName: "Ibuprofen", severity: "Mild", reaction: "Gastrointestinal bleeding, stomach cramps", diagnosedDate: "2022-04-05" },
  { allergyId: "ALG-007", patientId: "PAT-012", allergenName: "Shellfish", severity: "Severe", reaction: "Anaphylaxis, urticaria, vomiting", diagnosedDate: "2010-07-22" },
  { allergyId: "ALG-008", patientId: "PAT-014", allergenName: "Peanuts", severity: "Life-threatening", reaction: "Severe anaphylaxis, requires EpiPen", diagnosedDate: "2005-01-10" },
  { allergyId: "ALG-009", patientId: "PAT-017", allergenName: "Metformin", severity: "Mild", reaction: "Gastrointestinal distress, diarrhea", diagnosedDate: "2023-03-18" },
  { allergyId: "ALG-010", patientId: "PAT-021", allergenName: "Contrast Dye", severity: "Moderate", reaction: "Skin flushing, nausea, mild hypotension", diagnosedDate: "2022-12-01" },
];
