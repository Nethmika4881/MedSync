"use server";
// lib/actions/patient-billing.ts
// Read-only server action for retrieving the authenticated patient's invoices from PostgreSQL.
// Derives patientId strictly from the authenticated session.
// Returns invoices with appointment context, payment history, and insurance claim status.
// No mutation operations are exposed.

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";

/* ── Public types ── */

export interface PatientPaymentItem {
  paymentId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
}

export interface PatientClaimSummary {
  claimId: string;
  claimedAmount: string;
  approvedAmount: string;
  status: string;
  claimDate: string;
  settlementDate: string | null;
  remarks: string | null;
}

export interface PatientInvoiceItem {
  invoiceId: string;
  appointmentId: string;
  invoiceDate: string;
  grossAmount: string;
  discountAmount: string;
  taxAmount: string;
  netAmount: string;
  paidAmount: string;
  dueAmount: string;
  insuranceCoveredAmount: string;
  status: string; // 'Unpaid' | 'PartiallyPaid' | 'Paid'

  // Appointment context
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentStatus: string;
  reasonForVisit: string | null;

  // Doctor & branch
  doctorName: string;
  specialization: string | null;
  specializations?: string[];
  branchName: string;

  // Treatments (line items)
  treatments: InvoiceTreatmentItem[];

  // Payments received
  payments: PatientPaymentItem[];

  // Insurance claim (if any)
  claim: PatientClaimSummary | null;
}

export interface InvoiceTreatmentItem {
  treatmentName: string;
  category: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  status: string;
}

type InvoiceRow = Omit<PatientInvoiceItem, "treatments" | "payments" | "claim">;
type TreatmentRow = InvoiceTreatmentItem & { appointmentId: string };
type PaymentRow = PatientPaymentItem & { invoiceId: string };
type ClaimRow = PatientClaimSummary & { invoiceId: string };

/**
 * Loads all invoices belonging to the authenticated patient.
 * Read-only — no mutations exposed.
 */
