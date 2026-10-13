"use server";
// lib/actions/patient-claims.ts
// Read-only server action for retrieving the authenticated patient's insurance claims from PostgreSQL.
// Derives patientId strictly from the authenticated session. Never trusts client-supplied patient IDs.
// Returns claims joined through patient-owned invoices and policies.
// Strictly read-only — no mutation operations, status editing, or staff-review actions are exposed.

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";

/* ── Public Types ── */

export type ClaimStatus =
  | "Submitted"
  | "UnderReview"
  | "Approved"
  | "PartiallyApproved"
  | "Rejected"
  | "Settled";

export type PolicyStatus = "Active" | "Expired" | "Cancelled";

export interface PatientClaimItemLine {
  claimItemId: string;
  treatmentName: string;
  category: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  claimedAmount: string;
  approvedAmount: string;
}

export interface PatientClaimRecord {
  claimId: string;
  invoiceId: string;
  insuranceId: string;
  claimDate: string;
  claimedAmount: string;
  approvedAmount: string;
  status: ClaimStatus;
  settlementDate: string | null;
  remarks: string | null;

  // Policy & Provider information
  policyNumber: string;
  policyStatus: PolicyStatus;
  policyStartDate: string;
  policyEndDate: string;
  providerName: string;
  packageName: string;
  copaymentPercentage: string | null;

  // Associated Invoice & Appointment context
  invoiceDate: string;
  invoiceNetAmount: string;
  invoiceStatus: string;
  appointmentId: string;
  appointmentDate: string;
  doctorName: string;
  specialization: string | null;
  specializations?: string[];
  branchName: string;
  reasonForVisit: string | null;

  // Itemized line items
  items: PatientClaimItemLine[];
}

export interface PatientInsurancePolicy {
  insuranceId: string;
  policyNumber: string;
  status: PolicyStatus;
  usedCoverageAmount: string;
  startDate: string;
  endDate: string;
  providerName: string;
  packageName: string;
  annualLimit: string | null;
  copaymentPercentage: string | null;
  description: string | null;
}

export interface PatientClaimsData {
  claims: PatientClaimRecord[];
  policies: PatientInsurancePolicy[];
}

type ClaimRow = Omit<PatientClaimRecord, "items" | "status" | "policyStatus"> & {
  status: string;
  policyStatus: string;
};
type PolicyRow = Omit<PatientInsurancePolicy, "status"> & { status: string };
type ClaimItemRow = PatientClaimItemLine & { claimId: string };

/**
 * Loads all insurance claims and active policies for the authenticated patient.
 * Read-only — enforces patient ID strictly from session.
 */
