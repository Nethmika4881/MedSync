import type { Medication, TreatmentCatalogueItem, TreatmentCategory } from "@/lib/types";
import type { Queryable } from "./queryable";

export async function fetchTreatmentCatalogue(db: Queryable): Promise<TreatmentCatalogueItem[]> {
  const { rows } = await db.query(
    `SELECT treatment_service_code      AS "catalogueId",
            treatment_name              AS "name",
            category::TEXT              AS "category",
            COALESCE(description, '')   AS "description",
            base_price::float8          AS "unitPrice"
     FROM treatment_catalogue
     WHERE is_active IS NOT FALSE
     ORDER BY category, treatment_name`
  );

  return rows.map(
    (r): TreatmentCatalogueItem => ({
      catalogueId: String(r.catalogueId),
      name: String(r.name),
      category: String(r.category) as TreatmentCategory,
      description: String(r.description),
      unitPrice: Number(r.unitPrice),
    })
  );
}

export async function fetchMedications(db: Queryable): Promise<Medication[]> {
  const { rows } = await db.query(
    `SELECT medication_id   AS "medicationId",
            generic_name    AS "genericName",
            brand_name      AS "brandName",
            strength        AS "strength",
            form            AS "form",
            category        AS "category",
            contraindications AS "contraindications"
     FROM medication
     WHERE is_active IS NOT FALSE
     ORDER BY generic_name`
  );

  return rows.map(
    (r): Medication => ({
      medicationId: String(r.medicationId),
      genericName: String(r.genericName),
      brandName: r.brandName ? String(r.brandName) : undefined,
      strength: r.strength ? String(r.strength) : undefined,
      form: r.form ? String(r.form) : undefined,
      category: r.category ? String(r.category) : undefined,
      contraindications: r.contraindications ? String(r.contraindications) : undefined,
    })
  );
}