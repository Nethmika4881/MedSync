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

const packageIdSchema = z.string().uuid("Invalid package ID");
const providerNameSchema = z.string().trim().min(1, "Provider name is required").max(100);
const insurerPackageSchema = z.object({
  packageName: z.string().trim().min(1).max(100),
  annualLimit: z.number().finite().nonnegative(),
  copaymentPercentage: z.number().finite().min(0).max(100),
  description: z.string().max(255),
});

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

export async function getPackages(): Promise<Packages[]> {
  try {
    const { rows } = await db.query(`
      SELECT 
        ip.insurance_package_id AS "packageId", ip.provider_name AS "providerName", ip.package_name AS "packageName",
        COALESCE(ip.annual_limit, 0) AS "annualLimit",
        COALESCE(ip.copayment_percentage, 0) AS "copaymentPercentage",
        ip.description, ip.is_active AS "isActive",
        COUNT(i.insurance_id) AS "enrolledCount",
        COALESCE(SUM(i.used_coverage_amount), 0) AS "totalUtilizedAmount"
      FROM insurance_package ip
      LEFT JOIN insurance i ON i.insurance_package_id = ip.insurance_package_id
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
  } 
  catch (error) {
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

// Insurance Packages via Third-Party API
export async function syncPackages(providerName: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized access." };
  }

  const parsedProvider = providerNameSchema.safeParse(providerName);
  if (!parsedProvider.success) {
    return { success: false, error: parsedProvider.error.issues[0]?.message ?? "Invalid provider name." };
  }

  try {
    //package catalog endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/mock/insurer/${encodeURIComponent(parsedProvider.data)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`External provider API responded with status ${res.status}`);
    }

    const responseSchema = z.object({ packages: z.array(insurerPackageSchema) });
    const parsedResponse = responseSchema.safeParse(await res.json());
    if (!parsedResponse.success) {
      return { success: false, error: "Invalid package data returned by provider API." };
    }
    const packages = parsedResponse.data.packages;

    if (packages.length === 0) {
      return { success: false, error: "No packages returned from provider API." };
    }

    //Upsert packages into Postgre
    const upsertQuery = `
      INSERT INTO insurance_package (
        provider_name, package_name, annual_limit, copayment_percentage, description, is_active, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
      ON CONFLICT (provider_name, package_name) 
      DO UPDATE SET
        annual_limit = EXCLUDED.annual_limit,
        copayment_percentage = EXCLUDED.copayment_percentage,
        description = EXCLUDED.description,
        updated_at = NOW()
    `;

    //transaction for saftey
    await db.query("BEGIN");

    for (const pkg of packages) {
      await db.query(upsertQuery, [
        parsedProvider.data,
        pkg.packageName,
        pkg.annualLimit,
        pkg.copaymentPercentage,
        pkg.description,
      ]);
    }

    await db.query("COMMIT");

    revalidatePath("/admin/insurance");
    return {success: true, message: `Successfully synced ${packages.length} package(s) from ${parsedProvider.data}.`,};
  } 
  catch (error: any) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("Failed to sync provider packages:", error);
    return {success: false, error: error.message || "Failed to reach provider API endpoint.",};
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