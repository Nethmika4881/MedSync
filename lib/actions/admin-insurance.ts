"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface Providers {
  providerName: string;
  totalPackages: number;
  activePackages: number;
  enrolledPoliciesCount: number;
  totalCoverageUtilized: number;
}

export interface Packages {
  packageId: string;
  providerName: string;
  packageName: string;
  annualLimit: number;
  copaymentPercentage: number;
  description: string | null;
  isActive: boolean;
  enrolledCount: number;
  totalUtilizedAmount: number;
}

export interface Stats {
  totalInsuredPatients: number;
  activePoliciesCount: number;
  totalCoverageUtilized: number;
  totalProvidersCount: number;
  totalPackagesCount: number;
}

export interface EnrolledPolicy {
  insuranceId: string;
  patientId: string;
  patientName: string;
  patientNic: string;
  patientEmail: string;
  providerName: string;
  packageName: string;
  policyNumber: string;
  annualLimit: number;
  usedCoverageAmount: number;
  remainingAmount: number;
  copaymentPercentage: number;
  status: "Active" | "Expired" | "Cancelled";
  startDate: string;
  endDate: string;
}

export interface PolicyResult {
  data: EnrolledPolicy[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface ClaimHistory {
  claimId: string;
  invoiceId: string;
  claimDate: string;
  claimedAmount: number;
  approvedAmount: number;
  status: string;
  settlementDate: string | null;
  remarks: string | null;
}

export interface ClaimItem {
  claimId: string;
  insuranceId: string;
  invoiceId: string;
  policyNumber: string;
  patientName: string;
  patientId: string;
  providerName: string;
  packageName: string;
  claimAmount: number;
  approvedAmount: number;
  copaymentPercentage: number;
  annualLimit: number;
  totalCoverageUtilized: number;
  status: "Submitted" | "Approved" | "Settled" | "Rejected";
  remarks: string | null;
  submittedAt: string;
  settledAt: string | null;
}

const packageIdSchema = z.string().uuid("Invalid package ID");

// 1. Executive Dashboard KPIs
export async function getStats(): Promise<Stats> {
  try {
    const [policyResults, packageResults] = await Promise.all([
      db.query(`
        SELECT 
          COUNT(DISTINCT patient_id) AS total_patients,
          COUNT(*) AS total_policies,
          COALESCE(SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END), 0) AS active_policies,
          COALESCE(SUM(used_coverage_amount), 0) AS total_utilized
        FROM insurance
      `).catch(() => ({ rows: [{ total_patients: "0", total_policies: "0", active_policies: "0", total_utilized: "0" }] })),

      db.query(`
        SELECT 
          COUNT(DISTINCT provider_name) AS total_providers,
          COUNT(*) AS total_packages
        FROM insurance_package
      `).catch(() => ({ rows: [{ total_providers: "0", total_packages: "0" }] })),
    ]);

    return {
      totalInsuredPatients: parseInt(policyResults.rows[0].total_patients, 10) || 0,
      activePoliciesCount: parseInt(policyResults.rows[0].active_policies, 10) || 0,
      totalCoverageUtilized: parseFloat(policyResults.rows[0].total_utilized) || 0,
      totalProvidersCount: parseInt(packageResults.rows[0].total_providers, 10) || 0,
      totalPackagesCount: parseInt(packageResults.rows[0].total_packages, 10) || 0,
    };
  } 
  catch (error) {
    console.error("Failed to load insurance stats:", error);
    return {
      totalInsuredPatients: 0,
      activePoliciesCount: 0,
      totalCoverageUtilized: 0,
      totalProvidersCount: 0,
      totalPackagesCount: 0,
    };
  }
}

export async function getProviders(): Promise<Providers[]> {
  try {
    const { rows } = await db.query(`
      SELECT 
        ip.provider_name AS "providerName",
        COUNT(DISTINCT ip.insurance_package_id) AS "totalPackages",
        COALESCE(SUM(CASE WHEN ip.is_active = true THEN 1 ELSE 0 END), 0) AS "activePackages",
        COUNT(i.insurance_id) AS "enrolledPoliciesCount",
        COALESCE(SUM(i.used_coverage_amount), 0) AS "totalCoverageUtilized"
      FROM insurance_package ip
      LEFT JOIN insurance i ON i.insurance_package_id = ip.insurance_package_id
      GROUP BY ip.provider_name
      ORDER BY ip.provider_name ASC
    `);

    return rows.map((provider) => ({
      providerName: provider.providerName,
      totalPackages: parseInt(provider.totalPackages, 10) || 0,
      activePackages: parseInt(provider.activePackages, 10) || 0,
      enrolledPoliciesCount: parseInt(provider.enrolledPoliciesCount, 10) || 0,
      totalCoverageUtilized: parseFloat(provider.totalCoverageUtilized) || 0,
    }));
  } 
  catch (error) {
    console.error("Failed to load insurance providers:", error);
    return [];
  }
}

export async function getPackages(options?: { activeOnly?: boolean }): Promise<Packages[]> {
  try {
    const activeCondition = options?.activeOnly ? "WHERE ip.is_active = TRUE" : "";

    const { rows } = await db.query(`
      SELECT 
        ip.insurance_package_id AS "packageId", 
        ip.provider_name AS "providerName", 
        ip.package_name AS "packageName",
        COALESCE(ip.annual_limit, 0) AS "annualLimit",
        COALESCE(ip.copayment_percentage, 0) AS "copaymentPercentage",
        ip.description, 
        ip.is_active AS "isActive",
        COUNT(i.insurance_id) AS "enrolledCount",
        COALESCE(SUM(i.used_coverage_amount), 0) AS "totalUtilizedAmount"
      FROM insurance_package ip
      LEFT JOIN insurance i ON i.insurance_package_id = ip.insurance_package_id
      ${activeCondition}
      GROUP BY 
        ip.insurance_package_id, ip.provider_name, ip.package_name, ip.annual_limit, ip.copayment_percentage, ip.description, ip.is_active
      ORDER BY "enrolledCount" DESC, ip.package_name ASC
    `);

    return rows.map((pkg) => ({
      packageId: pkg.packageId,
      providerName: pkg.providerName,
      packageName: pkg.packageName,
      annualLimit: parseFloat(pkg.annualLimit) || 0,
      copaymentPercentage: parseFloat(pkg.copaymentPercentage) || 0,
      description: pkg.description,
      isActive: Boolean(pkg.isActive),
      enrolledCount: parseInt(pkg.enrolledCount, 10) || 0,
      totalUtilizedAmount: parseFloat(pkg.totalUtilizedAmount) || 0,
    }));
  } catch (error) {
    console.error("Failed to load insurance packages:", error);
    return [];
  }
}

export async function togglePackageStatus(packageId: string, currentStatus: boolean) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized access." };
  }

