"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { ContraindicationResult } from "@/lib/contraindication";

interface ContraindicationBannerProps {
  result: ContraindicationResult;
}

export function ContraindicationBanner({ result }: ContraindicationBannerProps) {
  if (!result.conflict) return null;

  return (
    <div className="contraindication-banner animate-fade-in">
      <div className="shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
      </div>
      <div>
        <p className="font-semibold text-red-800 text-sm">
          ⚠ Contraindication Alert — Do Not Prescribe
        </p>
        <p className="text-red-700 text-sm mt-0.5">
          <strong>{result.medicationName}</strong> is contraindicated for this patient due to a documented{" "}
          <strong>{result.allergyName}</strong> allergy
          {result.severity ? ` (Severity: ${result.severity})` : ""}.
        </p>
        <p className="text-red-600 text-xs mt-1">
          This patient has a known allergy to this medication or its drug class. Prescribing may cause
          a life-threatening reaction. Please select an alternative treatment.
        </p>
      </div>
    </div>
  );
}

interface ContraindicationRowBadgeProps {
  patientName: string;
  allergyName: string;
}

export function ContraindicationRowBadge({ patientName, allergyName }: ContraindicationRowBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" />
      Allergy: {allergyName}
    </span>
  );
}
