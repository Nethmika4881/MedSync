"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Briefcase,
} from "lucide-react";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";
import Link from "next/link";
import type { AuthUser } from "@/lib/types";

const DEPT_SHAPES: Record<string, string> = {
  "Front Desk":
    "clip-path: polygon(0 15%, 15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%);",
  Clinical: "clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);",
  Pharmacy:
    "clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);",
  Laboratory:
    "clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);",
  Management:
    "clip-path: polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%);",
  Administration: "clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);",
};

type staffMember = {
  employeeID: string;
  branchID: string;
  role: "FrontDesk" | "Admin" | "Doctor";
  joinedDate: string | null;
  isActive: boolean;
  fullName: string;
  email: string;
  branchName: string;
  phone: string | null;
};

type branchOption = {
  branch_id: string;
  branch_name: string;
};
export default function StaffPage({
  user,
  staff,
  total,
  branches,
  page,
  pageSize,
  totalPages,
}: {
  user: AuthUser;
  total: number;
  staff: staffMember[];
  branches: branchOption[];
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const role = user?.role;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const filtered = staff;
  if (!role) return null;

  const roles = ["All", "Doctor", "FrontDesk", "Admin"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Management
          </h2>
          <p className="text-slate-500">
            View, filter, and manage all clinic staff members.
          </p>
        </div>
        {role === "admin" && (
          <Link href="/admin/staff/new">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5">
              <UserPlus className="w-4 h-4 mr-2" /> Add Staff Member
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none bg-white"
          />
        </div>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-[var(--brand-primary)] outline-none"
        >
          <option value="">All branches</option>

          {branches.map((branch) => (
            <option key={branch.branch_id} value={branch.branch_id}>
              {branch.branch_name}
            </option>
          ))}
        </select>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-[var(--brand-primary)] outline-none"
        >
          {roles.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Summary cards per department */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {roles
          .filter((d) => d !== "All")
          .map((dept) => {
            const count = staff.filter(
              (e) => e.role === dept && e.isActive,
            ).length;
            const shapeStyle =
              DEPT_SHAPES[dept] || DEPT_SHAPES["Administration"];
            return (
              <button
                key={dept}
                onClick={() =>
                  setSelectedRole(dept === selectedRole ? "All" : dept)
                }
                className={cn(
                  "p-4 text-center transition-all group hover:-translate-y-1",
                  selectedRole === dept
                    ? "bg-[var(--brand-primary)] text-white shadow-md shadow-brand-500/20 rounded-2xl"
                    : "bg-white border border-slate-200 text-slate-700 hover:shadow-sm rounded-2xl",
                )}
              >
                {/* CSS Shape Icon */}
                <div className="flex justify-center mb-2">
                  <div
                    className={cn(
                      "w-10 h-10 flex items-center justify-center text-xs font-bold",
                      selectedRole === dept
                        ? "bg-white/30 text-white"
                        : "bg-slate-100 text-slate-700",
                    )}
                    style={{
                      clipPath: shapeStyle
                        .replace("clip-path: ", "")
                        .replace(";", ""),
                    }}
                  >
                    {count}
                  </div>
                </div>
                <p
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    selectedRole === dept ? "text-white" : "text-slate-600",
                  )}
                >
                  {dept}
                </p>
              </button>
            );
          })}
      </div>

      {/* Staff Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role / Department</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Hire Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((emp) => {
                const colorClass = getAvatarColor(emp.fullName);
                const shapeStyle =
                  DEPT_SHAPES[emp.role] || DEPT_SHAPES["Administration"];
                return (
                  <tr
                    key={emp.employeeID}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* CSS Shape Avatar */}
                        <div
                          className={cn(
                            "w-10 h-10 flex items-center justify-center text-sm font-bold shrink-0 transition-transform hover:scale-110",
                            colorClass,
                          )}
                          style={{
                            clipPath: shapeStyle
                              .replace("clip-path: ", "")
                              .replace(";", ""),
                          }}
                        >
                          {getInitials(emp.fullName)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {emp.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {emp.employeeID}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{emp.role}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3" /> {emp.role}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {emp.branchName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${emp.email}`}
                        className="flex items-center gap-1.5 text-[var(--brand-primary)] hover:underline text-xs"
                      >
                        <Mail className="w-3.5 h-3.5" /> {emp.email}
                      </a>
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                        <Phone className="w-3.5 h-3.5" /> {emp.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {emp.joinedDate
                        ? new Date(emp.joinedDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                          emp.isActive
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            emp.isActive ? "bg-green-500" : "bg-slate-400",
                          )}
                        />
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
