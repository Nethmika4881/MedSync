"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { revalidatePath } from "next/cache";

export interface FrontDeskInvoice {
    invoiceId: string;
    appointmentId: string;
    patientId: string;
    patientName: string;
    grossAmount: number;
    discountAmount: number;
    taxAmount: number;
    netAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    invoiceDate: string;
}

export interface FrontDeskPaymentRecord {
    paymentId: string;
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    referenceNumber: string | null;
    patientName: string;
}

export async function getBranchInvoices(
    branchId?: string,
    statusFilter?: string
): Promise<FrontDeskInvoice[]> {
    try {
        const user = await getCurrentUser();
        const effectiveBranchId = branchId || user?.branchId;

        const query = `
      SELECT
        inv.invoice_id AS "invoiceId",
        inv.appointment_id AS "appointmentId",
        inv.patient_id AS "patientId",
        u.full_name AS "patientName",
        inv.gross_amount::float AS "grossAmount",
        inv.discount_amount::float AS "discountAmount",
        inv.tax_amount::float AS "taxAmount",
        inv.net_amount::float AS "netAmount",
        inv.paid_amount::float AS "paidAmount",
        inv.due_amount::float AS "dueAmount",
        inv.status::text AS "status",
        TO_CHAR(inv.invoice_date, 'YYYY-MM-DD HH12:MI AM') AS "invoiceDate"
      FROM invoice inv
      JOIN patient p ON p.patient_id = inv.patient_id
      JOIN app_user u ON u.user_id = p.patient_id
      JOIN appointment a ON a.appointment_id = inv.appointment_id
      JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
      WHERE ($1::uuid IS NULL OR ts.branch_id = $1::uuid)
        AND ($2::text IS NULL OR inv.status::text = $2)
      ORDER BY inv.invoice_date DESC
    `;

        const { rows } = await db.query(query, [
            effectiveBranchId || null,
            statusFilter || null,
        ]);

        return rows as FrontDeskInvoice[];
    } catch (error) {
        console.error("[getBranchInvoices] Failed to load invoices:", error);
        return [];
    }
}

export async function recordFrontDeskPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: "Cash" | "Card" | "BankTransfer" | "OnlinePayment";
    referenceNumber?: string;
}) {
    const client = await db.connect();
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: "Authentication required to collect payment." };
        }

        await client.query("BEGIN");

        // 1. Insert Payment
        await client.query(
            `INSERT INTO payment (
         invoice_id, amount, payment_method, received_by, reference_number
       )
       VALUES ($1, $2, $3, $4, $5)`,
            [
                data.invoiceId,
                data.amount,
                data.paymentMethod,
                user.userId,
                data.referenceNumber || null,
            ]
        );

        // 2. Update Invoice balance & status
        await client.query(
            `UPDATE invoice
       SET paid_amount = paid_amount + $1,
           due_amount = GREATEST(0, due_amount - $1),
           status = CASE
             WHEN (due_amount - $1) <= 0 THEN 'Paid'::invoice_status_enum
             ELSE 'PartiallyPaid'::invoice_status_enum
           END,
           updated_at = NOW()
       WHERE invoice_id = $2::uuid`,
            [data.amount, data.invoiceId]
        );

        await client.query("COMMIT");

        revalidatePath("/front-desk/billing");
        revalidatePath("/front-desk/dashboard");

        return { success: true, message: "Payment processed successfully!" };
    } catch (error: any) {
        await client.query("ROLLBACK");
        console.error("[recordFrontDeskPayment] Payment recording failed:", error);
        return { success: false, error: error.message || "Failed to record payment." };
    } finally {
        client.release();
    }
}
