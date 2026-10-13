"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { 
  getEnrolledPolicies, 
  EnrolledPolicy, 
  PolicyResult 
} from "@/lib/actions/admin-insurance";
import { PolicyDetailDrawer } from "@/components/admin/insurance/PolicyDetailDrawer";
import { EnrollPolicyModal } from "@/components/admin/insurance/EnrollPolicyModal";

export default function InsurancePatientsPage() {
  const [data, setData] = useState<EnrolledPolicy[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // Modal & Drawer State
  const [selectedPolicy, setSelectedPolicy] = useState<EnrolledPolicy | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    const res: PolicyResult = await getEnrolledPolicies({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search,
      status,
    });
    setData(res.data);
    setPagination(res.pagination);
    setLoading(false);
  }, [pagination.page, pagination.pageSize, search, status]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-slate-100">
            Patient Insurance Policies
          </h1>
        </div>

        <button
          onClick={() => setIsEnrollModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Enroll New Policy
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient Name, NIC, or Policy #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Patient / NIC</th>
                <th className="py-3.5 px-4">Provider & Package</th>
                <th className="py-3.5 px-4">Policy #</th>
                <th className="py-3.5 px-4">Coverage Utilization</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading policies...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No insurance records found matching your filters.
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const pct = row.annualLimit > 0 
                    ? Math.min(100, Math.round((row.usedCoverageAmount / row.annualLimit) * 100))
                    : 0;

                  return (
                    <tr key={row.insuranceId} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{row.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{row.patientNic}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{row.providerName}</div>
                        <div className="text-[11px] text-slate-400">{row.packageName}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {row.policyNumber}
                      </td>

                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Rs. {row.usedCoverageAmount.toLocaleString()}
                          </span>
                          <span className="text-slate-400">
                            / {row.annualLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${pct > 80 ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {row.startDate} → {row.endDate}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === "Active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400" :
                          row.status === "Expired" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
                          "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                        }`}>
                          {row.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPolicy(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{data.length}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{pagination.totalCount}</span> policies
          </div>

          <div className="flex items-center gap-4">
            {/* Page Size Select */}
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => setPagination((p) => ({ ...p, pageSize: Number(e.target.value), page: 1 }))}
                className="p-1 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Prev / Next Page Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)}
              </span>

              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer for Patient 360 Details */}
      <PolicyDetailDrawer
        policy={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
      />

      {/* Modal for Registering a New Patient Policy */}
      <EnrollPolicyModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={loadPolicies}
      />
    </div>
  );
}
