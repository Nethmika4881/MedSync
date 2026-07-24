export type ClaimStatus =
  | "Submitted"
  | "UnderReview"
  | "Approved"
  | "PartiallyApproved"
  | "Rejected"
  | "Settled";

export interface Claim {
  claimId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  insuranceId: string;
  policyNumber: string;
  submittedDate: string;
  claimedAmount: number;
  approvedAmount: number;
  status: ClaimStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  notes: string;
  items: ClaimItem[];
}

export interface ClaimItem {
  itemId: string;
  claimId: string;
  description: string;
  claimedAmount: number;
  approvedAmount: number;
  status: "Approved" | "Rejected" | "Pending";
  reason?: string;
}

// === SEED: CLM-0042 is REJECTED with claimItem breakdown ===
export const claims: Claim[] = [
  {
    claimId: "CLM-0038",
    invoiceId: "INV-2028",
    patientId: "PAT-001",
    patientName: "Michael Brown",
    providerId: "PROV-001",
    providerName: "BlueCross BlueShield",
    insuranceId: "INS-001",
    policyNumber: "BCBS-00100192",
    submittedDate: "2026-05-29",
    claimedAmount: 320,
    approvedAmount: 256,
    status: "Settled",
    reviewedBy: "Claims Dept",
    reviewedDate: "2026-06-02",
    notes: "Approved at 80% coverage per Premium Plus policy",
    items: [
      { itemId: "CI-001", claimId: "CLM-0038", description: "Cardiology Consultation", claimedAmount: 180, approvedAmount: 144, status: "Approved" },
      { itemId: "CI-002", claimId: "CLM-0038", description: "ECG", claimedAmount: 90, approvedAmount: 72, status: "Approved" },
      { itemId: "CI-003", claimId: "CLM-0038", description: "Blood Panel", claimedAmount: 50, approvedAmount: 40, status: "Approved" },
    ],
  },
  {
    claimId: "CLM-0039",
    invoiceId: "INV-2034",
    patientId: "PAT-014",
    patientName: "Alexander Jackson",
    providerId: "PROV-001",
    providerName: "BlueCross BlueShield",
    insuranceId: "INS-007",
    policyNumber: "BCBS-01400299",
    submittedDate: "2026-06-16",
    claimedAmount: 500,
    approvedAmount: 400,
    status: "Approved",
    reviewedBy: "Claims Dept",
    reviewedDate: "2026-06-20",
    notes: "Discount excluded from claim",
    items: [
      { itemId: "CI-004", claimId: "CLM-0039", description: "Cardiology Consultation", claimedAmount: 200, approvedAmount: 200, status: "Approved" },
      { itemId: "CI-005", claimId: "CLM-0039", description: "Echocardiogram", claimedAmount: 250, approvedAmount: 200, status: "Approved", reason: "Capped per benefit schedule" },
      { itemId: "CI-006", claimId: "CLM-0039", description: "Blood Panel (Cardiac)", claimedAmount: 90, approvedAmount: 0, status: "Rejected", reason: "Lab already billed separately" },
    ],
  },
  {
    claimId: "CLM-0040",
    invoiceId: "INV-2031",
    patientId: "PAT-007",
    patientName: "Maria Santos",
    providerId: "PROV-001",
    providerName: "BlueCross BlueShield",
    insuranceId: "INS-004",
    policyNumber: "BCBS-00700445",
    submittedDate: "2026-06-04",
    claimedAmount: 450,
    approvedAmount: 200,
    status: "UnderReview",
    notes: "Annual limit nearly exhausted, under manual review",
    items: [
      { itemId: "CI-007", claimId: "CLM-0040", description: "Cardiology Consultation", claimedAmount: 180, approvedAmount: 0, status: "Pending" },
      { itemId: "CI-008", claimId: "CLM-0040", description: "Stress Test", claimedAmount: 200, approvedAmount: 0, status: "Pending" },
      { itemId: "CI-009", claimId: "CLM-0040", description: "Chest X-Ray", claimedAmount: 70, approvedAmount: 0, status: "Pending" },
    ],
  },
  // === SEED: CLM-0042 — REJECTED with claimItem breakdown ===
  {
    claimId: "CLM-0042",
    invoiceId: "INV-2033",
    patientId: "PAT-012",
    patientName: "Ethan Moore",
    providerId: "PROV-002",
    providerName: "Aetna Health",
    insuranceId: "INS-006",
    policyNumber: "AET-01200118",
    submittedDate: "2026-06-13",
    claimedAmount: 380,
    approvedAmount: 0,
    status: "Rejected",
    rejectionReason: "Pre-authorization not obtained for elective orthopedic procedure. Physiotherapy requires GP referral per policy terms.",
    reviewedBy: "Aetna Claims Review",
    reviewedDate: "2026-06-18",
    notes: "Claim rejected — pre-auth required for orthopedic surgery and physiotherapy",
    items: [
      { itemId: "CI-010", claimId: "CLM-0042", description: "Orthopedics Consultation", claimedAmount: 190, approvedAmount: 0, status: "Rejected", reason: "Pre-authorization not obtained" },
      { itemId: "CI-011", claimId: "CLM-0042", description: "Knee X-Ray (Bilateral)", claimedAmount: 110, approvedAmount: 0, status: "Rejected", reason: "Must follow approved referral pathway" },
      { itemId: "CI-012", claimId: "CLM-0042", description: "Physiotherapy Session", claimedAmount: 80, approvedAmount: 0, status: "Rejected", reason: "GP referral required per Aetna policy terms" },
    ],
  },
  {
    claimId: "CLM-0043",
    invoiceId: "INV-2030",
    patientId: "PAT-005",
    patientName: "Daniel Martinez",
    providerId: "PROV-003",
    providerName: "United Health",
    insuranceId: "INS-003",
    policyNumber: "UHC-00500042",
    submittedDate: "2026-06-06",
    claimedAmount: 280,
    approvedAmount: 182,
    status: "Settled",
    reviewedBy: "Claims Dept",
    reviewedDate: "2026-06-10",
    notes: "65% coverage applied",
    items: [
      { itemId: "CI-013", claimId: "CLM-0043", description: "Neurology Consultation", claimedAmount: 210, approvedAmount: 137, status: "Approved" },
      { itemId: "CI-014", claimId: "CLM-0043", description: "EEG", claimedAmount: 70, approvedAmount: 45, status: "Approved" },
    ],
  },
];
