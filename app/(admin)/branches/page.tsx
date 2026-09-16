"use client";

import React from "react";
import { branches } from "@/lib/mockData/branches";
import { employees } from "@/lib/mockData/employees";
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Users, Stethoscope, User, PlusCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BRANCH_GRADIENTS = [
  { bg: "from-cyan-500 to-teal-600", shape: "bg-cyan-100 text-cyan-700", light: "bg-cyan-50 border-cyan-200 text-cyan-700" },
  { bg: "from-violet-500 to-purple-600", shape: "bg-violet-100 text-violet-700", light: "bg-violet-50 border-violet-200 text-violet-700" },
  { bg: "from-orange-400 to-rose-500", shape: "bg-orange-100 text-orange-700", light: "bg-orange-50 border-orange-200 text-orange-700" },
];

export default function BranchesPage() {
  const role = useRole();
  if (!role) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Branches</h2>
          <p className="text-slate-500">Manage all MedSync clinic branches and locations.</p>
        </div>
        {role === "admin" && (
          <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5">
            <PlusCircle className="w-4 h-4 mr-2" /> New Branch
          </Button>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm text-center p-5">
          <div className="text-3xl font-black text-slate-900 mb-1">{branches.length}</div>
          <div className="text-sm text-slate-500 font-medium">Total Branches</div>
        </Card>
        <Card className="border-slate-200 shadow-sm text-center p-5">
          <div className="text-3xl font-black text-[var(--brand-primary)] mb-1">{branches.reduce((a, b) => a + b.doctorCount, 0)}</div>
          <div className="text-sm text-slate-500 font-medium">Total Doctors</div>
        </Card>
        <Card className="border-slate-200 shadow-sm text-center p-5">
          <div className="text-3xl font-black text-slate-900 mb-1">{branches.reduce((a, b) => a + b.patientCount, 0)}</div>
          <div className="text-sm text-slate-500 font-medium">Active Patients</div>
        </Card>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {branches.map((branch, i) => {
          const theme = BRANCH_GRADIENTS[i % BRANCH_GRADIENTS.length];
          const branchStaff = employees.filter(e => e.branchId === branch.branchId && e.isActive);

          return (
            <Card key={branch.branchId} className="border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
              {/* Header */}
              <div className={cn("relative h-36 bg-gradient-to-br p-6 overflow-hidden", theme.bg)}>
                {/* Layered CSS shapes as background decoration */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10"
                  style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
                <div className="absolute right-12 bottom-0 w-16 h-16 bg-white/10"
                  style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }} />
                <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/10"
                  style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }} />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white")}>
                      {branch.isActive ? "● Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-white/70">{branch.branchId}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{branch.name}</h3>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Location */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{branch.address}, {branch.city}, {branch.state}</span>
                  </div>
                  <a href={`tel:${branch.phone}`} className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-[var(--brand-primary)] transition-colors">
                    <Phone className="w-4 h-4 text-slate-400" /> {branch.phone}
                  </a>
                  <a href={`mailto:${branch.email}`} className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-[var(--brand-primary)] transition-colors">
                    <Mail className="w-4 h-4 text-slate-400" /> {branch.email}
                  </a>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[var(--brand-primary)] mb-1">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-slate-900">{branch.doctorCount}</p>
                    <p className="text-xs text-slate-500">Doctors</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[var(--brand-primary)] mb-1">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-slate-900">{branch.patientCount}</p>
                    <p className="text-xs text-slate-500">Patients</p>
                  </div>
                </div>

                {/* Manager */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Branch Manager</p>
                  <div className="flex items-center gap-3">
                    {/* Octagon shape manager avatar */}
                    <div
                      className={cn("w-9 h-9 flex items-center justify-center text-sm font-bold shrink-0", theme.shape)}
                      style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}
                    >
                      {branch.managerName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{branch.managerName}</p>
                      <p className="text-xs text-slate-500">Since {branch.createdAt}</p>
                    </div>
                  </div>
                </div>

                {/* Staff mini-list */}
                {branchStaff.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      Active Staff ({branchStaff.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {branchStaff.slice(0, 5).map(s => (
                        <span key={s.employeeId}
                          className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", theme.light)}>
                          {s.name.split(' ')[0]}
                        </span>
                      ))}
                      {branchStaff.length > 5 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          +{branchStaff.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