  const parsedId = packageIdSchema.safeParse(packageId);
  if (!parsedId.success || typeof currentStatus !== "boolean") {
    return { success: false, error: "Invalid package details." };
  }

  try {
    await db.query(
      `UPDATE insurance_package SET is_active = $1, updated_at = NOW() WHERE insurance_package_id = $2`,
      [!currentStatus, parsedId.data]
    );

    revalidatePath("/admin/insurance");
    return { success: true, message: `Package ${!currentStatus ? "activated" : "deactivated"} successfully.` };
  } 
  catch (error: any) {
    console.error("Failed to toggle package status:", error);
    return { success: false, error: error.message || "Failed to update package." };
  }
}

export async function deletePackages(packageId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized access." };
  }

  const parsedId = packageIdSchema.safeParse(packageId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid package ID." };
  }

  try {
    const check = await db.query(
      `SELECT COUNT(*) AS enrolled_count FROM insurance WHERE insurance_package_id = $1`,
      [parsedId.data]
    );
    const enrolledCount = parseInt(check.rows[0]?.enrolled_count, 10) || 0;

    if (enrolledCount > 0) {
      await db.query(
        `UPDATE insurance_package SET is_active = FALSE, updated_at = NOW() WHERE insurance_package_id = $1`,
        [parsedId.data]
      );

      revalidatePath("/admin/insurance");
      revalidatePath("/admin/insurance/packages");
      return {success: true, action: "deactivated", message: `Package has ${enrolledCount} patient policies linked. It was safely deactivated instead of deleted to protect patient history.`,};
    }

    await db.query(`DELETE FROM insurance_package WHERE insurance_package_id = $1`, [parsedId.data]);

    revalidatePath("/admin/insurance");
    revalidatePath("/admin/insurance/packages");
    return {success: true, action: "deleted", message: "Package deleted successfully.",};
  } 
  catch (error: any) {
    console.error("Failed to delete insurance package:", error);
    return { success: false, error: error.message || "Failed to remove package." };
  }
}

