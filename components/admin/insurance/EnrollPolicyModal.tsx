"use client";

import React, { useState, useEffect } from "react";
import { X, Search, UserCheck } from "lucide-react";
// 1. Import getPackages & Packages type from your insurance actions file
import { getPackages, type Packages } from "@/lib/actions/admin-insurance";
// 2. Import patient helpers from patient-insurance actions
import { 
  searchPatientsForEnrollment, 
  enrollPatientPolicy 
} from "@/lib/actions/admin-insurance";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnrollPolicyModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // Strongly typed to Packages[]
  const [packages, setPackages] = useState<Packages[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch only active packages when modal opens
  useEffect(() => {
    if (isOpen) {
      getPackages({ activeOnly: true }).then((data) => setPackages(data));
    }
  }, [isOpen]);

  // Live Patient Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch.length >= 2 && !selectedPatient) {
        searchPatientsForEnrollment(patientSearch).then(setPatientResults);
      } else {
        setPatientResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [patientSearch, selectedPatient]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return setError("Please search and select a patient.");
    if (!selectedPackageId) return setError("Please select an insurance package.");

    setLoading(true);
    setError(null);

    const res = await enrollPatientPolicy({
      patientId: selectedPatient.patientId,
      packageId: selectedPackageId,
      policyNumber,
      startDate,
      endDate,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to enroll patient.");
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/50">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Enroll Patient to Insurance</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Patient Lookup */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select Patient (Search by NIC or Name)
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedPatient.fullName}</p>
                    <p className="text-[10px] text-slate-500">NIC: {selectedPatient.nic}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type NIC or Name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {patientResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {patientResults.map((p) => (
                      <div
                        key={p.patientId}
                        onClick={() => setSelectedPatient(p)}
                        className="p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between"
                      >
                        <span className="font-semibold">{p.fullName}</span>
                        <span className="text-slate-400 font-mono">{p.nic}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Insurance Package Dropdown */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Insurance Package (Active Plans Only)
            </label>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full p-2.5 text-xs border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an active package</option>
              {packages.map((pkg) => (
                <option key={pkg.packageId} value={pkg.packageId}>
                  {pkg.providerName} - {pkg.packageName} (Limit: Rs. {pkg.annualLimit.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Policy Number */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Policy Number
            </label>
            <input
              type="text"
              placeholder="e.g., SLI-MED-2026-902"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="w-full p-2.5 text-xs border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Enrolling..." : "Enroll Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}