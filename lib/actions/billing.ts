"use server";

// lib/actions/billing.ts
// Parameterized raw SQL Server Actions for billing, payment collection, and insurance claims.

import { sql, pool } from "@/lib/db";
import type { Invoice, Payment, Claim, ClaimStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

export type PaymentResult =
  | { success: true; paymentId: string; newBalanceDue: number; isFullyPaid: boolean }
  | { success: false; error: "OVERPAYMENT" | "INVALID_INPUT" | "NOT_FOUND" | "UNKNOWN"; message: string };

export type ClaimResult =
  | { success: true; claimId: string }
  | { success: false; error: "INVALID_INPUT" | "NOT_FOUND" | "UNKNOWN"; message: string };

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getInvoices(patientId?: string): Promise<Invoice[]> {
  if (!process.env.DATABASE_URL) return [];
  const rows = patientId
    ? await sql`
        SELECT
          i.invoice_id      AS "invoiceId",
          i.appointment_id  AS "appointmentId",
          i.patient_id      AS "patientId",
          p.full_name       AS "patientName",
          i.branch_id       AS "branchId",
          i.total_amount    AS "totalAmount",
          i.paid_amount     AS "paidAmount",
          i.balance_due     AS "balanceDue",
          i.status          AS "status",
          i.created_at      AS "issuedAt",
          TO_CHAR(i.created_at, 'YYYY-MM-DD') AS "issueDate",
          TO_CHAR(i.created_at + INTERVAL '30 days', 'YYYY-MM-DD') AS "dueDate"
        FROM invoice i
        JOIN patient p ON p.patient_id = i.patient_id
        WHERE i.patient_id = ${patientId}
        ORDER BY i.created_at DESC
      `
    : await sql`
        SELECT
          i.invoice_id      AS "invoiceId",
          i.appointment_id  AS "appointmentId",
          i.patient_id      AS "patientId",
          p.full_name       AS "patientName",
          i.branch_id       AS "branchId",
          i.total_amount    AS "totalAmount",
          i.paid_amount     AS "paidAmount",
          i.balance_due     AS "balanceDue",
          i.status          AS "status",
          i.created_at      AS "issuedAt",
          TO_CHAR(i.created_at, 'YYYY-MM-DD') AS "issueDate",
          TO_CHAR(i.created_at + INTERVAL '30 days', 'YYYY-MM-DD') AS "dueDate"
        FROM invoice i
        JOIN patient p ON p.patient_id = i.patient_id
        ORDER BY i.created_at DESC
      `;
  return rows as Invoice[];
}

export async function getPayments(patientId?: string): Promise<Payment[]> {
  if (!process.env.DATABASE_URL) return [];
  const rows = patientId
    ? await sql`
        SELECT
          pay.payment_id    AS "paymentId",
          pay.invoice_id    AS "invoiceId",
          i.patient_id      AS "patientId",
          p.full_name       AS "patientName",
          pay.amount        AS "amount",
          pay.method        AS "method",
          pay.paid_at       AS "paidAt",
          pay.reference     AS "reference",
          'Successful'      AS "status"
        FROM payment pay
        JOIN invoice i ON i.invoice_id = pay.invoice_id
        JOIN patient p ON p.patient_id = i.patient_id
        WHERE i.patient_id = ${patientId}
        ORDER BY pay.paid_at DESC
      `
    : await sql`
        SELECT
          pay.payment_id    AS "paymentId",
          pay.invoice_id    AS "invoiceId",
          i.patient_id      AS "patientId",
          p.full_name       AS "patientName",
          pay.amount        AS "amount",
          pay.method        AS "method",
          pay.paid_at       AS "paidAt",
          pay.reference     AS "reference",
          'Successful'      AS "status"
        FROM payment pay
        JOIN invoice i ON i.invoice_id = pay.invoice_id
        JOIN patient p ON p.patient_id = i.patient_id
        ORDER BY pay.paid_at DESC
      `;
  return rows as Payment[];
}

export async function getClaims(patientId?: string): Promise<Claim[]> {
  if (!process.env.DATABASE_URL) return [];
  const rows = patientId
    ? await sql`
        SELECT
          c.claim_id              AS "claimId",
          c.invoice_id            AS "invoiceId",
          i.patient_id            AS "patientId",
          p.full_name             AS "patientName",
          c.provider_id           AS "insuranceProviderId",
          pr.name                 AS "providerName",
          c.policy_number         AS "policyNumber",
          c.claimed_amount        AS "claimedAmount",
          c.approved_amount       AS "approvedAmount",
          c.status                AS "status",
          TO_CHAR(c.created_at, 'YYYY-MM-DD') AS "submittedDate",
          c.notes                 AS "notes"
        FROM claim c
        JOIN invoice i ON i.invoice_id = c.invoice_id
        JOIN patient p ON p.patient_id = i.patient_id
        LEFT JOIN insurance_provider pr ON pr.provider_id = c.provider_id
        WHERE i.patient_id = ${patientId}
        ORDER BY c.created_at DESC
      `
    : await sql`
        SELECT
          c.claim_id              AS "claimId",
          c.invoice_id            AS "invoiceId",
          i.patient_id            AS "patientId",
          p.full_name             AS "patientName",
          c.provider_id           AS "insuranceProviderId",
          pr.name                 AS "providerName",
          c.policy_number         AS "policyNumber",
          c.claimed_amount        AS "claimedAmount",
          c.approved_amount       AS "approvedAmount",
          c.status                AS "status",
          TO_CHAR(c.created_at, 'YYYY-MM-DD') AS "submittedDate",
          c.notes                 AS "notes"
        FROM claim c
        JOIN invoice i ON i.invoice_id = c.invoice_id
        JOIN patient p ON p.patient_id = i.patient_id
        LEFT JOIN insurance_provider pr ON pr.provider_id = c.provider_id
        ORDER BY c.created_at DESC
      `;
  return rows as Claim[];
}

// ─── Payment Collection Server Action ─────────────────────────────────────────

export async function processPayment(data: {
  invoiceId: string;
  amount: number;
  method: "Cash" | "Card" | "Bank Transfer" | "Online";
  reference?: string;
}): Promise<PaymentResult> {
  if (!data.invoiceId || !data.amount || data.amount <= 0 || !data.method) {
    return { success: false, error: "INVALID_INPUT", message: "Invalid payment details or amount." };
  }

  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      error: "UNKNOWN",
      message: "DATABASE_URL is not configured in .env.local",
    };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch invoice & lock row for UPDATE
    const invResult = await client.query(
      `SELECT total_amount AS "totalAmount", paid_amount AS "paidAmount", balance_due AS "balanceDue"
       FROM invoice
       WHERE invoice_id = $1
       FOR UPDATE`,
      [data.invoiceId]
    );

    if (invResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "NOT_FOUND", message: "Invoice not found." };
    }

    const currentBalanceDue: number = parseFloat(invResult.rows[0].balanceDue);

    // Zero-balance validation check
    if (data.amount > currentBalanceDue) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "OVERPAYMENT",
        message: `Payment amount (LKR ${data.amount}) exceeds remaining balance due (LKR ${currentBalanceDue}).`,
      };
    }

    const payId = `PAY-${Date.now().toString(36).toUpperCase()}`;
    const ref = data.reference || `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Insert payment row (DB trigger trg_payment_update_invoice will update invoice balance)
    await client.query(
      `INSERT INTO payment (payment_id, invoice_id, amount, method, reference, paid_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [payId, data.invoiceId, data.amount, data.method, ref]
    );

    await client.query("COMMIT");

    const newBalance = Math.max(0, currentBalanceDue - data.amount);

    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return {
      success: true,
      paymentId: payId,
      newBalanceDue: newBalance,
      isFullyPaid: newBalance === 0,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[processPayment] Error:", msg);
    return { success: false, error: "UNKNOWN", message: "Failed to process payment." };
  } finally {
    client.release();
  }
}

