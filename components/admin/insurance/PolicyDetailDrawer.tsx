"use client";

import React, { useEffect, useState } from "react";
import { X, ShieldCheck, AlertCircle, FileText, Calendar, Building, CreditCard } from "lucide-react";
import { EnrolledPolicy, ClaimHistory, getPolicyClaims } from "@/lib/actions/admin-insurance";

interface DrawerProps {
  policy: EnrolledPolicy | null;
  onClose: () => void;
}

export function PolicyDetailDrawer({ policy, onClose }: DrawerProps) {
  const [claims, setClaims] = useState<ClaimHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (policy) {
      setLoading(true);
      getPolicyClaims(policy.insuranceId)
        .then(setClaims)
        .finally(() => setLoading(false));
    }
  }, [policy]);

  if (!policy) return null;

  const percentUsed = policy.annualLimit > 0 
    ? Math.min(100, Math.round((policy.usedCoverageAmount / policy.annualLimit) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                {policy.status}
              </span>
              <span className="text-xs font-mono text-slate-500">{policy.policyNumber}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {policy.patientName}
            </h2>
            <p className="text-xs text-slate-500">NIC: {policy.patientNic} • {policy.patientEmail}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Coverage Balance Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                {policy.providerName}
              </span>
              <span className="font-semibold">{policy.packageName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Remaining Balance</p>
                <p className="text-2xl font-bold text-emerald-400">
                  LKR {policy.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Annual Limit</p>
                <p className="text-lg font-semibold text-slate-200">
                  LKR {policy.annualLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${percentUsed > 80 ? "bg-rose-500" : "bg-emerald-400"}`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Used: LKR {policy.usedCoverageAmount.toLocaleString()} ({percentUsed}%)</span>
                <span>Copay: {policy.copaymentPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Policy Meta Information */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{policy.startDate}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" /> End Date
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{policy.endDate}</p>
            </div>
          </div>

          {/* Claims History */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Insurance Claims History
            </h3>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading claims...</p>
            ) : claims.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No hospital claims submitted against this policy yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {claims.map((c) => (
                  <div key={c.claimId} className="p-3.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-900 dark:text-slate-100">
                        Claimed: LKR {c.claimedAmount.toLocaleString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === "Approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                        c.status === "Rejected" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" :
                        "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span>Approved: LKR {c.approvedAmount.toLocaleString()}</span>
                      <span>{c.claimDate}</span>
                    </div>
                    {c.remarks && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">Note: {c.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}