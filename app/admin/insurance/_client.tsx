"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  RefreshCw, 
  TrendingUp, 
  Building2, 
  DollarSign, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Layers,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getStats, 
  getProviders, 
  getPackages, 
  togglePackageStatus, 
  syncPackages, 
  Stats as InsuranceStats, 
  Providers as InsuranceProviderSummary, 
  Packages as InsurancePackageItem 
} from "@/lib/actions/admin-insurance";

interface ClientPageProps {
  user: {
    userId?: string;
    fullName?: string;
    name?: string;
    role?: string;
    [key: string]: any;
  };
}

export default function InsuranceClientPage({ user }: ClientPageProps) {
  void user;
  const [stats, setStats] = useState<InsuranceStats>({
    totalInsuredPatients: 0,
    activePoliciesCount: 0,
    totalCoverageUtilized: 0,
    totalProvidersCount: 0,
    totalPackagesCount: 0,
  });
  const [providers, setProviders] = useState<InsuranceProviderSummary[]>([]);
  const [packages, setPackages] = useState<InsurancePackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [togglingPackageId, setTogglingPackageId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async (showFullLoader = true) => {
    if (showFullLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [statsData, providersData, packagesData] = await Promise.all([
        getStats(),
        getProviders(),
        getPackages(),
      ]);

      setStats(statsData);
      setProviders(providersData);
      setPackages(packagesData);
    } catch (err) {
      console.error("Failed to load insurance dashboard:", err);
      setStatusMessage({ type: "error", text: "Failed to load real-time insurance data." });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  const handleSync = async (providerName: string) => {
    setSyncingProvider(providerName);
    setStatusMessage(null);

    try {
      const res = await syncPackages(providerName);
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || `Successfully synced ${providerName} packages.` });
        await loadData(false);
      } else {
        setStatusMessage({ type: "error", text: res.error || "Package synchronization failed." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "An unexpected error occurred during sync." });
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleTogglePackage = async (packageId: string, currentStatus: boolean) => {
    setTogglingPackageId(packageId);
    setStatusMessage(null);

    try {
      const res = await togglePackageStatus(packageId, currentStatus);
      if (res.success) {
        setPackages((prev) =>
          prev.map((pkg) => (pkg.packageId === packageId ? { ...pkg, isActive: !currentStatus } : pkg))
        );
        setStatusMessage({
          type: "success",
          text: `Package successfully ${!currentStatus ? "activated" : "deactivated"}.`,
        });
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to update package status." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Server error occurred while updating status." });
    } finally {
      setTogglingPackageId(null);
    }
  };

  const maxEnrolled = Math.max(...packages.map((p) => p.enrolledCount), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Insurance & Packages</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Contracted insurers, coverage utilization, patient policies, and package rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading || isRefreshing}
            onClick={() => void loadData(false)}
            className="h-9 text-xs text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5 text-slate-500", isRefreshing && "animate-spin text-teal-600")} />
            {isRefreshing ? "Refreshing..." : "Refresh Metrics"}
          </Button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          role="alert"
          className={cn(
            "p-3.5 rounded-lg text-xs flex items-center justify-between border shadow-xs transition-all",
            statusMessage.type === "success"
              ? "bg-emerald-50/90 text-emerald-900 border-emerald-200"
              : "bg-rose-50/90 text-rose-900 border-rose-200"
          )}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Utilized Coverage
            </CardTitle>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              Rs. {stats.totalCoverageUtilized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Claimed hospital expenses by patients</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Patient Policies
            </CardTitle>
            <div className="p-2 bg-teal-50 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.activePoliciesCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Currently valid insurance plans</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Insured Patients
            </CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalInsuredPatients}</div>
            <p className="text-[11px] text-slate-400 mt-1">Unique patients with insurance records</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Partner Insurers
            </CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalProvidersCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">{stats.totalPackagesCount} packages in catalog</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Insurance Providers */}
        <Card className="lg:col-span-5 border-slate-200/80 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Insurance Providers
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {providers.length} registered
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Synchronize package catalog updates from verified third-party insurers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 flex flex-col justify-center items-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span>Loading providers...</span>
              </div>
            ) : providers.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Building2 className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No providers registered</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Insurance packages table contains no provider entries.</p>
              </div>
            ) : (
              providers.map((p) => (
                <div key={p.providerName} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{p.providerName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-teal-700">{p.activePackages} active</span> of {p.totalPackages} total packages
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncingProvider === p.providerName}
                      onClick={() => handleSync(p.providerName)}
                      className="h-8 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-teal-700 transition-colors shadow-xs"
                    >
                      {syncingProvider === p.providerName ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-teal-600" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          <span>Sync Packages</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50/70 p-2 rounded-md text-slate-500">
                    <span>{p.enrolledPoliciesCount} enrolled policies</span>
                    <span className="font-semibold text-slate-800">
                      Rs. {p.totalCoverageUtilized.toLocaleString()} utilized
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Used Packages */}
        <Card className="lg:col-span-7 border-slate-200/80 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                Top Packages by Patient Adoption
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Sorted by policy count
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Package distribution to evaluate partner contract terms and negotiations.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {isLoading ? (
              <div className="py-12 flex flex-col justify-center items-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span>Loading package metrics...</span>
              </div>
            ) : packages.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No package data found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sync an insurer to populate package metrics.</p>
              </div>
            ) : (
              packages.slice(0, 5).map((pkg) => {
                const percentage = Math.round((pkg.enrolledCount / maxEnrolled) * 100);
                return (
                  <div key={pkg.packageId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="truncate max-w-[70%]">
                        <span className="font-semibold text-slate-900">{pkg.packageName}</span>
                        <span className="text-slate-400 ml-2 font-normal">({pkg.providerName})</span>
                      </div>
                      <span className="font-bold text-slate-800">{pkg.enrolledCount} policies</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Copayment: <strong className="text-slate-600 font-medium">{pkg.copaymentPercentage}%</strong></span>
                      <span>Total Spent: <strong className="text-slate-600 font-medium">Rs. {pkg.totalUtilizedAmount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Packages Directory Table */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              Insurance Packages Directory
            </span>
            <span className="text-xs font-normal text-slate-500">
              {packages.length} total packages
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Comprehensive listing of hospital-supported policies and coverage limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Package</th>
                  <th className="py-3.5 px-4 font-semibold">Provider</th>
                  <th className="py-3.5 px-4 font-semibold">Copay</th>
                  <th className="py-3.5 px-4 font-semibold">Annual Limit</th>
                  <th className="py-3.5 px-4 font-semibold">Enrolled</th>
                  <th className="py-3.5 px-4 font-semibold">Total Utilized</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                        <span>Loading directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No packages found. Click &quot;Sync Packages&quot; above to import catalog data.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.packageId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{pkg.packageName}</div>
                        {pkg.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={pkg.description}>
                            {pkg.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{pkg.providerName}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {pkg.copaymentPercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {pkg.annualLimit > 0
                          ? `Rs. ${pkg.annualLimit.toLocaleString()}`
                          : <span className="text-teal-700 font-semibold">Unlimited</span>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{pkg.enrolledCount}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        Rs. {pkg.totalUtilizedAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase",
                            pkg.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full mr-1",
                              pkg.isActive ? "bg-emerald-500" : "bg-slate-400"
                            )}
                          />
                          {pkg.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={togglingPackageId === pkg.packageId}
                          onClick={() => handleTogglePackage(pkg.packageId, pkg.isActive)}
                          className={cn(
                            "h-7 px-2.5 text-xs font-medium transition-colors",
                            pkg.isActive
                              ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                          )}
                        >
                          {togglingPackageId === pkg.packageId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                          ) : pkg.isActive ? (
                            "Deactivate"
                          ) : (
                            "Activate"
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
