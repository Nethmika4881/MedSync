"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/catms/EmptyState";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { formatDay } from "@/lib/doctorFormat";
import type { DoctorPatientListItem } from "@/lib/doctorTypes";

export default function PatientsPage({ patients }: { patients: DoctorPatientListItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? patients.filter((p) => p.patientName.toLowerCase().includes(q)) : patients;
  }, [patients, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Patients</h2>
          <p className="text-slate-500">Patients who have booked an appointment with you.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search by name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={patients.length === 0 ? "No patients yet" : "No matching patients"}
            description={patients.length === 0 ? "Patients appear here after their first appointment with you." : "Try a different name."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Age</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Blood Group</th>
                  <th className="px-6 py-4">Visits</th>
                  <th className="px-6 py-4">Last Visit</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((p) => (
                  <tr key={p.patientId} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4"><AvatarWithName name={p.patientName} size="sm" /></td>
                    <td className="px-6 py-4">{p.age ?? "—"}</td>
                    <td className="px-6 py-4">{p.gender || "—"}</td>
                    <td className="px-6 py-4">{p.bloodGroup || "—"}</td>
                    <td className="px-6 py-4">{p.visitCount}</td>
                    <td className="px-6 py-4">{formatDay(p.lastVisitDate)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/doctor/patients/${p.patientId}`}>
                        <Button size="sm" variant="outline" className="rounded-lg h-8">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
