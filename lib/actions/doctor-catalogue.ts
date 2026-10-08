"use server";
import db from "@/lib/db";
import { requireDoctor } from "@/lib/server/doctorAuth";
import { fetchMedications, fetchTreatmentCatalogue } from "@/lib/server/sql/doctorCatalogue";
import type { Medication, TreatmentCatalogueItem } from "@/lib/types";

export async function getTreatmentCatalogue(): Promise<TreatmentCatalogueItem[]> {
  await requireDoctor();
  return fetchTreatmentCatalogue(db);
}

export async function getMedications(): Promise<Medication[]> {
  await requireDoctor();
  return fetchMedications(db);
}
