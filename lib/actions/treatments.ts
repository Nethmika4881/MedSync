"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface TreatmentInput {
  category: string;
  treatment_name: string;
  base_price: number | string;
  duration?: string;
  description?: string;
  is_insurable?: boolean;
}

export async function getTreatments() {
  try {
    const result = await db.query(`SELECT * FROM treatment_catalogue ORDER BY created_at DESC`);
    return { success: true, data: result.rows };
  } catch (error: any) {
    console.error("getTreatments error:", error);
    return { success: false, error: error.message };
  }
}

export async function createTreatment(formData: TreatmentInput) {
  try {
    const {
      category,
      treatment_name,
      base_price,
      duration = "00:15:00",
      description = "",
      is_insurable = true,
    } = formData;

    const result = await db.query(`INSERT INTO treatment_catalogue (category, treatment_name, base_price, duration, description, is_insurable)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [category, treatment_name, Number(base_price), duration, description, is_insurable]
    );

    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    console.error("createTreatment error:", error);
    return { success: false, error: error.message };
  }
}

export interface UpdateTreatmentInput {
  category: string;
  treatment_name: string;
  base_price: number | string;
  duration?: string;
  description?: string;
  is_insurable?: boolean;
  is_active?: boolean;
}

export async function updateTreatment(id: string, data: UpdateTreatmentInput) {
  try {
    const {
      category,
      treatment_name,
      base_price,
      duration = "00:15:00",
      description = "",
      is_insurable = true,
      is_active = true,
    } = data;

    const result = await db.query(`UPDATE treatment_catalogue SET category = $1, treatment_name = $2, base_price = $3, duration = $4, description = $5, is_insurable = $6, is_active = $7,updated_at = NOW()
      WHERE treatment_service_code = $8 RETURNING *;`,
      [category, treatment_name, Number(base_price), duration, description, is_insurable, is_active, id,]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Treatment not found" };
    }

    revalidatePath("/admin/treatments");
    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    console.error("updateTreatment error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTreatment(id: string) {
  try {
    const result = await db.query(`UPDATE treatment_catalogue SET is_active = false, updated_at = NOW() 
      WHERE treatment_service_code = $1 RETURNING *;`,
      [id]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Treatment not found" };
    }

    revalidatePath("/admin/treatments");
    return { success: true, message: "Treatment deactivated successfully" };
  } catch (error: any) {
    console.error("deleteTreatment error:", error);
    return { success: false, error: error.message };
  }
}