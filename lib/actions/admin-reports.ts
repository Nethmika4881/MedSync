"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";

export interface ReportFilter {
  startDate: string;
  endDate: string;
  branchId?: string | null;
}

// 1. Executive Top-Level KPIs
export async function getExecutiveReportKPIs(filters: ReportFilter) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login?clear=1");

  try {
    const res = await db.query(
      `
      SELECT 
        COUNT(a.appointment_id) AS total_appointments,
        COUNT(a.appointment_id) FILTER (WHERE a.status = 'Completed') AS completed_appointments,
        COUNT(a.appointment_id) FILTER (WHERE a.status = 'Cancelled') AS cancelled_appointments,
        COALESCE(SUM(i.used_coverage_amount), 0) AS total_insurance_utilized
      FROM appointment a
      JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
      LEFT JOIN insurance i ON i.patient_id = a.patient_id
      WHERE (ts.available_date BETWEEN $1::date AND $2::date)
        AND ($3::uuid IS NULL OR ts.branch_id = $3)
    `,
      [filters.startDate, filters.endDate, filters.branchId ?? null]
    ).catch(() => ({
      rows: [{ total_appointments: "0", completed_appointments: "0", cancelled_appointments: "0", total_insurance_utilized: "0" }],
    }));

    const r = res.rows[0] || {};
    const totalAppointments = parseInt(r.total_appointments, 10) || 0;
    const completedAppointments = parseInt(r.completed_appointments, 10) || 0;
    const cancelledAppointments = parseInt(r.cancelled_appointments, 10) || 0;
    const totalInsuranceUtilized = parseFloat(r.total_insurance_utilized) || 0;

    const completionRate = totalAppointments > 0
      ? Number(((completedAppointments / totalAppointments) * 100).toFixed(1))
      : 0;

    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      completionRate,
      totalInsuranceUtilized,
    };
  } catch (err) {
    console.error("Failed to load executive KPIs:", err);
    return {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      completionRate: 0,
      totalInsuranceUtilized: 0,
    };
  }
}

// 2. Branch Appointments Report
export async function getBranchAppointmentReport(filters: ReportFilter) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login?clear=1");

  const result = await db.query(
    `
    SELECT 
      ts.available_date::text AS "date",
      b.branch_id AS "branchId",
      b.branch_name AS "branchName",
      COUNT(a.appointment_id) AS "totalAppointments",
      COUNT(a.appointment_id) FILTER (WHERE a.status = 'Completed') AS "completed",
      COUNT(a.appointment_id) FILTER (WHERE a.status = 'Scheduled') AS "scheduled",
      COUNT(a.appointment_id) FILTER (WHERE a.status = 'Cancelled') AS "cancelled"
    FROM appointment a 
    JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
    JOIN branch b ON b.branch_id = ts.branch_id
    WHERE (ts.available_date BETWEEN $1::date AND $2::date)
      AND ($3::uuid IS NULL OR b.branch_id = $3)
    GROUP BY ts.available_date, b.branch_id, b.branch_name
    ORDER BY ts.available_date DESC, b.branch_name ASC
  `,
    [filters.startDate, filters.endDate, filters.branchId ?? null]
  );

  return result.rows.map((row) => ({
    date: row.date,
    branchId: row.branchId,
    branchName: row.branchName,
    totalAppointments: parseInt(row.totalAppointments, 10) || 0,
    completed: parseInt(row.completed, 10) || 0,
    scheduled: parseInt(row.scheduled, 10) || 0,
    cancelled: parseInt(row.cancelled, 10) || 0,
  }));
}