export async function getEnrolledPolicies({page = 1, pageSize = 10, search = "", provider = "ALL", status = "ALL",}: {
  page?: number;
  pageSize?: number;
  search?: string;
  provider?: string;
  status?: string;
}): Promise<PolicyResult> {

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return {data: [], pagination: { page: 1, pageSize, totalCount: 0, totalPages: 0 },};
  }

  const offset = (page - 1) * pageSize;
  const values: any[] = [];
  const whereClauses: string[] = [];

  if (search.trim()) {
    values.push(`%${search.trim()}%`);
    const idx = values.length;
    whereClauses.push(`(u.full_name ILIKE $${idx} OR u.nic ILIKE $${idx} OR i.policy_number ILIKE $${idx})`);
  }

  if (provider && provider !== "ALL") {
    values.push(provider);
    whereClauses.push(`ip.provider_name = $${values.length}`);
  }

  if (status && status !== "ALL") {
    values.push(status);
    whereClauses.push(`i.status = $${values.length}::policy_status_enum`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  values.push(pageSize, offset);
  const limitIdx = values.length - 1;
  const offsetIdx = values.length;

  const query = `
    SELECT 
      i.insurance_id AS "insuranceId",
      i.patient_id AS "patientId",
      u.full_name AS "patientName",
      u.nic AS "patientNic",
      u.email AS "patientEmail",
      ip.provider_name AS "providerName",
      ip.package_name AS "packageName",
      i.policy_number AS "policyNumber",
      COALESCE(ip.annual_limit, 0)::numeric AS "annualLimit",
      COALESCE(i.used_coverage_amount, 0)::numeric AS "usedCoverageAmount",
      (COALESCE(ip.annual_limit, 0) - COALESCE(i.used_coverage_amount, 0))::numeric AS "remainingAmount",
      COALESCE(ip.copayment_percentage, 0)::numeric AS "copaymentPercentage",
      i.status::text AS "status",
      to_char(i.start_date, 'YYYY-MM-DD') AS "startDate",
      to_char(i.end_date, 'YYYY-MM-DD') AS "endDate",
      COUNT(*) OVER()::int AS "totalCount"
    FROM insurance i
    JOIN patient p ON p.patient_id = i.patient_id
    JOIN app_user u ON u.user_id = p.patient_id
    JOIN insurance_package ip ON ip.insurance_package_id = i.insurance_package_id
    ${whereSql}
    ORDER BY i.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `;

  try {
    const { rows } = await db.query(query, values);
    const totalCount = rows[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const formattedData: EnrolledPolicy[] = rows.map((r: any) => ({
      insuranceId: r.insuranceId,
      patientId: r.patientId,
      patientName: r.patientName,
      patientNic: r.patientNic,
      patientEmail: r.patientEmail,
      providerName: r.providerName,
      packageName: r.packageName,
      policyNumber: r.policyNumber,
      annualLimit: parseFloat(r.annualLimit) || 0,
      usedCoverageAmount: parseFloat(r.usedCoverageAmount) || 0,
      remainingAmount: Math.max(0, parseFloat(r.remainingAmount) || 0),
      copaymentPercentage: parseFloat(r.copaymentPercentage) || 0,
      status: r.status,
      startDate: r.startDate,
      endDate: r.endDate,
    }));

    return {
      data: formattedData,
      pagination: { page, pageSize, totalCount, totalPages },
    };
  } 
  catch (error) {
    console.error("Error fetching enrolled policies:", error);
    return {
      data: [],
      pagination: { page: 1, pageSize, totalCount: 0, totalPages: 0 },
    };
  }
}

export async function getPolicyClaims(insuranceId: string): Promise<ClaimHistory[]> {
  try {
    const { rows } = await db.query(
      `
      SELECT 
        claim_id AS "claimId",
        invoice_id AS "invoiceId",
        to_char(claim_date, 'DD Mon YYYY, HH:MI AM') AS "claimDate",
        claimed_amount::numeric AS "claimedAmount",
        approved_amount::numeric AS "approvedAmount",
        status::text AS "status",
        to_char(settlement_date, 'DD Mon YYYY') AS "settlementDate",
        remarks
      FROM insurance_claim
      WHERE insurance_id = $1
      ORDER BY claim_date DESC;
      `,
      [insuranceId]
    );

    return rows.map((c: any) => ({
      claimId: c.claimId,
      invoiceId: c.invoiceId,
      claimDate: c.claimDate,
      claimedAmount: parseFloat(c.claimedAmount),
      approvedAmount: parseFloat(c.approvedAmount),
      status: c.status,
      settlementDate: c.settlementDate,
      remarks: c.remarks,
    }));
  } 
  catch (error) {
    console.error("Error fetching policy claims:", error);
    return [];
  }
}

export async function searchPatientsForEnrollment(term: string) {
  if (!term || term.trim().length < 2) return [];

  const { rows } = await db.query(
    `
    SELECT p.patient_id AS "patientId", u.full_name AS "fullName", u.nic, u.email
    FROM patient p
    JOIN app_user u ON u.user_id = p.patient_id
    WHERE (u.full_name ILIKE $1 OR u.nic ILIKE $1) AND u.is_active = TRUE
    LIMIT 8;
    `,
    [`%${term.trim()}%`]
  );
  return rows;
}

const enrollPolicySchema = z.object({
  patientId: z.string().uuid("Invalid patient selected"),
  packageId: z.string().uuid("Invalid package selected"),
  policyNumber: z.string().trim().min(3, "Policy number is required").max(50),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export async function enrollPatientPolicy(data: unknown) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") 
    return { success: false, error: "Unauthorized" };

  const parsed = enrollPolicySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { patientId, packageId, policyNumber, startDate, endDate } = parsed.data;

  try {
    const pkgCheck = await db.query(
      `SELECT is_active FROM insurance_package WHERE insurance_package_id = $1`,
      [packageId]
    );
    if (!pkgCheck.rows[0]?.is_active) {
      return { success: false, error: "Selected insurance package is inactive or discontinued." };
    }

    await db.query(
      `INSERT INTO insurance (
        patient_id, insurance_package_id, policy_number, start_date, end_date, status
      )
      VALUES ($1, $2, $3, $4, $5, 'Active')`,
      [patientId, packageId, policyNumber, startDate, endDate]
    );

    revalidatePath("/admin/insurance");
    return { success: true, message: "Policy enrolled successfully." };
  } 
  catch (error: any) {
    if (error.code === "23505") {
      return { success: false, error: "A policy with this policy number already exists." };
    }
    return { success: false, error: error.message || "Failed to enroll policy." };
  }
}

const approveClaimSchema = z.object({
  claimId: z.string().min(1),
  approvedAmount: z.number().positive(),
  remarks: z.string().max(255).optional(),
});

// 1. Fetch claims queue
export async function getClaimsQueue(statusFilter?: string): Promise<ClaimItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role?.toLowerCase() !== "admin") {
    throw new Error("Unauthorized access.");
  }

  let query = `
    SELECT 
      c.claim_id AS "claimId",
      c.insurance_id AS "insuranceId",
      c.invoice_id AS "invoiceId",
      COALESCE(i.policy_number, 'N/A') AS "policyNumber",
      COALESCE(u.full_name, 'Unknown Patient') AS "patientName",
      i.patient_id AS "patientId",
      pkg.provider_name AS "providerName",
      pkg.package_name AS "packageName",
      c.claimed_amount AS "claimAmount",
      COALESCE(c.approved_amount, 0) AS "approvedAmount",
      pkg.copayment_percentage AS "copaymentPercentage",
      COALESCE(pkg.annual_limit, 0) AS "annualLimit",
      COALESCE(i.used_coverage_amount, 0) AS "totalCoverageUtilized",
      c.status::TEXT AS "status",
      c.remarks AS "remarks",
      c.claim_date AS "submittedAt",
      c.settlement_date AS "settledAt"
    FROM insurance_claim c
    JOIN insurance i ON c.insurance_id = i.insurance_id
    JOIN insurance_package pkg ON i.insurance_package_id = pkg.insurance_package_id
    JOIN patient p ON i.patient_id = p.patient_id
    JOIN app_user u ON p.patient_id = u.user_id
  `;

  const params: any[] = [];
  if (statusFilter && statusFilter.toUpperCase() !== "ALL") {
    // Map PENDING tab to 'Submitted' enum in database
    const mappedStatus = statusFilter.toUpperCase() === "PENDING" ? "Submitted" : statusFilter;
    params.push(mappedStatus);
    query += ` WHERE LOWER(c.status::TEXT) = LOWER($1)`;
  }

  query += ` ORDER BY c.claim_date DESC`;

  const result = await db.query(query, params);
  return result.rows;
}

// 2. Approve Claim
export async function approveClaim(formData: {
  claimId: string;
  approvedAmount: number;
  remarks?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role?.toLowerCase() !== "admin") {
    return { success: false, error: "Unauthorized access." };
  }

  const parsed = approveClaimSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." };
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const claimRes = await client.query(
      `SELECT claim_id, insurance_id, claimed_amount, status::TEXT FROM insurance_claim WHERE claim_id = $1 FOR UPDATE`,
      [parsed.data.claimId]
    );

    if (claimRes.rows.length === 0) {
      throw new Error("Claim record not found.");
    }

    const claim = claimRes.rows[0];
    if (claim.status.toLowerCase() !== "submitted") {
      throw new Error(`Cannot approve claim with status '${claim.status}'.`);
    }

    if (parsed.data.approvedAmount > Number(claim.claimed_amount)) {
      throw new Error("Approved amount cannot exceed the requested claim amount.");
    }

    // Update insurance_claim
    await client.query(
      `UPDATE insurance_claim 
       SET status = 'Approved', 
           approved_amount = $1, 
           remarks = $2, 
           updated_at = NOW() 
       WHERE claim_id = $3`,
      [parsed.data.approvedAmount, parsed.data.remarks ?? null, parsed.data.claimId]
    );

    // Update used_coverage_amount on the insurance policy
    await client.query(
      `UPDATE insurance 
       SET used_coverage_amount = used_coverage_amount + $1, 
           updated_at = NOW() 
       WHERE insurance_id = $2`,
      [parsed.data.approvedAmount, claim.insurance_id]
    );

    await client.query("COMMIT");

    revalidatePath("/admin/insurance");
    revalidatePath("/admin/insurance/claims");
    return { success: true, message: "Claim approved successfully." };
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve claim.",
    };
  } finally {
    client.release();
  }
}

