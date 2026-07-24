export interface Medication {
  medicationId: string;
  genericName: string;
  brandName: string;
  form: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Inhaler" | "Cream" | "Drops";
  strength: string;
  manufacturer: string;
  contraindications: string;
  sideEffects: string;
  category: string;
}

// === SEED: MED-001 Amoxicillin is Penicillin-class — conflicts with PAT-007's Penicillin allergy ===
export const medications: Medication[] = [
  { medicationId: "MED-001", genericName: "Amoxicillin", brandName: "Amoxil", form: "Capsule", strength: "500mg", manufacturer: "GSK", contraindications: "Penicillin allergy, beta-lactam hypersensitivity, mononucleosis", sideEffects: "Rash, diarrhea, nausea, vomiting", category: "Antibiotic" },
  { medicationId: "MED-002", genericName: "Metformin", brandName: "Glucophage", form: "Tablet", strength: "500mg", manufacturer: "Bristol-Myers Squibb", contraindications: "Renal impairment (eGFR <30), lactic acidosis risk, iodinated contrast", sideEffects: "GI upset, lactic acidosis (rare), B12 deficiency", category: "Antidiabetic" },
  { medicationId: "MED-003", genericName: "Lisinopril", brandName: "Zestril", form: "Tablet", strength: "10mg", manufacturer: "Astra Zeneca", contraindications: "Pregnancy, angioedema history, ACE inhibitor hypersensitivity", sideEffects: "Dry cough, dizziness, hyperkalemia", category: "ACE Inhibitor" },
  { medicationId: "MED-004", genericName: "Atorvastatin", brandName: "Lipitor", form: "Tablet", strength: "40mg", manufacturer: "Pfizer", contraindications: "Active liver disease, pregnancy, myopathy", sideEffects: "Muscle pain, liver enzyme elevation, GI upset", category: "Statin" },
  { medicationId: "MED-005", genericName: "Salbutamol", brandName: "Ventolin", form: "Inhaler", strength: "100mcg/dose", manufacturer: "GSK", contraindications: "Tachyarrhythmia, hypertrophic cardiomyopathy", sideEffects: "Tremor, tachycardia, headache, hypokalemia", category: "Bronchodilator" },
  { medicationId: "MED-006", genericName: "Omeprazole", brandName: "Prilosec", form: "Capsule", strength: "20mg", manufacturer: "AstraZeneca", contraindications: "Hypersensitivity to PPIs, rilpivirine use", sideEffects: "Headache, diarrhea, nausea, B12 deficiency", category: "PPI" },
  { medicationId: "MED-007", genericName: "Sertraline", brandName: "Zoloft", form: "Tablet", strength: "50mg", manufacturer: "Pfizer", contraindications: "MAO inhibitor use, pimozide, disulfiram", sideEffects: "Nausea, insomnia, sexual dysfunction, dry mouth", category: "SSRI" },
  { medicationId: "MED-008", genericName: "Amlodipine", brandName: "Norvasc", form: "Tablet", strength: "5mg", manufacturer: "Pfizer", contraindications: "Severe aortic stenosis, cardiogenic shock", sideEffects: "Edema, flushing, dizziness, fatigue", category: "Calcium Channel Blocker" },
  { medicationId: "MED-009", genericName: "Warfarin", brandName: "Coumadin", form: "Tablet", strength: "5mg", manufacturer: "Bristol-Myers Squibb", contraindications: "Active bleeding, pregnancy, recent surgery, peptic ulcer", sideEffects: "Bleeding risk, bruising, alopecia", category: "Anticoagulant" },
  { medicationId: "MED-010", genericName: "Ibuprofen", brandName: "Advil", form: "Tablet", strength: "400mg", manufacturer: "Pfizer", contraindications: "Peptic ulcer, renal failure, NSAID allergy, third trimester pregnancy", sideEffects: "GI upset, edema, hypertension, renal impairment", category: "NSAID" },
  { medicationId: "MED-011", genericName: "Levothyroxine", brandName: "Synthroid", form: "Tablet", strength: "50mcg", manufacturer: "AbbVie", contraindications: "Uncorrected adrenal insufficiency, thyrotoxicosis", sideEffects: "Palpitations, insomnia, heat intolerance, weight loss", category: "Thyroid Hormone" },
  { medicationId: "MED-012", genericName: "Prednisolone", brandName: "Prelone", form: "Tablet", strength: "5mg", manufacturer: "Pfizer", contraindications: "Systemic fungal infection, live vaccines, viral illness", sideEffects: "Weight gain, hyperglycemia, osteoporosis, mood changes", category: "Corticosteroid" },
  { medicationId: "MED-013", genericName: "Ciprofloxacin", brandName: "Cipro", form: "Tablet", strength: "500mg", manufacturer: "Bayer", contraindications: "Quinolone hypersensitivity, myasthenia gravis, tendon disorders", sideEffects: "Tendinopathy, CNS effects, QT prolongation", category: "Antibiotic" },
  { medicationId: "MED-014", genericName: "Paracetamol", brandName: "Tylenol", form: "Tablet", strength: "500mg", manufacturer: "Johnson & Johnson", contraindications: "Severe hepatic impairment, G6PD deficiency", sideEffects: "Hepatotoxicity in overdose, rare hypersensitivity", category: "Analgesic" },
  { medicationId: "MED-015", genericName: "Diazepam", brandName: "Valium", form: "Tablet", strength: "5mg", manufacturer: "Roche", contraindications: "Myasthenia gravis, acute angle glaucoma, severe respiratory depression", sideEffects: "Sedation, dependence, paradoxical excitement", category: "Benzodiazepine" },
];

