import { cookies } from "next/headers";
import { cache } from "react";
import { getUserfromSession } from "./sessions";
import db from "../db";
import type { AuthUser, UserRole } from "../types";
import type { UserLoginRole } from "../schemas";

const pageRoles: Record<UserLoginRole, UserRole> = {
  Admin: "admin",
  Doctor: "doctor",
  FrontDesk: "receptionist",
  Patient: "patient",
};

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const session = await getUserfromSession(await cookies());
    if (!session) return null;

    const result = await db.query(
      `SELECT u.user_id, u.full_name, u.email,
              COALESCE(e.branch_id, p.registered_branch_id) AS branch_id,
              CASE WHEN u.user_type = 'Patient' THEN 'Patient'
                   ELSE e.role::text END AS login_role
       FROM app_user u
       LEFT JOIN employee e ON e.employee_id = u.user_id
       LEFT JOIN patient p ON p.patient_id = u.user_id
       WHERE u.user_id = $1 AND u.is_active = true
         AND (u.user_type = 'Patient' OR e.is_active = true)`,
      [session.id],
    );
    const user = result.rows[0];
    if (!user || user.login_role !== session.role) return null;

    return {
      userId: user.user_id,
      name: user.full_name,
      firstName: user.full_name.split(" ")[0],
      email: user.email,
      branchId: user.branch_id,
      role: pageRoles[session.role],
      avatar: user.full_name.slice(0, 2).toUpperCase(),
      blurb: "",
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("[auth/getCurrentUser] Could not load user:", error);
    return null;
  }
});