// 3. Settle Claim
export async function settleClaim(claimId: string) {
  const user = await getCurrentUser();
  if (!user || user.role?.toLowerCase() !== "admin") {
    return { success: false, error: "Unauthorized access." };
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const claimRes = await client.query(
      `SELECT claim_id, status::TEXT FROM insurance_claim WHERE claim_id = $1 FOR UPDATE`,
      [claimId]
    );

    if (claimRes.rows.length === 0) {
      throw new Error("Claim not found.");
    }

    if (claimRes.rows[0].status.toLowerCase() !== "approved") {
      throw new Error("Only approved claims can be marked as settled.");
    }

    await client.query(
      `UPDATE insurance_claim 
       SET status = 'Settled', 
           settlement_date = NOW(), 
           updated_at = NOW() 
       WHERE claim_id = $1`,
      [claimId]
    );

    await client.query("COMMIT");

    revalidatePath("/admin/insurance");
    revalidatePath("/admin/insurance/claims");
    return { success: true, message: "Claim marked as settled." };
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to settle claim.",
    };
  } finally {
    client.release();
  }
}

// 4. Reject Claim
export async function rejectClaim(claimId: string, remarks: string) {
  const user = await getCurrentUser();
  if (!user || user.role?.toLowerCase() !== "admin") {
    return { success: false, error: "Unauthorized access." };
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const claimRes = await client.query(
      `SELECT claim_id, status::TEXT FROM insurance_claim WHERE claim_id = $1 FOR UPDATE`,
      [claimId]
    );

    if (claimRes.rows.length === 0) {
      throw new Error("Claim not found.");
    }

    if (claimRes.rows[0].status.toLowerCase() !== "submitted") {
      throw new Error("Only pending submitted claims can be rejected.");
    }

    await client.query(
      `UPDATE insurance_claim 
       SET status = 'Rejected', 
           remarks = $1, 
           updated_at = NOW() 
       WHERE claim_id = $2`,
      [remarks || "Rejected by administrator", claimId]
    );

    await client.query("COMMIT");

    revalidatePath("/admin/insurance");
    revalidatePath("/admin/insurance/claims");
    return { success: true, message: "Claim rejected." };
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject claim.",
    };
  } finally {
    client.release();
  }
}
