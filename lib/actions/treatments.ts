"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { z } from "zod";

export interface TreatmentInput {
  category: string;
  treatment_name: string;
  base_price: number | string;
  duration?: string;
  description?: string;
  is_insurable?: boolean;
}

export async function getTreatments(page = 1, pageSize = 10) {
  try {
    const currentPage = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Number(pageSize) || 10);
    const offset = (currentPage - 1) * limit;

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM treatment_catalogue WHERE is_active = TRUE`,
    );

    const result = await db.query(
      `SELECT * FROM treatment_catalogue WHERE is_active = TRUE ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const statsResult =
      await db.query(`SELECT category, COUNT(*) AS count, AVG(base_price) AS average_price
      FROM treatment_catalogue
      WHERE is_active = TRUE
      GROUP BY category`);

    const count = Number(countResult.rows[0]?.total) || 0;
    const pages = Math.ceil(count / limit);
    const stats = statsResult.rows.reduce<
      Record<string, { count: number; avgPrice: number }>
    >((summary, row) => {
      summary[row.category] = {
        count: Number(row.count) || 0,
        avgPrice: Number(row.average_price) || 0,
      };
      return summary;
    }, {});

    return {
      success: true,
      data: result.rows,
      stats,
      pagination: { count, pages, currentPage, pageSize: limit },
    };
  } catch (error: any) {
    console.error("getTreatments error:", error);
    return { success: false, error: error.message };
  }
}

export async function createTreatment(formData: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const parsedData = treatmentInputSchema.safeParse(formData);
    if (!parsedData.success) {
      return { success: false, error: parsedData.error.issues[0]?.message ?? "Invalid treatment details" };
    }
    const { category, treatment_name, base_price, duration, description, is_insurable } = parsedData.data;

    const result = await db.query(
      `INSERT INTO treatment_catalogue (category, treatment_name, base_price, duration, description, is_insurable)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [
        category,
        treatment_name,
        Number(base_price),
        duration,
        description,
        is_insurable,
      ],
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

const treatmentInputSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  treatment_name: z.string().trim().min(1, "Treatment name is required").max(100),
  base_price: z.coerce.number().finite().nonnegative("Base price cannot be negative"),
  duration: z.string().trim().min(1).default("00:15:00"),
  description: z.string().trim().max(1000).default(""),
  is_insurable: z.boolean().default(true),
});

const updateTreatmentInputSchema = treatmentInputSchema.extend({
  is_active: z.boolean().default(true),
});

const treatmentIdSchema = z.string().uuid("Invalid treatment ID");

export async function updateTreatment(id: string, data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const parsedId = treatmentIdSchema.safeParse(id);
    const parsedData = updateTreatmentInputSchema.safeParse(data);
    if (!parsedId.success || !parsedData.success) {
      return { success: false, error: "Invalid treatment details" };
    }

    const { category, treatment_name, base_price, duration, description, is_insurable, is_active } = parsedData.data;

    const result = await db.query(
      `UPDATE treatment_catalogue SET category = $1, treatment_name = $2, base_price = $3, duration = $4, description = $5, is_insurable = $6, is_active = $7,updated_at = NOW()
      WHERE treatment_service_code = $8 RETURNING *;`,
      [
        category,
        treatment_name,
        Number(base_price),
        duration,
        description,
        is_insurable,
        is_active,
        parsedId.data,
      ],
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
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const parsedId = treatmentIdSchema.safeParse(id);
    if (!parsedId.success) {
      return { success: false, error: "Invalid treatment ID" };
    }
    
    const result = await db.query(
      `UPDATE treatment_catalogue SET is_active = false, updated_at = NOW() 
      WHERE treatment_service_code = $1 RETURNING *;`,
      [parsedId.data],
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