export async function getPatientClaims(): Promise<PatientClaimsData> {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return { claims: [], policies: [] };
  }

  const patientId = user.userId;

  try {
    // 1. Fetch claims filed against invoices owned by this patient
    const { rows: claimRows } = await db.query<ClaimRow>(
      `SELECT
         ic.claim_id                              AS "claimId",
         ic.invoice_id                            AS "invoiceId",
         ic.insurance_id                          AS "insuranceId",
         TO_CHAR(ic.claim_date, 'YYYY-MM-DD')     AS "claimDate",
         ic.claimed_amount::TEXT                  AS "claimedAmount",
         ic.approved_amount::TEXT                 AS "approvedAmount",
         ic.status::TEXT                          AS "status",
         TO_CHAR(ic.settlement_date, 'YYYY-MM-DD') AS "settlementDate",
         ic.remarks                               AS "remarks",

         ins.policy_number                        AS "policyNumber",
         ins.status::TEXT                         AS "policyStatus",
         TO_CHAR(ins.start_date, 'YYYY-MM-DD')    AS "policyStartDate",
         TO_CHAR(ins.end_date, 'YYYY-MM-DD')      AS "policyEndDate",
         ip.provider_name                         AS "providerName",
         ip.package_name                          AS "packageName",
         ip.copayment_percentage::TEXT            AS "copaymentPercentage",

         TO_CHAR(inv.invoice_date, 'YYYY-MM-DD')  AS "invoiceDate",
         inv.net_amount::TEXT                     AS "invoiceNetAmount",
         inv.status::TEXT                         AS "invoiceStatus",
         a.appointment_id                         AS "appointmentId",
         TO_CHAR(ts.available_date, 'YYYY-MM-DD') AS "appointmentDate",
         a.reason_for_visit                       AS "reasonForVisit",
         u.full_name                              AS "doctorName",
         COALESCE(
           (
             SELECT ARRAY_AGG(s.title ORDER BY s.title)
             FROM doctor_specialization ds
             JOIN specialization s ON s.specialization_id = ds.specialization_id
             WHERE ds.doctor_id = d.doctor_id
           ),
           ARRAY[]::text[]
         )                                        AS "specializations",
         b.branch_name                            AS "branchName"
       FROM insurance_claim ic
       JOIN invoice inv          ON inv.invoice_id        = ic.invoice_id
       JOIN insurance ins        ON ins.insurance_id      = ic.insurance_id
       JOIN insurance_package ip ON ip.insurance_package_id = ins.insurance_package_id
       JOIN appointment a        ON a.appointment_id      = inv.appointment_id
       JOIN time_slot ts         ON ts.time_slot_id       = a.time_slot_id
       JOIN doctor d             ON d.doctor_id           = ts.doctor_id
       JOIN employee e           ON e.employee_id         = d.doctor_id
       JOIN app_user u           ON u.user_id             = e.employee_id
       JOIN branch b             ON b.branch_id           = ts.branch_id
       WHERE inv.patient_id = $1
       ORDER BY ic.claim_date DESC, ic.created_at DESC`,
      [patientId]
    );

    // 2. Fetch policies owned by this patient
    const { rows: policyRows } = await db.query<PolicyRow>(
      `SELECT
         ins.insurance_id                         AS "insuranceId",
         ins.policy_number                        AS "policyNumber",
         ins.status::TEXT                         AS "status",
         ins.used_coverage_amount::TEXT           AS "usedCoverageAmount",
         TO_CHAR(ins.start_date, 'YYYY-MM-DD')    AS "startDate",
         TO_CHAR(ins.end_date, 'YYYY-MM-DD')      AS "endDate",
         ip.provider_name                         AS "providerName",
         ip.package_name                          AS "packageName",
         ip.annual_limit::TEXT                    AS "annualLimit",
         ip.copayment_percentage::TEXT            AS "copaymentPercentage",
         ip.description                           AS "description"
       FROM insurance ins
       JOIN insurance_package ip ON ip.insurance_package_id = ins.insurance_package_id
       WHERE ins.patient_id = $1
       ORDER BY
         CASE ins.status
           WHEN 'Active' THEN 1
           WHEN 'Expired' THEN 2
           WHEN 'Cancelled' THEN 3
           ELSE 4
         END,
         ins.start_date DESC`,
      [patientId]
    );

    const policies: PatientInsurancePolicy[] = policyRows.map((p) => ({
      insuranceId: p.insuranceId,
      policyNumber: p.policyNumber,
      status: p.status as PolicyStatus,
      usedCoverageAmount: p.usedCoverageAmount || "0.00",
      startDate: p.startDate,
      endDate: p.endDate,
      providerName: p.providerName,
      packageName: p.packageName,
      annualLimit: p.annualLimit,
      copaymentPercentage: p.copaymentPercentage,
      description: p.description,
    }));

    if (claimRows.length === 0) {
      return { claims: [], policies };
    }

    // 3. Itemized claim items for all matching claims
    const claimIds = claimRows.map((c) => c.claimId);
    const { rows: itemRows } = await db.query<ClaimItemRow>(
      `SELECT
         ici.claim_item_id                        AS "claimItemId",
         ici.claim_id                             AS "claimId",
         ici.claimed_amount::TEXT                 AS "claimedAmount",
         ici.approved_amount::TEXT                AS "approvedAmount",
         tc.treatment_name                        AS "treatmentName",
         tc.category::TEXT                        AS "category",
         at.quantity                              AS "quantity",
         at.unit_price::TEXT                      AS "unitPrice",
         at.line_total::TEXT                      AS "lineTotal"
       FROM insurance_claim_item ici
       JOIN appointment_treatment at ON at.appointment_treatment_id = ici.appointment_treatment_id
       JOIN treatment_catalogue tc   ON tc.treatment_service_code   = at.treatment_service_code
       WHERE ici.claim_id = ANY($1::uuid[])`,
      [claimIds]
    );

    // Group items by claim_id
    const itemsByClaim: Record<string, PatientClaimItemLine[]> = {};
    for (const item of itemRows) {
      const cId = item.claimId;
      if (!itemsByClaim[cId]) itemsByClaim[cId] = [];
      itemsByClaim[cId].push({
        claimItemId: item.claimItemId,
        treatmentName: item.treatmentName,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        claimedAmount: item.claimedAmount,
        approvedAmount: item.approvedAmount || "0.00",
      });
    }

    const claims: PatientClaimRecord[] = claimRows.map((c) => ({
      claimId: c.claimId,
      invoiceId: c.invoiceId,
      insuranceId: c.insuranceId,
      claimDate: c.claimDate,
      claimedAmount: c.claimedAmount,
      approvedAmount: c.approvedAmount || "0.00",
      status: c.status as ClaimStatus,
      settlementDate: c.settlementDate,
      remarks: c.remarks,

      policyNumber: c.policyNumber,
      policyStatus: c.policyStatus as PolicyStatus,
      policyStartDate: c.policyStartDate,
      policyEndDate: c.policyEndDate,
      providerName: c.providerName,
      packageName: c.packageName,
      copaymentPercentage: c.copaymentPercentage,

      invoiceDate: c.invoiceDate,
      invoiceNetAmount: c.invoiceNetAmount,
      invoiceStatus: c.invoiceStatus,
      appointmentId: c.appointmentId,
      appointmentDate: c.appointmentDate,
      doctorName: c.doctorName,
      specialization:
        Array.isArray(c.specializations) && c.specializations.length > 0
          ? c.specializations.join(", ")
          : null,
      specializations: Array.isArray(c.specializations) ? c.specializations : [],
      branchName: c.branchName,
      reasonForVisit: c.reasonForVisit,

      items: itemsByClaim[c.claimId] || [],
    }));

    return { claims, policies };
  } catch (err) {
    console.error("[getPatientClaims] Failed to fetch patient claims:", err);
    return { claims: [], policies: [] };
  }
}