// 3. Doctor Performance & Revenue Report
export async function getDoctorPerformanceReport(filters: ReportFilter) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login?clear=1");

  const result = await db.query(
    `
    SELECT 
      COALESCE(u.full_name, 'Dr. ' || d.doctor_id::text) AS "doctorName",
      COALESCE(d.specialization, 'General Practice') AS "specialization",
      COUNT(a.appointment_id) AS "consultations",
      COUNT(a.appointment_id) FILTER (WHERE a.status = 'Completed') AS "completedConsultations",
      COALESCE(SUM(d.consultation_fee), 0) AS "estimatedRevenue"
    FROM appointment a
    JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
    JOIN doctor d ON d.doctor_id = ts.doctor_id
    LEFT JOIN "user" u ON u.user_id = d.user_id
    WHERE (ts.available_date BETWEEN $1::date AND $2::date)
      AND ($3::uuid IS NULL OR ts.branch_id = $3)
    GROUP BY u.full_name, d.doctor_id, d.specialization
    ORDER BY "estimatedRevenue" DESC, "consultations" DESC
  `,
    [filters.startDate, filters.endDate, filters.branchId ?? null]
  ).catch(() => ({ rows: [] }));

  return result.rows.map((row) => ({
    doctorName: row.doctorName,
    specialization: row.specialization,
    consultations: parseInt(row.consultations, 10) || 0,
    completedConsultations: parseInt(row.completedConsultations, 10) || 0,
    estimatedRevenue: parseFloat(row.estimatedRevenue) || 0,
  }));
}

// 4. Treatments & Procedures Report
export async function getTreatmentReport(filters: ReportFilter) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login?clear=1");

  const result = await db.query(
    `
    SELECT 
      COALESCE(t.category, 'General Medical') AS "category",
      t.treatment_name AS "treatmentName",
      COUNT(pt.patient_treatment_id) AS "treatmentCount",
      COALESCE(t.cost, 0) AS "unitPrice",
      COALESCE(SUM(t.cost), 0) AS "totalRevenue"
    FROM patient_treatment pt
    JOIN treatment t ON t.treatment_id = pt.treatment_id
    LEFT JOIN appointment a ON a.appointment_id = pt.appointment_id
    LEFT JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
    WHERE (pt.created_at::date BETWEEN $1::date AND $2::date)
      AND ($3::uuid IS NULL OR ts.branch_id = $3)
    GROUP BY t.category, t.treatment_name, t.cost
    ORDER BY "totalRevenue" DESC, "treatmentCount" DESC
  `,
    [filters.startDate, filters.endDate, filters.branchId ?? null]
  ).catch(() => ({ rows: [] }));

  return result.rows.map((row) => ({
    category: row.category,
    treatmentName: row.treatmentName,
    treatmentCount: parseInt(row.treatmentCount, 10) || 0,
    unitPrice: parseFloat(row.unitPrice) || 0,
    totalRevenue: parseFloat(row.totalRevenue) || 0,
  }));
}

// 5. Insurance Financial & Package Breakdown
export async function getInsuranceReport() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login?clear=1");

  const result = await db.query(`
    SELECT 
      ip.provider_name AS "providerName",
      ip.package_name AS "packageName",
      ip.copayment_percentage AS "copaymentPercentage",
      COUNT(i.insurance_id) AS "activePolicies",
      COALESCE(SUM(i.used_coverage_amount), 0) AS "totalUtilized"
    FROM insurance_package ip
    LEFT JOIN insurance i ON i.insurance_package_id = ip.insurance_package_id
    GROUP BY ip.provider_name, ip.package_name, ip.copayment_percentage
    ORDER BY "totalUtilized" DESC, "activePolicies" DESC
  `).catch(() => ({ rows: [] }));

  return result.rows.map((row) => ({
    providerName: row.providerName,
    packageName: row.packageName,
    copaymentPercentage: parseFloat(row.copaymentPercentage) || 0,
    activePolicies: parseInt(row.activePolicies, 10) || 0,
    totalUtilized: parseFloat(row.totalUtilized) || 0,
  }));
}

// 6. Branch Dropdown Options
export async function getBranchOptions() {
  const { rows } = await db.query(`
    SELECT branch_id AS "branchId", branch_name AS "branchName" 
    FROM branch 
    ORDER BY branch_name ASC
  `).catch(() => ({ rows: [] }));

  return rows;
}