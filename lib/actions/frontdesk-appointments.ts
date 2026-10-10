"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { revalidatePath } from "next/cache";

export interface FrontDeskAppointment {
    appointmentId: string;
    queueNumber: number;
    patientId: string;
    patientName: string;
    doctorName: string;
    doctorId: string;
    availableDate: string;
    startTime: string;
    endTime: string;
    status: string;
    source: string;
    reasonForVisit: string | null;
    checkedInAt: string | null;
}

export async function getBranchAppointments(
    branchId?: string,
    dateFilter?: string
): Promise<FrontDeskAppointment[]> {
    try {
        const user = await getCurrentUser();
        const effectiveBranchId = branchId || user?.branchId;

        const query = `
      SELECT
        a.appointment_id AS "appointmentId",
        a.queue_number AS "queueNumber",
        p.patient_id AS "patientId",
        u.full_name AS "patientName",
        CONCAT('Dr. ', doc_user.full_name) AS "doctorName",
        d.doctor_id AS "doctorId",
        ts.available_date::text AS "availableDate",
        TO_CHAR(ts.start_time, 'HH12:MI AM') AS "startTime",
        TO_CHAR(ts.end_time, 'HH12:MI AM') AS "endTime",
        a.status::text AS "status",
        a.source::text AS "source",
        a.reason_for_visit AS "reasonForVisit",
        a.checked_in_at::text AS "checkedInAt"
      FROM appointment a
      JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
      JOIN patient p ON p.patient_id = a.patient_id
      JOIN app_user u ON u.user_id = p.patient_id
      JOIN doctor d ON d.doctor_id = ts.doctor_id
      JOIN app_user doc_user ON doc_user.user_id = d.doctor_id
      WHERE ($1::uuid IS NULL OR ts.branch_id = $1::uuid)
        AND ($2::date IS NULL OR ts.available_date = $2::date)
      ORDER BY ts.available_date DESC, a.queue_number ASC
    `;

        const { rows } = await db.query(query, [
            effectiveBranchId || null,
            dateFilter || null,
        ]);

        return rows as FrontDeskAppointment[];
    } catch (error) {
        console.error("[getBranchAppointments] Failed to load appointments:", error);
        return [];
    }
}

export async function checkInPatientAppointment(appointmentId: string) {
    try {
        const res = await db.query(
            `UPDATE appointment
       SET status = 'CheckedIn',
           checked_in_at = NOW(),
           updated_at = NOW()
       WHERE appointment_id = $1::uuid
       RETURNING appointment_id, queue_number`,
            [appointmentId]
        );

        if (res.rowCount === 0) {
            return { success: false, error: "Appointment not found." };
        }

        revalidatePath("/front-desk/appointments");
        revalidatePath("/front-desk/dashboard");

        return {
            success: true,
            queueNumber: res.rows[0].queue_number,
            message: `Patient checked in successfully! Token #${res.rows[0].queue_number}`,
        };
    } catch (error: any) {
        console.error("[checkInPatientAppointment] Check-in failed:", error);
        return { success: false, error: error.message || "Failed to check in patient." };
    }
}

export async function cancelAppointmentByReception(
    appointmentId: string,
    reason: string
) {
    try {
        const res = await db.query(
            `UPDATE appointment
       SET status = 'Cancelled',
           cancelled_reason = $1,
           updated_at = NOW()
       WHERE appointment_id = $2::uuid
       RETURNING appointment_id`,
            [reason, appointmentId]
        );

        if (res.rowCount === 0) {
            return { success: false, error: "Appointment not found." };
        }

        revalidatePath("/front-desk/appointments");
        revalidatePath("/front-desk/dashboard");

        return { success: true, message: "Appointment cancelled." };
    } catch (error: any) {
        console.error("[cancelAppointmentByReception] Cancellation failed:", error);
        return { success: false, error: error.message || "Failed to cancel appointment." };
    }
}
