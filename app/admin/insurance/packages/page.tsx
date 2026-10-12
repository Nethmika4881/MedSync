"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  DollarSign, 
  Percent, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  ArrowLeft,
  Shield,
  Layers,
  Power
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getPackages, 
  togglePackageStatus, 
  deletePackages, 
  Packages 
} from "@/lib/actions/insurance";

// color styling for provider
const PROVIDER_THEMES: Record<string, { gradient: string; badge: string; border: string; text: string }> = {
  Allianz: {
    gradient: "from-blue-600 to-indigo-700",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "hover:border-blue-300",
    text: "text-blue-600",
  },
  AIA: {
    gradient: "from-rose-600 to-red-700",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    border: "hover:border-rose-300",
    text: "text-rose-600",
  },
  "Ceylinco Life": {
    gradient: "from-amber-500 to-orange-600",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "hover:border-amber-300",
    text: "text-amber-600",
  },
  "Sri Lanka Insurance": {
    gradient: "from-teal-600 to-emerald-700",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    border: "hover:border-teal-300",
    text: "text-teal-600",
  },
};

const DEFAULT_THEME = {
  gradient: "from-slate-700 to-slate-900",
  badge: "bg-slate-100 text-slate-700 border-slate-200",
  border: "hover:border-slate-300",
  text: "text-slate-700",
};

export default function PackagesClientPage() {
  const [packages, setPackages] = useState<Packages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  //package for Modal view
  const [activePackage, setActivePackage] = useState<Packages | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPackages();
      setPackages(data);
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Unique porviders list
  const uniqueProviders = Array.from(new Set(packages.map((p) => p.providerName)));

  // Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProvider = selectedProvider === "ALL" || pkg.providerName === selectedProvider;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && pkg.isActive) ||
      (statusFilter === "INACTIVE" && !pkg.isActive);

    return matchesSearch && matchesProvider && matchesStatus;
  });

  const handleToggle = async (pkg: Packages) => {
    setIsActionLoading(true);
    const res = await togglePackageStatus(pkg.packageId, pkg.isActive);

    if (res.success) {
      const updated = { ...pkg, isActive: !pkg.isActive };
      setPackages((prev) => prev.map((p) => (p.packageId === pkg.packageId ? updated : p)));
      if (activePackage?.packageId === pkg.packageId) {
        setActivePackage(updated);
      }
      setToToast({ type: "success", text: res.message || "Status updated." });
    } else {
      setToToast({ type: "error", text: res.error || "Failed to update." });
    }
    setIsActionLoading(false);
  };

  const handleDelete = async (pkg: Packages) => {
    if (!confirm(`Are you sure you want to remove "${pkg.packageName}"?`)) return;

    setIsActionLoading(true);
    const res = await deletePackages(pkg.packageId);

    if (res.success) {
      setToToast({ type: "success", text: res.message || "Package removed successfully." });
      setActivePackage(null);
      void loadData();
    } else {
      setToToast({ type: "error", text: res.error || "Failed to remove package." });
    }
    setIsActionLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/insurance"
              className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Insurance Packages Catalog</h2>
          <p className="text-slate-500 text-sm">
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={cn(
            "p-3 rounded-lg text-xs flex items-center justify-between gap-2 transition-all",
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search package name, provider, or coverage terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-9 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Providers </option>
            {uniqueProviders.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Package Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col justify-center items-center text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600 mb-2" />
          Loading packages catalog...
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-8 space-y-2">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No packages match your search</h3>
          <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map((pkg) => {
            const theme = PROVIDER_THEMES[pkg.providerName] || DEFAULT_THEME;

            return (
              <Card
                key={pkg.packageId}
                onClick={() => setActivePackage(pkg)}
                className={cn(
                  "border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group",
                  theme.border
                )}
              >
                <div>
                  {/* Distinct Color Header */}
                  <div
                    className={cn(
                      "bg-gradient-to-r p-4 text-white flex items-center justify-between",
                      theme.gradient
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 opacity-90" />
                      <span className="text-xs font-semibold tracking-wide uppercase opacity-95">
                        {pkg.providerName}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm",
                        pkg.isActive
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-black/30 text-white/70"
                      )}
                    >
                      {pkg.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                        {pkg.packageName}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {pkg.description || "Standard health policy coverage provided under hospital partnership."}
                      </p>
                    </div>

                    {/* Copay & Annual Limit Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-medium">Copayment</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Percent className="w-3 h-3 text-slate-400" />
                          {pkg.copaymentPercentage}%
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-medium">Annual Limit</span>
                        <span className="font-bold text-slate-800 text-[11px] mt-0.5 block truncate">
                          {pkg.annualLimit > 0
                            ? `Rs. ${pkg.annualLimit.toLocaleString()}`
                            : "Unlimited"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer: Utilization Metrics */}
                <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{pkg.enrolledCount}</strong> policies
                  </span>
                  <span className="font-medium text-slate-700">
                    Rs. {pkg.totalUtilizedAmount.toLocaleString()} spent
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Package Detail & Action Modal */}
      {activePackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header with Provider Color */}
            {(() => {
              const theme = PROVIDER_THEMES[activePackage.providerName] || DEFAULT_THEME;
              return (
                <div
                  className={cn(
                    "bg-gradient-to-r p-5 text-white flex items-start justify-between",
                    theme.gradient
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90">
                        {activePackage.providerName}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          activePackage.isActive ? "bg-white/20 text-white" : "bg-black/30 text-white/70"
                        )}
                      >
                        {activePackage.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{activePackage.packageName}</h3>
                  </div>

                  <button
                    onClick={() => setActivePackage(null)}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })()}

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Package Coverage Description
                </label>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {activePackage.description || "No customized policy description provided by the insurer."}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Annual Limit</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {activePackage.annualLimit > 0
                      ? `Rs. ${activePackage.annualLimit.toLocaleString()}`
                      : "Unlimited"}
                  </div>
                </div>

                <div className="border border-slate-200 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Patient Copayment</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {activePackage.copaymentPercentage}%
                  </div>
                </div>

                <div className="border border-slate-200 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Enrolled Patients</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {activePackage.enrolledCount} active policies
                  </div>
                </div>

                <div className="border border-slate-200 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Hospital Revenue Billed</span>
                  </div>
                  <div className="text-sm font-bold text-teal-600">
                    Rs. {activePackage.totalUtilizedAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Safety Notice regarding foreign keys */}
              {activePackage.enrolledCount > 0 && (
                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    This package has <strong>{activePackage.enrolledCount}</strong> active patient policies. Removing it will automatically deactivate it instead of deleting it, keeping patient history safe.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading}
                onClick={() => handleToggle(activePackage)}
                className="h-9 text-xs text-slate-700 border-slate-300 hover:bg-slate-100"
              >
                <Power className="w-3.5 h-3.5 mr-1.5" />
                {activePackage.isActive ? "Deactivate Package" : "Activate Package"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActivePackage(null)}
                  className="h-9 text-xs text-slate-500"
                >
                  Close
                </Button>

                <Button
                  size="sm"
                  disabled={isActionLoading}
                  onClick={() => handleDelete(activePackage)}
                  className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Remove Package
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}