export interface MedicationStock {
  stockId: string;
  medicationId: string;
  medicationName: string;
  branchId: string;
  quantityOnHand: number;
  reorderLevel: number;
  lastRestocked: string;
  expiryDate: string;
}

// === SEED: MED-001 Amoxicillin stock is LOW (5 units, reorderLevel 20) ===
export const medicationStock: MedicationStock[] = [
  { stockId: "STK-001", medicationId: "MED-001", medicationName: "Amoxicillin 500mg", branchId: "BR-001", quantityOnHand: 5, reorderLevel: 20, lastRestocked: "2026-06-10", expiryDate: "2027-06-10" },
  { stockId: "STK-002", medicationId: "MED-002", medicationName: "Metformin 500mg", branchId: "BR-001", quantityOnHand: 150, reorderLevel: 50, lastRestocked: "2026-07-01", expiryDate: "2027-07-01" },
  { stockId: "STK-003", medicationId: "MED-003", medicationName: "Lisinopril 10mg", branchId: "BR-001", quantityOnHand: 90, reorderLevel: 30, lastRestocked: "2026-07-05", expiryDate: "2027-05-15" },
  { stockId: "STK-004", medicationId: "MED-004", medicationName: "Atorvastatin 40mg", branchId: "BR-001", quantityOnHand: 200, reorderLevel: 40, lastRestocked: "2026-06-20", expiryDate: "2027-06-20" },
  { stockId: "STK-005", medicationId: "MED-005", medicationName: "Salbutamol Inhaler", branchId: "BR-001", quantityOnHand: 30, reorderLevel: 15, lastRestocked: "2026-07-10", expiryDate: "2027-07-10" },
  { stockId: "STK-006", medicationId: "MED-006", medicationName: "Omeprazole 20mg", branchId: "BR-001", quantityOnHand: 180, reorderLevel: 50, lastRestocked: "2026-07-01", expiryDate: "2027-01-01" },
  { stockId: "STK-007", medicationId: "MED-007", medicationName: "Sertraline 50mg", branchId: "BR-001", quantityOnHand: 12, reorderLevel: 25, lastRestocked: "2026-05-28", expiryDate: "2027-05-28" },
  { stockId: "STK-008", medicationId: "MED-008", medicationName: "Amlodipine 5mg", branchId: "BR-001", quantityOnHand: 120, reorderLevel: 40, lastRestocked: "2026-06-15", expiryDate: "2027-06-15" },
  { stockId: "STK-009", medicationId: "MED-009", medicationName: "Warfarin 5mg", branchId: "BR-002", quantityOnHand: 60, reorderLevel: 25, lastRestocked: "2026-07-02", expiryDate: "2027-02-10" },
  { stockId: "STK-010", medicationId: "MED-010", medicationName: "Ibuprofen 400mg", branchId: "BR-002", quantityOnHand: 300, reorderLevel: 100, lastRestocked: "2026-07-08", expiryDate: "2027-08-01" },
  { stockId: "STK-011", medicationId: "MED-011", medicationName: "Levothyroxine 50mcg", branchId: "BR-002", quantityOnHand: 80, reorderLevel: 30, lastRestocked: "2026-06-25", expiryDate: "2027-04-20" },
  { stockId: "STK-012", medicationId: "MED-012", medicationName: "Prednisolone 5mg", branchId: "BR-003", quantityOnHand: 45, reorderLevel: 30, lastRestocked: "2026-07-12", expiryDate: "2026-12-31" },
  { stockId: "STK-013", medicationId: "MED-013", medicationName: "Ciprofloxacin 500mg", branchId: "BR-003", quantityOnHand: 8, reorderLevel: 20, lastRestocked: "2026-06-01", expiryDate: "2027-06-01" },
  { stockId: "STK-014", medicationId: "MED-014", medicationName: "Paracetamol 500mg", branchId: "BR-001", quantityOnHand: 500, reorderLevel: 200, lastRestocked: "2026-07-15", expiryDate: "2028-01-01" },
  { stockId: "STK-015", medicationId: "MED-015", medicationName: "Diazepam 5mg", branchId: "BR-001", quantityOnHand: 40, reorderLevel: 15, lastRestocked: "2026-07-10", expiryDate: "2027-09-30" },
];
