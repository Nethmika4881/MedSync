"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { PatientAllergy } from "@/lib/mockData/patientAllergies";
import type { PatientCondition } from "@/lib/mockData/conditions";

interface SafetyInfoBannerProps {
  patientName: string;
  allergies: PatientAllergy[];
  conditions: PatientCondition[];
}

export function SafetyInfoBanner({ patientName, allergies, conditions }: SafetyInfoBannerProps) {
  const activeAllergies = allergies.filter((a) => a.severity === "Severe" || a.severity === "Life-threatening");
  const allAllergies = allergies;
  const activeConditions = conditions.filter((c) => c.status === "Active");

  if (allAllergies.length === 0 && activeConditions.length === 0) return null;

  return (
    <div className="safety-banner animate-fade-in mb-6">
      <div className="shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
        </div>
      </div>
      <div className="flex-1">
        <p className="font-bold text-amber-900 text-sm mb-2">
          ⚠ Safety Notice — Review Before Treatment: {patientName}
        </p>
        {allAllergies.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {allAllergies.map((a) => (
                <span
                  key={a.allergyId}
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    a.severity === "Severe" || a.severity === "Life-threatening"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {(a.severity === "Severe" || a.severity === "Life-threatening") && (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {a.allergenName} ({a.severity})
                </span>
              ))}
            </div>
          </div>
        )}
        {activeConditions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Active Conditions</p>
            <div className="flex flex-wrap gap-2">
              {activeConditions.map((c) => (
                <span key={c.pcId} className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {c.conditionName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