// ─── Insurance Claim Server Actions ────────────────────────────────────────────

export async function submitInsuranceClaim(data: {
  invoiceId: string;
  providerId: string;
  policyNumber: string;
  claimedAmount: number;
  notes?: string;
}): Promise<ClaimResult> {
  if (!data.invoiceId || !data.providerId || !data.policyNumber || !data.claimedAmount) {
    return { success: false, error: "INVALID_INPUT", message: "Missing required claim fields." };
  }

  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      error: "UNKNOWN",
      message: "DATABASE_URL is not configured in .env.local",
    };
  }

  const claimId = `CLM-${Date.now().toString(36).toUpperCase()}`;

  try {
    await sql`
      INSERT INTO claim (claim_id, invoice_id, provider_id, policy_number, claimed_amount, approved_amount, status, notes)
      VALUES (${claimId}, ${data.invoiceId}, ${data.providerId}, ${data.policyNumber}, ${data.claimedAmount}, 0, 'Submitted', ${data.notes ?? null})
    `;

    revalidatePath("/billing");
    revalidatePath("/billing/claims");

    return { success: true, claimId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[submitInsuranceClaim] Error:", msg);
    return { success: false, error: "UNKNOWN", message: "Failed to submit insurance claim." };
  }
}

export async function updateClaimStatus(data: {
  claimId: string;
  status: ClaimStatus;
  approvedAmount?: number;
  notes?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!data.claimId || !data.status) {
    return { success: false, message: "Missing claim ID or status." };
  }

  if (!process.env.DATABASE_URL) {
    return { success: false, message: "DATABASE_URL is not configured in .env.local" };
  }

  const approved = data.approvedAmount ?? 0;

  try {
    await sql`
      UPDATE claim
      SET status          = ${data.status},
          approved_amount = ${approved},
          notes           = COALESCE(${data.notes ?? null}, notes),
          updated_at      = NOW()
      WHERE claim_id = ${data.claimId}
    `;

    revalidatePath("/billing");
    revalidatePath("/billing/claims");

    return { success: true, message: `Claim updated to ${data.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: msg };
  }
}
