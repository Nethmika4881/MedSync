"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";

export interface Branches {
  branchId: string;
  branchName: string;
  isActive: boolean;
  city: string;
  province: string;
  managerName: string;
  doctorCount: number;
  staffCount: number;
  patientCount: number;
}

export interface Financials {
  totalRevenue: number;
  outstandingBalance: number;
  totalBilled: number;
  unpaidInvoicesCount: number;
}

export interface DailyOperations {
  todayAppointmentsCount: number;
  todayCompletedCount: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  appointments: number;
}

export interface DashboardData {
  totals: {
    activeBranches: number;
    totalBranches: number;
    totalDoctors: number;
    totalFrontdesk: number;
    totalAdmins: number;
    unassignedStaff: number;
    totalPatients: number;
  };
  financials: Financials;
  dailyOperations: DailyOperations;
  monthlyTrend: MonthlyTrend[];
  branches: Branches[];
}

export async function getDashboardData(): Promise<DashboardData | null> {
  try {
    // 1. Role Gate
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return null;
    }

    const [branchesResult, employeesResult, patientsResult, financialsResult, operationsResult, revenueResult, appointmentsResult,] = await Promise.all([
      db.query(`
        SELECT b.branch_id, b.branch_name, b.is_active, b.manager_id, a.city, a.province, u.full_name AS manager_name 
        FROM branch b
        LEFT JOIN address a ON b.address_id = a.address_id
        LEFT JOIN app_user u ON b.manager_id = u.user_id
        ORDER BY b.created_at ASC
      `),

      db.query(`SELECT employee_id, branch_id, role, is_active FROM employee`),

      db.query(`SELECT patient_id, registered_branch_id FROM patient`),

      //Finance
      db.query(`
        SELECT 
          COALESCE(SUM(paid_amount), 0) AS "totalRevenue",
          COALESCE(SUM(due_amount), 0)  AS "outstandingBalance",
          COALESCE(SUM(net_amount), 0)  AS "totalBilled",
          COUNT(invoice_id) FILTER (WHERE status IN ('Unpaid', 'PartiallyPaid')) AS "unpaidCount"
        FROM invoice
      `),

      //Today's Appointments
      db.query(`
        SELECT 
          COUNT(a.appointment_id) AS "todayAppointments",
          COUNT(a.appointment_id) FILTER (WHERE a.status = 'Completed') AS "todayCompleted"
        FROM appointment a
        JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
        WHERE ts.available_date = CURRENT_DATE
      `),

      //for Charts
      db.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') AS month_key,
          TO_CHAR(created_at, 'Mon') AS month,
          SUM(paid_amount) AS revenue
        FROM invoice
        WHERE created_at >= CURRENT_DATE - INTERVAL '5 months'
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `),

      db.query(`
      SELECT 
        TO_CHAR(ts.available_date, 'YYYY-MM') AS month_key,
        COUNT(a.appointment_id) AS appointments
      FROM appointment a
      JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
      WHERE a.status = 'Completed'
        AND ts.available_date >= CURRENT_DATE - INTERVAL '5 months'
      GROUP BY 1
      ORDER BY 1 ASC
      `),
    ]);

    const revMap = new Map<string, { month: string; revenue: number }>(
      revenueResult.rows.map((r) => [
        r.month_key,
        { month: r.month, revenue: Number(r.revenue) || 0 },
      ])
    );
    const apptMap = new Map<string, number>(
      appointmentsResult.rows.map((r) => [r.month_key, Number(r.appointments) || 0])
    );

    // Generate last 6 months
    const monthlyTrend: MonthlyTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const monthName = d.toLocaleString("en-US", { month: "short" });

      monthlyTrend.push({
        month: monthName,
        revenue: revMap.get(key)?.revenue || 0,
        appointments: apptMap.get(key) || 0,
      });
    }

    const branchesList: Branches[] = branchesResult.rows.map((b) => {
      const branchStaff = employeesResult.rows.filter((emp) => emp.branch_id === b.branch_id && emp.is_active);
      const branchPatients = patientsResult.rows.filter((p) => p.registered_branch_id === b.branch_id);

      return {
        branchId: b.branch_id,
        branchName: b.branch_name,
        isActive: b.is_active,
        city: b.city,
        province: b.province,
        managerName: b.manager_name || "Unassigned",
        doctorCount: branchStaff.filter((emp) => emp.role === "Doctor").length,
        staffCount: branchStaff.filter((emp) => emp.role !== "Doctor").length,
        patientCount: branchPatients.length,
      };
    });

    return {
      totals: {
        activeBranches: branchesList.filter((b) => b.isActive).length,
        totalBranches: branchesList.length,
        totalDoctors: employeesResult.rows.filter((e) => e.role === "Doctor" && e.is_active).length,
        totalFrontdesk: employeesResult.rows.filter((e) => e.role === "FrontDesk" && e.is_active).length,
        totalAdmins: employeesResult.rows.filter((e) => e.role === "Admin" && e.is_active).length,
        unassignedStaff: employeesResult.rows.filter(
          (e) => !branchesList.some((b) => b.branchId === e.branch_id) && e.is_active
        ).length,
        totalPatients: patientsResult.rows.length,
      },
      financials: {
        totalRevenue: Number(financialsResult.rows[0]?.totalRevenue) || 0,
        outstandingBalance: Number(financialsResult.rows[0]?.outstandingBalance) || 0,
        totalBilled: Number(financialsResult.rows[0]?.totalBilled) || 0,
        unpaidInvoicesCount: Number(financialsResult.rows[0]?.unpaidCount) || 0,
      },
      dailyOperations: {
        todayAppointmentsCount: Number(operationsResult.rows[0]?.todayAppointments) || 0,
        todayCompletedCount: Number(operationsResult.rows[0]?.todayCompleted) || 0,
      },
      monthlyTrend,
      branches: branchesList,
    };
  } catch (error) {
    console.error("[getDashboardData] Error loading admin dashboard:", error);
    return null;
  }
}