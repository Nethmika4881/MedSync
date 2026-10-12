"use server";
import db from "@/lib/db";
import { requireDoctor } from "@/lib/server/doctorAuth";
import { fetchMedications, fetchTreatmentCatalogue } from "@/lib/server/sql/doctorCatalogue";
import type { Medication, TreatmentCatalogueItem, TreatmentCategory } from "@/lib/types";

export async function getTreatmentCatalogue(): Promise<TreatmentCatalogueItem[]> {
  await requireDoctor();
  return fetchTreatmentCatalogue(db);
}

export async function getMedications(): Promise<Medication[]> {
  await requireDoctor();
  return fetchMedications(db);
}

export async function createCustomTreatment(name: string): Promise<TreatmentCatalogueItem> {
  await requireDoctor();
  const cleanName = name.trim().slice(0, 100);
  if (!cleanName) throw new Error("Enter a treatment or procedure name.");
  const { rows } = await db.query(
    `INSERT INTO treatment_catalogue (category, treatment_name, base_price, description, is_insurable, is_active)
     VALUES ('Other', $1, 0, 'Added from doctor consultation', FALSE, TRUE)
     RETURNING treatment_service_code AS "catalogueId", treatment_name AS "name",
               category::text AS "category", COALESCE(description, '') AS "description",
               base_price::float8 AS "unitPrice"`,
    [cleanName],
  );
  const row = rows[0];
  return {
    catalogueId: String(row.catalogueId),
    name: String(row.name),
    category: String(row.category) as TreatmentCategory,
    description: String(row.description),
    unitPrice: Number(row.unitPrice),
  };
}

export async function createCustomMedication(name: string): Promise<Medication> {
  await requireDoctor();
  const cleanName = name.trim().slice(0, 100);
  if (!cleanName) throw new Error("Enter a medication name.");
  const { rows } = await db.query(
    `INSERT INTO medication (generic_name, brand_name)
     VALUES ($1, NULL)
     RETURNING medication_id AS "medicationId", generic_name AS "genericName", brand_name AS "brandName"`,
    [cleanName],
  );
  return {
    medicationId: String(rows[0].medicationId),
    genericName: String(rows[0].genericName),
    brandName: undefined,
  };
}
