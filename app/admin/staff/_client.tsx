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
} from "lucide-react";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";
import Link from "next/link";
import type { AuthUser } from "@/lib/types";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const ROLE_SHAPES: Record<string, string> = {
  FrontDesk:
    "clip-path: polygon(0 15%, 15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%);",
  Doctor: "clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);",
  Admin: "clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);",
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
  branches,
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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? "",
  );
  const selectedStatus = searchParams.get("status") ?? "all";
  const selectedRole = searchParams.get("role") ?? "All";
  const selectedBranch = searchParams.get("branchID") ?? "";
  const filtered = staff;
  if (!role) return null;

  const roles = ["All", "Doctor", "FrontDesk", "Admin"];

  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "All" || value === "all") {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    params.set("page", "1");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }
  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilter("search", searchTerm.trim());
  }
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
          <form onSubmit={handleSearch} className="relative flex-1 md:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none bg-white"
            />
          </form>
          <select
            value={selectedBranch}
            onChange={(e) => updateFilter("branchID", e.target.value)}
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
            onChange={(e) => updateFilter("role", e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-[var(--brand-primary)] outline-none"
          >
            {roles.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(event) => updateFilter("status", event.target.value)}
            aria-label="Filter staff by status"
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-[var(--brand-primary)] outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Staff Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Hire Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((emp) => {
                  const colorClass = getAvatarColor(emp.fullName);
                  const shapeStyle = ROLE_SHAPES[emp.role] || ROLE_SHAPES.Admin;
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
