"use server";
// lib/actions/patient-dashboard.ts
// Read-only server action providing real PostgreSQL-derived metrics and upcoming data
// strictly for the authenticated patient. Never trusts client-supplied patient IDs.

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";

export interface PatientUpcomingAppointment {
  appointmentId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  queueNumber: number;
  reasonForVisit: string | null;
  doctorName: string;
  specialization: string | null;
  branchName: string;
}

export interface PatientMonthlyActivity {
  month: string;
  completed: number;
  cancelled: number;
}

export interface PatientDashboardMetrics {
  upcomingAppointmentsCount: number;
  activePrescriptionsCount: number;
  outstandingBalance: string;
  totalDueRaw: number;
  totalBilledRaw: number;
  totalPaidRaw: number;
  unpaidInvoicesCount: number;
  completedVisitsCount: number;
  upcomingAppointments: PatientUpcomingAppointment[];
  monthlyActivity: PatientMonthlyActivity[];
}

export async function getPatientDashboardData(): Promise<PatientDashboardMetrics | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return null;
  }

  const patientId = user.userId;

  try {
    // 1. Upcoming Appointments (Scheduled or Rescheduled, sorted by date)
    const { rows: upcomingRows } = await db.query(
      `SELECT
         a.appointment_id                         AS "appointmentId",
         TO_CHAR(ts.available_date, 'YYYY-MM-DD') AS "appointmentDate",
         TO_CHAR(ts.start_time, 'HH24:MI')        AS "startTime",
         TO_CHAR(ts.end_time, 'HH24:MI')          AS "endTime",
         a.status::TEXT                           AS "status",
         a.queue_number                           AS "queueNumber",
         a.reason_for_visit                       AS "reasonForVisit",
         u.full_name                              AS "doctorName",
         spec.title                               AS "specialization",
         b.branch_name                            AS "branchName"
       FROM appointment a
       JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
       JOIN doctor d ON d.doctor_id = ts.doctor_id
       JOIN employee e ON e.employee_id = d.doctor_id
       JOIN app_user u ON u.user_id = e.employee_id
       JOIN branch b ON b.branch_id = ts.branch_id
       LEFT JOIN (
         SELECT DISTINCT ON (doctor_id) doctor_id, specialization_id
         FROM doctor_specialization
       ) ds ON ds.doctor_id = d.doctor_id
       LEFT JOIN specialization spec ON spec.specialization_id = ds.specialization_id
       WHERE a.patient_id = $1
         AND a.status IN ('Scheduled', 'Rescheduled')
       ORDER BY ts.available_date ASC, ts.start_time ASC
       LIMIT 5`,
      [patientId]
    );

    // 2. Active Prescriptions Count
    const { rows: rxCountRows } = await db.query(
      `SELECT COUNT(pr.prescription_id) AS "activeCount"
       FROM prescription pr
       JOIN appointment a ON a.appointment_id = pr.appointment_id
       WHERE a.patient_id = $1
         AND (
           CASE
             WHEN pr.duration_days IS NOT NULL AND pr.duration_days > 0 THEN
               (pr.created_at::date + pr.duration_days) >= CURRENT_DATE
             ELSE
               pr.created_at >= (CURRENT_DATE - INTERVAL '30 days')
           END
         ) = true`,
      [patientId]
    );
    const activePrescriptionsCount = parseInt(rxCountRows[0]?.activeCount || "0", 10);

    // 3. Billing & Invoices summary
    const { rows: billRows } = await db.query(
      `SELECT
         COALESCE(SUM(inv.due_amount), 0)::NUMERIC   AS "totalDue",
         COALESCE(SUM(inv.net_amount), 0)::NUMERIC   AS "totalBilled",
         COALESCE(SUM(inv.paid_amount), 0)::NUMERIC  AS "totalPaid",
         COUNT(inv.invoice_id) FILTER (WHERE inv.status IN ('Unpaid', 'PartiallyPaid')) AS "unpaidCount"
       FROM invoice inv
       WHERE inv.patient_id = $1`,
      [patientId]
    );

    const totalDueNum = parseFloat(billRows[0]?.totalDue || "0");
    const totalBilledNum = parseFloat(billRows[0]?.totalBilled || "0");
    const totalPaidNum = parseFloat(billRows[0]?.totalPaid || "0");
    const unpaidInvoicesCount = parseInt(billRows[0]?.unpaidCount || "0", 10);

    // 4. Completed Visits Count
    const { rows: visitCountRows } = await db.query(
      `SELECT COUNT(a.appointment_id) AS "completedCount"
       FROM appointment a
       WHERE a.patient_id = $1 AND a.status = 'Completed'`,
      [patientId]
    );
    const completedVisitsCount = parseInt(visitCountRows[0]?.completedCount || "0", 10);

    // 5. Monthly Activity Breakdown (Last 6 months)
    const { rows: activityRows } = await db.query(
      `WITH months AS (
         SELECT
           TO_CHAR(d, 'Mon') AS month,
           TO_CHAR(d, 'YYYY-MM') AS month_sort,
           date_trunc('month', d) AS month_start,
           (date_trunc('month', d) + interval '1 month - 1 second') AS month_end
         FROM generate_series(
           date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
           date_trunc('month', CURRENT_DATE),
           INTERVAL '1 month'
         ) d
       )
       SELECT
         m.month,
         COUNT(a.appointment_id) FILTER (WHERE a.status = 'Completed')::INT AS completed,
         COUNT(a.appointment_id) FILTER (WHERE a.status = 'Cancelled')::INT AS cancelled
       FROM months m
       LEFT JOIN time_slot ts
         ON ts.available_date >= m.month_start::date
        AND ts.available_date <= m.month_end::date
       LEFT JOIN appointment a
         ON a.time_slot_id = ts.time_slot_id
        AND a.patient_id = $1
       GROUP BY m.month, m.month_sort
       ORDER BY m.month_sort ASC`,
      [patientId]
    );

    const monthlyActivity: PatientMonthlyActivity[] = activityRows.map((r: any) => ({
      month: r.month,
      completed: r.completed || 0,
      cancelled: r.cancelled || 0,
    }));

    const upcomingAppointments: PatientUpcomingAppointment[] = upcomingRows.map((r: any) => ({
      appointmentId: r.appointmentId,
      appointmentDate: r.appointmentDate,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      queueNumber: r.queueNumber,
      reasonForVisit: r.reasonForVisit,
      doctorName: r.doctorName,
      specialization: r.specialization,
      branchName: r.branchName,
    }));

    return {
      upcomingAppointmentsCount: upcomingAppointments.length,
      activePrescriptionsCount,
      outstandingBalance: `Rs. ${totalDueNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalDueRaw: totalDueNum,
      totalBilledRaw: totalBilledNum,
      totalPaidRaw: totalPaidNum,
      unpaidInvoicesCount,
      completedVisitsCount,
      upcomingAppointments,
      monthlyActivity,
    };
  } catch (error) {
    console.error("[getPatientDashboardData] Error loading dashboard data:", error);
    return null;
  }
}
