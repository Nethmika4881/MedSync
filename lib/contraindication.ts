/**
 * Shared contraindication checker used by:
 * - Doctor Consultation screen
 * - Pharmacist Prescription Queue
 *
 * Never duplicated — always imported from this single file.
 */

import type { PatientAllergy } from "@/lib/types";;
import type { Medication } from "@/lib/types";;

export interface ContraindicationResult {
  conflict: boolean;
  allergyName?: string;
  medicationName?: string;
  severity?: string;
}

/**
 * Checks if a specific medication conflicts with any of the patient's allergies.
 * Uses case-insensitive string matching on contraindications field + allergy name.
 */
export function checkContraindication(
  patientAllergies: PatientAllergy[],
  medication: Medication
): ContraindicationResult {
  for (const allergy of patientAllergies) {
    const allergyLower = allergy.allergenName.toLowerCase();
    const contraindicationsLower = (medication.contraindications || "").toLowerCase();
    const medicationNameLower = medication.genericName.toLowerCase();

    // Match if allergy name appears in medication's contraindications string
    // OR if medication name matches the allergy name (e.g., patient allergic to "Penicillin" and medication is Penicillin)
    if (
      contraindicationsLower.includes(allergyLower) ||
      medicationNameLower.includes(allergyLower) ||
      allergyLower.includes(medicationNameLower)
    ) {
      return {
        conflict: true,
        allergyName: allergy.allergenName,
        medicationName: medication.genericName,
        severity: allergy.severity,
      };
    }
  }

  return { conflict: false };
}

/**
 * Checks multiple medications against patient allergies — used in pharmacist queue.
 * Returns array of conflicts found.
 */
export function checkAllContraindications(
  patientAllergies: PatientAllergy[],
  medications: Medication[]
): ContraindicationResult[] {
  return medications
    .map(med => checkContraindication(patientAllergies, med))
    .filter(r => r.conflict);
}
