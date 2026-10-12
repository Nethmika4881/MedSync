"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";

export interface FrontDeskPatientSummary {
    patientId: string;
    fullName: string;
    dob: string;
    gender: string;
    bloodGroup: string | null;
    phone: string | null;
    email: string;
    nic: string;
    city: string | null;
    registeredBranchId: string;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
}

export async function getBranchPatients(
    branchId?: string,
    searchQuery?: string
): Promise<FrontDeskPatientSummary[]> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "receptionist" && user.role !== "admin" && user.role !== "doctor")) {
            return [];
        }

        // Enforce branch-level access control: non-admins are scoped to their assigned branch
        const effectiveBranchId = user.role === "admin" ? (branchId || user.branchId) : user.branchId;
        if (!effectiveBranchId && user.role !== "admin") {
            return [];
        }

        let sql = `
      SELECT
        p.patient_id AS "patientId",
        u.full_name AS "fullName",
        u.dob::text AS "dob",
        u.gender::text AS "gender",
        p.blood_group AS "bloodGroup",
        COALESCE(cn.number, p.emergency_contact_phone) AS "phone",
        u.email,
        u.nic,
        addr.city,
        p.registered_branch_id AS "registeredBranchId",
        p.emergency_contact_name AS "emergencyContactName",
        p.emergency_contact_phone AS "emergencyContactPhone"
      FROM patient p
      JOIN app_user u ON u.user_id = p.patient_id
      LEFT JOIN contact_number cn ON cn.contact_id = u.contact_id AND cn.is_primary = true
      LEFT JOIN address addr ON addr.address_id = u.address_id
      WHERE ($1::uuid IS NULL OR p.registered_branch_id = $1::uuid)
    `;

        const params: any[] = [effectiveBranchId || null];

        if (searchQuery && searchQuery.trim().length > 0) {
            params.push(`%${searchQuery.trim().toLowerCase()}%`);
            sql += ` AND (
        LOWER(u.full_name) LIKE $2
        OR LOWER(u.nic) LIKE $2
        OR cn.number LIKE $2
        OR p.patient_id::text LIKE $2
      )`;
        }

        sql += ` ORDER BY u.full_name ASC LIMIT 50`;

        const { rows } = await db.query(sql, params);
        return rows as FrontDeskPatientSummary[];
    } catch (error) {
        console.error("[getBranchPatients] Failed to fetch branch patients:", error);
        return [];
    }
}

export async function getBranchPatientById(patientId: string): Promise<FrontDeskPatientSummary | null> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "receptionist" && user.role !== "admin" && user.role !== "doctor")) {
            return null;
        }

        const effectiveBranchId = user.role === "admin" ? null : user.branchId;

        const sql = `
      SELECT
        p.patient_id AS "patientId",
        u.full_name AS "fullName",
        u.dob::text AS "dob",
        u.gender::text AS "gender",
        p.blood_group AS "bloodGroup",
        COALESCE(cn.number, p.emergency_contact_phone) AS "phone",
        u.email,
        u.nic,
        addr.city,
        p.registered_branch_id AS "registeredBranchId",
        p.emergency_contact_name AS "emergencyContactName",
        p.emergency_contact_phone AS "emergencyContactPhone"
      FROM patient p
      JOIN app_user u ON u.user_id = p.patient_id
      LEFT JOIN contact_number cn ON cn.contact_id = u.contact_id AND cn.is_primary = true
      LEFT JOIN address addr ON addr.address_id = u.address_id
      WHERE p.patient_id = $1::uuid AND ($2::uuid IS NULL OR p.registered_branch_id = $2::uuid)
    `;

        const { rows } = await db.query(sql, [patientId, effectiveBranchId]);
        return (rows[0] as FrontDeskPatientSummary) || null;
    } catch (error) {
        console.error("[getBranchPatientById] Failed to fetch patient:", error);
        return null;
    }
}
