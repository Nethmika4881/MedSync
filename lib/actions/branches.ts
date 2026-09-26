"use server";

import db from "../db";

export async function getBranches() {
  try {
    const result = await db.query(
      `select branch_id, branch_name from branch where is_active = true order by branch_name asc`,
    );
    return result.rows as { branch_id: string; branch_name: string }[];
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return [];
  }
}