export async function getPatientBilling(): Promise<PatientInvoiceItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return [];
  }

  const patientId = user.userId;

  try {
    // 1. Invoices with appointment + doctor + branch context
    const { rows: invoices } = await db.query<InvoiceRow>(
      `SELECT
         inv.invoice_id                             AS "invoiceId",
         inv.appointment_id                         AS "appointmentId",
         TO_CHAR(inv.invoice_date, 'YYYY-MM-DD')    AS "invoiceDate",
         inv.gross_amount::TEXT                      AS "grossAmount",
         inv.discount_amount::TEXT                   AS "discountAmount",
         inv.tax_amount::TEXT                        AS "taxAmount",
         inv.net_amount::TEXT                        AS "netAmount",
         inv.paid_amount::TEXT                       AS "paidAmount",
         inv.due_amount::TEXT                        AS "dueAmount",
         inv.insurance_covered_amount::TEXT          AS "insuranceCoveredAmount",
         inv.status::TEXT                            AS "status",

         TO_CHAR(ts.available_date, 'YYYY-MM-DD')   AS "appointmentDate",
         TO_CHAR(ts.start_time, 'HH24:MI')          AS "startTime",
         TO_CHAR(ts.end_time, 'HH24:MI')            AS "endTime",
         a.status::TEXT                              AS "appointmentStatus",
         a.reason_for_visit                          AS "reasonForVisit",

         u.full_name                                 AS "doctorName",
         COALESCE(
           (
             SELECT ARRAY_AGG(s.title ORDER BY s.title)
             FROM doctor_specialization ds
             JOIN specialization s ON s.specialization_id = ds.specialization_id
             WHERE ds.doctor_id = d.doctor_id
           ),
           ARRAY[]::text[]
         )                                           AS "specializations",
         b.branch_name                               AS "branchName"
       FROM invoice inv
       JOIN appointment a  ON a.appointment_id = inv.appointment_id
       JOIN time_slot ts   ON ts.time_slot_id  = a.time_slot_id
       JOIN doctor d       ON d.doctor_id      = ts.doctor_id
       JOIN employee e     ON e.employee_id    = d.doctor_id
       JOIN app_user u     ON u.user_id        = e.employee_id
       JOIN branch b       ON b.branch_id      = ts.branch_id
       WHERE inv.patient_id = $1
       ORDER BY inv.invoice_date DESC`,
      [patientId]
    );

    if (invoices.length === 0) return [];

    const invoiceIds = invoices.map((i) => i.invoiceId);
    const appointmentIds = invoices.map((i) => i.appointmentId);

    // 2. Treatments (line items) for all matching appointments
    const { rows: treatmentRows } = await db.query<TreatmentRow>(
      `SELECT
         at.appointment_id                          AS "appointmentId",
         tc.treatment_name                          AS "treatmentName",
         tc.category::TEXT                          AS "category",
         at.quantity                                AS "quantity",
         at.unit_price::TEXT                        AS "unitPrice",
         at.line_total::TEXT                        AS "lineTotal",
         at.status::TEXT                            AS "status"
       FROM appointment_treatment at
       JOIN treatment_catalogue tc ON tc.treatment_service_code = at.treatment_service_code
       WHERE at.appointment_id = ANY($1::uuid[])
       ORDER BY at.ordered_at ASC`,
      [appointmentIds]
    );

    // 3. Payments for all matching invoices
    const { rows: paymentRows } = await db.query<PaymentRow>(
      `SELECT
         p.payment_id                               AS "paymentId",
         p.invoice_id                               AS "invoiceId",
         p.amount::TEXT                             AS "amount",
         TO_CHAR(p.payment_date, 'YYYY-MM-DD')      AS "paymentDate",
         p.payment_method::TEXT                     AS "paymentMethod",
         p.reference_number                         AS "referenceNumber"
       FROM payment p
       WHERE p.invoice_id = ANY($1::uuid[])
       ORDER BY p.payment_date ASC`,
      [invoiceIds]
    );

    // 4. Insurance claims for all matching invoices
    const { rows: claimRows } = await db.query<ClaimRow>(
      `SELECT
         ic.claim_id                                AS "claimId",
         ic.invoice_id                              AS "invoiceId",
         ic.claimed_amount::TEXT                    AS "claimedAmount",
         ic.approved_amount::TEXT                   AS "approvedAmount",
         ic.status::TEXT                            AS "status",
         TO_CHAR(ic.claim_date, 'YYYY-MM-DD')       AS "claimDate",
         TO_CHAR(ic.settlement_date, 'YYYY-MM-DD')  AS "settlementDate",
         ic.remarks                                 AS "remarks"
       FROM insurance_claim ic
       WHERE ic.invoice_id = ANY($1::uuid[])`,
      [invoiceIds]
    );

    // 5. Group treatments by appointment_id
    const treatmentsByAppt: Record<string, InvoiceTreatmentItem[]> = {};
    for (const t of treatmentRows) {
      const apptId = t.appointmentId;
      if (!treatmentsByAppt[apptId]) treatmentsByAppt[apptId] = [];
      treatmentsByAppt[apptId].push({
        treatmentName: t.treatmentName,
        category: t.category,
        quantity: t.quantity,
        unitPrice: t.unitPrice,
        lineTotal: t.lineTotal,
        status: t.status,
      });
    }

    // 6. Group payments by invoice_id
    const paymentsByInvoice: Record<string, PatientPaymentItem[]> = {};
    for (const p of paymentRows) {
      const invId = p.invoiceId;
      if (!paymentsByInvoice[invId]) paymentsByInvoice[invId] = [];
      paymentsByInvoice[invId].push({
        paymentId: p.paymentId,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
      });
    }

    // 7. Index claims by invoice_id (1:1)
    const claimByInvoice: Record<string, PatientClaimSummary> = {};
    for (const c of claimRows) {
      const invId = c.invoiceId;
      claimByInvoice[invId] = {
        claimId: c.claimId,
        claimedAmount: c.claimedAmount,
        approvedAmount: c.approvedAmount,
        status: c.status,
        claimDate: c.claimDate,
        settlementDate: c.settlementDate,
        remarks: c.remarks,
      };
    }

    // 8. Assemble final result
    return invoices.map((inv) => {
      const specializations: string[] = Array.isArray(inv.specializations)
        ? inv.specializations
        : [];
      return {
        ...inv,
        specialization:
          specializations.length > 0 ? specializations.join(", ") : null,
        specializations,
        treatments: treatmentsByAppt[inv.appointmentId] || [],
        payments: paymentsByInvoice[inv.invoiceId] || [],
        claim: claimByInvoice[inv.invoiceId] || null,
      };
    });
  } catch (err) {
    console.error("[getPatientBilling] Failed to fetch billing:", err);
    return [];
  }
}
