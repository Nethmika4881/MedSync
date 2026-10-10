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
      `select
      u.user_id,
      u.full_name,
      u.email,
      u.user_type,
      e.role,
      e.branch_id AS employee_branch_id,
      e.is_active AS employee_is_active,
      p.registered_branch_id AS patient_branch_id
   from app_user u
   left join   employee e ON e.employee_id = u.user_id
   left join  patient p ON p.patient_id = u.user_id
   where u.user_id = $1
     and u.is_active = true`,
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