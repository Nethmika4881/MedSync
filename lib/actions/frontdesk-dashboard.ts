"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";

export interface FrontDeskStats {
    todayAppointments: number;
    waitingQueue: number;
    completedToday: number;
    unpaidInvoices: number;
}

export interface WaitingPatient {
    appointmentId: string;
    queueNumber: number;
    patientId: string;
    patientName: string;
    doctorName: string;
    sessionTime: string;
    status: string;
    reasonForVisit: string | null;
}

export async function getFrontDeskStats(branchId?: string): Promise<FrontDeskStats> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "receptionist" && user.role !== "admin")) {
            return {
                todayAppointments: 0,
                waitingQueue: 0,
                completedToday: 0,
                unpaidInvoices: 0,
            };
        }

        const effectiveBranchId = user.role === "admin" ? (branchId || user.branchId) : user.branchId;

        const queryAppts = `
      SELECT
        COUNT(*) FILTER (WHERE ts.available_date = CURRENT_DATE)::int AS today_appts,
        COUNT(*) FILTER (WHERE a.status = 'CheckedIn' AND ts.available_date = CURRENT_DATE)::int AS waiting_count,
        COUNT(*) FILTER (WHERE a.status = 'Completed' AND ts.available_date = CURRENT_DATE)::int AS completed_count
      FROM appointment a
      JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
      WHERE ($1::uuid IS NULL OR ts.branch_id = $1::uuid)
    `;

        const queryInvoices = `
      SELECT COUNT(*)::int AS unpaid_count
      FROM invoice
      WHERE status = 'Unpaid'
    `;

        const [apptsRes, invRes] = await Promise.all([
            db.query(queryAppts, [effectiveBranchId || null]),
            db.query(queryInvoices),
        ]);

        const row = apptsRes.rows[0] || {};
        const invRow = invRes.rows[0] || {};

        return {
            todayAppointments: Number(row.today_appts || 0),
            waitingQueue: Number(row.waiting_count || 0),
            completedToday: Number(row.completed_count || 0),
            unpaidInvoices: Number(invRow.unpaid_count || 0),
        };
    } catch (error) {
        console.error("[getFrontDeskStats] Failed to fetch branch stats:", error);
        return {
            todayAppointments: 0,
            waitingQueue: 0,
            completedToday: 0,
            unpaidInvoices: 0,
        };
    }
}

export async function getFrontDeskWaitingQueue(branchId?: string): Promise<WaitingPatient[]> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "receptionist" && user.role !== "admin" && user.role !== "doctor")) {
            return [];
        }

        const effectiveBranchId = user.role === "admin" ? (branchId || user.branchId) : user.branchId;

        const query = `
      SELECT
        a.appointment_id AS "appointmentId",
        a.queue_number AS "queueNumber",
        p.patient_id AS "patientId",
        u.full_name AS "patientName",
        CONCAT('Dr. ', doc_user.full_name) AS "doctorName",
        TO_CHAR(ts.start_time, 'HH12:MI AM') AS "sessionTime",
        a.status::text AS "status",
        a.reason_for_visit AS "reasonForVisit"
      FROM appointment a
      JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
      JOIN patient p ON p.patient_id = a.patient_id
      JOIN app_user u ON u.user_id = p.patient_id
      JOIN doctor d ON d.doctor_id = ts.doctor_id
      JOIN app_user doc_user ON doc_user.user_id = d.doctor_id
      WHERE ($1::uuid IS NULL OR ts.branch_id = $1::uuid)
        AND ts.available_date = CURRENT_DATE
        AND a.status = 'CheckedIn'
      ORDER BY a.queue_number ASC
    `;

        const { rows } = await db.query(query, [effectiveBranchId || null]);
        return rows as WaitingPatient[];
    } catch (error) {
        console.error("[getFrontDeskWaitingQueue] Failed to fetch waiting queue:", error);
        return [];
    }
}
