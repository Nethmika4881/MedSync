export interface InsuranceProvider {
  providerId: string;
  name: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  isActive: boolean;
}

export interface InsurancePackage {
  packageId: string;
  providerId: string;
  providerName: string;
  packageName: string;
  annualLimit: number;
  coverage: string[];
  copayPercent: number;
}

export interface Insurance {
  insuranceId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  packageId: string;
  packageName: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  annualLimit: number;
  usedCoverageAmount: number;
  status: "Active" | "Expired" | "Suspended";
}

export const insuranceProviders: InsuranceProvider[] = [
  { providerId: "PROV-001", name: "BlueCross BlueShield", contactPhone: "+1 (800) 555-1000", contactEmail: "claims@bcbs.com", website: "bcbs.com", isActive: true },
  { providerId: "PROV-002", name: "Aetna Health", contactPhone: "+1 (800) 555-2000", contactEmail: "claims@aetna.com", website: "aetna.com", isActive: true },
  { providerId: "PROV-003", name: "United Health", contactPhone: "+1 (800) 555-3000", contactEmail: "claims@unitedhealthcare.com", website: "uhc.com", isActive: true },
  { providerId: "PROV-004", name: "Cigna HealthSpring", contactPhone: "+1 (800) 555-4000", contactEmail: "claims@cigna.com", website: "cigna.com", isActive: true },
];

export const insurancePackages: InsurancePackage[] = [
  { packageId: "PKG-001", providerId: "PROV-001", providerName: "BlueCross BlueShield", packageName: "Premium Plus", annualLimit: 50000, coverage: ["Outpatient", "Inpatient", "Surgery", "Diagnostics", "Mental Health"], copayPercent: 80 },
  { packageId: "PKG-002", providerId: "PROV-001", providerName: "BlueCross BlueShield", packageName: "Standard Care", annualLimit: 25000, coverage: ["Outpatient", "Inpatient", "Diagnostics"], copayPercent: 70 },
  { packageId: "PKG-003", providerId: "PROV-002", providerName: "Aetna Health", packageName: "Aetna Gold", annualLimit: 40000, coverage: ["Outpatient", "Inpatient", "Surgery", "Prescriptions"], copayPercent: 75 },
  { packageId: "PKG-004", providerId: "PROV-003", providerName: "United Health", packageName: "UHC Silver", annualLimit: 30000, coverage: ["Outpatient", "Diagnostics", "Prescriptions"], copayPercent: 65 },
  { packageId: "PKG-005", providerId: "PROV-004", providerName: "Cigna HealthSpring", packageName: "Cigna Total", annualLimit: 45000, coverage: ["Outpatient", "Inpatient", "Surgery", "Diagnostics", "Mental Health", "Dental"], copayPercent: 80 },
];

export const insurances: Insurance[] = [
  { insuranceId: "INS-001", patientId: "PAT-001", patientName: "Michael Brown", providerId: "PROV-001", providerName: "BlueCross BlueShield", packageId: "PKG-001", packageName: "Premium Plus", policyNumber: "BCBS-00100192", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 50000, usedCoverageAmount: 8200, status: "Active" },
  { insuranceId: "INS-002", patientId: "PAT-003", patientName: "Liam Anderson", providerId: "PROV-002", providerName: "Aetna Health", packageId: "PKG-003", packageName: "Aetna Gold", policyNumber: "AET-00300091", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 40000, usedCoverageAmount: 12500, status: "Active" },
  { insuranceId: "INS-003", patientId: "PAT-005", patientName: "Daniel Martinez", providerId: "PROV-003", providerName: "United Health", packageId: "PKG-004", packageName: "UHC Silver", policyNumber: "UHC-00500042", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 30000, usedCoverageAmount: 4800, status: "Active" },
  // PAT-007 approaching limit (> 80%) — warning indicator demo
  { insuranceId: "INS-004", patientId: "PAT-007", patientName: "Maria Santos", providerId: "PROV-001", providerName: "BlueCross BlueShield", packageId: "PKG-002", packageName: "Standard Care", policyNumber: "BCBS-00700445", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 25000, usedCoverageAmount: 21200, status: "Active" },
  { insuranceId: "INS-005", patientId: "PAT-010", patientName: "Noah Garcia", providerId: "PROV-004", providerName: "Cigna HealthSpring", packageId: "PKG-005", packageName: "Cigna Total", policyNumber: "CGN-01000087", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 45000, usedCoverageAmount: 6750, status: "Active" },
  { insuranceId: "INS-006", patientId: "PAT-012", patientName: "Ethan Moore", providerId: "PROV-002", providerName: "Aetna Health", packageId: "PKG-003", packageName: "Aetna Gold", policyNumber: "AET-01200118", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 40000, usedCoverageAmount: 18900, status: "Active" },
  { insuranceId: "INS-007", patientId: "PAT-014", patientName: "Alexander Jackson", providerId: "PROV-001", providerName: "BlueCross BlueShield", packageId: "PKG-001", packageName: "Premium Plus", policyNumber: "BCBS-01400299", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 50000, usedCoverageAmount: 31000, status: "Active" },
  { insuranceId: "INS-008", patientId: "PAT-017", patientName: "Amelia Clark", providerId: "PROV-003", providerName: "United Health", packageId: "PKG-004", packageName: "UHC Silver", policyNumber: "UHC-01700066", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 30000, usedCoverageAmount: 9200, status: "Active" },
  { insuranceId: "INS-009", patientId: "PAT-020", patientName: "Elijah Walker", providerId: "PROV-004", providerName: "Cigna HealthSpring", packageId: "PKG-005", packageName: "Cigna Total", policyNumber: "CGN-02000033", startDate: "2025-01-01", endDate: "2025-12-31", annualLimit: 45000, usedCoverageAmount: 45000, status: "Expired" },
  { insuranceId: "INS-010", patientId: "PAT-021", patientName: "Abraham Brakering", providerId: "PROV-001", providerName: "BlueCross BlueShield", packageId: "PKG-001", packageName: "Premium Plus", policyNumber: "BCBS-02100390", startDate: "2026-01-01", endDate: "2026-12-31", annualLimit: 50000, usedCoverageAmount: 5400, status: "Active" },
];
