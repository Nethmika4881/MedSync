"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, MapPin, RotateCcw, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAdminPatients,
  type AdminBranchOption,
  type AdminPatientSummary,
} from "@/lib/actions/admin-patients";

interface AdminPatientsClientProps {
  initialPatients: AdminPatientSummary[];
  branches: AdminBranchOption[];
}

function calculateAge(dob: string): number | null {
  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const birthdayHasNotOccurred =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (birthdayHasNotOccurred) {
    age -= 1;
  }

  return Math.max(0, age);
}

export default function AdminPatientsClient({
  initialPatients,
  branches,
}: AdminPatientsClientProps) {
  const router = useRouter();
  const firstRender = useRef(true);

  const [patients, setPatients] =
    useState<AdminPatientSummary[]>(initialPatients);
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startTransition] = useTransition();

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        try {
          setError(null);

          const results = await getAdminPatients({
            search: search.trim() || undefined,
            branchId: branchId || undefined,
          });

          if (!cancelled) {
            setPatients(results);
          }
        } catch (searchError) {
          console.error("Failed to search admin patients:", searchError);

          if (!cancelled) {
            setError("Unable to load patients. Please try again.");
          }
        }
      });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search, branchId]);

  function clearFilters() {
    setSearch("");
    setBranchId("");
    setPatients(initialPatients);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Patient Directory
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Read-only patient oversight across clinic branches.
        </p>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--brand-primary)]" />
              ) : (
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              )}

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, patient ID, NIC, or phone"
                aria-label="Search patients"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>

            <div className="relative md:w-72">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                aria-label="Filter patients by branch"
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm text-slate-700 outline-none transition focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                <option value="">All branches</option>

                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="h-11 rounded-xl"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--brand-primary)]" />

            <h2 className="font-semibold text-slate-900">
              Registered Patients
            </h2>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {patients.length} result
            {patients.length === 1 ? "" : "s"}
          </span>
        </div>

        {patients.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-slate-300" />

            <h3 className="font-semibold text-slate-800">No patients found</h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another search term or branch.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Patient</th>
                  <th className="px-6 py-3 font-semibold">Contact</th>
                  <th className="px-6 py-3 font-semibold">Branch</th>
                  <th className="px-6 py-3 font-semibold">Demographics</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => {
                  const age = calculateAge(patient.dob);

                  return (
                    <tr
                      key={patient.patientId}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {patient.fullName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          NIC: {patient.nic}
                        </p>

                        <p
                          className="mt-1 max-w-52 truncate font-mono text-[11px] text-slate-400"
                          title={patient.patientId}
                        >
                          {patient.patientId}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <p className="text-slate-700">
                          {patient.phone || "No phone"}
                        </p>

                        <p className="mt-1 max-w-56 truncate text-xs text-slate-500">
                          {patient.email}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {patient.branchName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {patient.city || "City not recorded"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        <p>
                          {age === null ? "Age unknown" : `${age} years`}
                          {" · "}
                          {patient.gender}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Blood group: {patient.bloodGroup || "Not recorded"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            patient.isActive
                              ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                              : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                          }
                        >
                          {patient.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.push(`/admin/patients/${patient.patientId}`)
                          }
                          className="rounded-xl"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-400">
        Patient records are read-only. Opening a patient profile is recorded in
        the audit log.
      </p>
    </div>
  );
}
