"use client";

import React, { useState } from "react";
import { useCurrentUser } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Users, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, Activity, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const AUDIT_LOGS = [
  { id: "LOG-001", user: "Admin (EMP-015)", action: "Logged in", resource: "Auth System", time: "2026-07-24T14:32:00", status: "success" },
  { id: "LOG-002", user: "Dr. Sarah Mitchell (DOC-001)", action: "Viewed patient record", resource: "PAT-007 — Maria Santos", time: "2026-07-24T14:10:00", status: "success" },
  { id: "LOG-003", user: "Lisa Nguyen (EMP-003)", action: "Dispensed prescription", resource: "PRESC-004 — Salbutamol", time: "2026-07-24T13:58:00", status: "success" },
  { id: "LOG-004", user: "Unknown", action: "Failed login attempt", resource: "Auth System", time: "2026-07-24T13:45:00", status: "warning" },
  { id: "LOG-005", user: "Admin (EMP-015)", action: "Updated insurance claim", resource: "CLM-0042", time: "2026-07-24T13:30:00", status: "success" },
  { id: "LOG-006", user: "Dr. Yashfin Jhosof (DOC-003)", action: "Created consultation record", resource: "CON-007 — Abraham Brakering", time: "2026-07-24T12:55:00", status: "success" },
  { id: "LOG-007", user: "Unknown IP 192.168.1.55", action: "Failed login attempt (3rd)", resource: "Auth System", time: "2026-07-24T12:20:00", status: "danger" },
  { id: "LOG-008", user: "Jessica Turner (EMP-001)", action: "Registered new patient", resource: "PAT-022 (new)", time: "2026-07-24T11:40:00", status: "success" },
];

const PERMISSION_ROLES = [
  { role: "Admin", appointments: true, patients: true, billing: true, pharmacy: true, lab: true, reports: true, settings: true, branches: true },
  { role: "Doctor", appointments: true, patients: true, billing: false, pharmacy: false, lab: true, reports: false, settings: false, branches: false },
  { role: "Receptionist", appointments: true, patients: true, billing: true, pharmacy: false, lab: false, reports: false, settings: false, branches: false },
  { role: "Pharmacist", appointments: false, patients: true, billing: false, pharmacy: true, lab: false, reports: false, settings: false, branches: false },
  { role: "Lab Tech", appointments: false, patients: true, billing: false, pharmacy: false, lab: true, reports: false, settings: false, branches: false },
  { role: "Nurse", appointments: true, patients: true, billing: false, pharmacy: false, lab: true, reports: false, settings: false, branches: false },
  { role: "Branch Manager", appointments: true, patients: false, billing: true, pharmacy: false, lab: false, reports: true, settings: false, branches: true },
  { role: "Patient", appointments: true, patients: false, billing: true, pharmacy: false, lab: false, reports: false, settings: false, branches: false },
];

const PERM_COLS = ["appointments", "patients", "billing", "pharmacy", "lab", "reports", "settings", "branches"] as const;

export default function SecurityPage() {
  const user = useCurrentUser();
  const [activeSection, setActiveSection] = useState<"audit" | "permissions" | "sessions">("audit");

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Access Control</h2>
        <p className="text-slate-500">Audit logs, role permissions, and active session management.</p>
      </div>

      {/* Security Status Banner */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-teal-50 shadow-sm overflow-hidden">
        <CardContent className="p-5 flex items-center gap-5">
          <div className="w-14 h-14 bg-green-100 flex items-center justify-center shrink-0"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
            <Shield className="w-7 h-7 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-800 text-sm">System Security: Good</span>
            </div>
            <p className="text-xs text-green-700">All services are running normally. Last security scan: Today at 12:00 AM.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-2xl font-black text-green-700">98%</p>
            <p className="text-xs text-green-600">Security Score</p>
          </div>
        </CardContent>
      </Card>

      {/* Section Nav */}
      <div className="flex gap-2">
        {(["audit", "permissions", "sessions"] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={cn("px-5 py-2 rounded-xl text-sm font-semibold border transition-all capitalize",
              activeSection === s ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}>
            {s === "audit" ? "Audit Logs" : s === "permissions" ? "Role Permissions" : "Active Sessions"}
          </button>
        ))}
      </div>

      {/* Audit Logs */}
      {activeSection === "audit" && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--brand-primary)]" /> Recent Activity Log
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Resource</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {AUDIT_LOGS.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(log.time).toLocaleString()}</td>
                    <td className="px-6 py-3 font-medium text-slate-900 text-xs">{log.user}</td>
                    <td className="px-6 py-3">{log.action}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">{log.resource}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {/* CSS shape status indicator */}
                        <div className={cn("w-4 h-4 shrink-0",
                          log.status === "success" ? "bg-green-400" : log.status === "warning" ? "bg-amber-400" : "bg-red-500"
                        )} style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                        <span className={cn("text-xs font-semibold capitalize",
                          log.status === "success" ? "text-green-700" : log.status === "warning" ? "text-amber-700" : "text-red-700"
                        )}>
                          {log.status === "danger" ? "Blocked" : log.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Role Permissions Matrix */}
      {activeSection === "permissions" && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--brand-primary)]" /> Role-Based Access Control Matrix
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 sticky left-0 bg-slate-50 z-10">Role</th>
                  {PERM_COLS.map(col => (
                    <th key={col} className="px-4 py-3 text-center capitalize">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {PERMISSION_ROLES.map(r => (
                  <tr key={r.role} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-900 sticky left-0 bg-white">{r.role}</td>
                    {PERM_COLS.map(col => (
                      <td key={col} className="px-4 py-3 text-center">
                        <div className={cn("w-5 h-5 mx-auto",
                          (r as any)[col] ? "bg-green-400" : "bg-slate-200"
                        )} style={{ clipPath: (r as any)[col] ? "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" : "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-green-400" style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }} /> Permitted</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} /> Restricted</span>
          </div>
        </Card>
      )}

      {/* Active Sessions */}
      {activeSection === "sessions" && (
        <div className="space-y-4">
          {[
            { device: "Chrome on Windows 11", ip: "192.168.1.42", location: "San Francisco, CA", lastActive: "Just now", current: true },
            { device: "Safari on iPhone 16", ip: "10.0.0.55", location: "Oakland, CA", lastActive: "2 hours ago", current: false },
            { device: "Firefox on macOS", ip: "172.16.0.8", location: "San Jose, CA", lastActive: "Yesterday", current: false },
          ].map((session, i) => (
            <Card key={i} className={cn("border shadow-sm", session.current ? "border-[var(--brand-primary)]" : "border-slate-200")}>
              <CardContent className="p-5 flex items-center gap-5">
                <div className={cn("w-12 h-12 flex items-center justify-center shrink-0",
                  session.current ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                )} style={{ clipPath: "polygon(0 15%, 15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%)" }}>
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{session.device}</p>
                    {session.current && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Current</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{session.ip} • {session.location}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Last active: {session.lastActive}</p>
                </div>
                {!session.current && (
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg h-8 shrink-0">
                    Revoke
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
