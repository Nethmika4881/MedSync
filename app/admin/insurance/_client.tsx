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
  SlidersHorizontal,
  Layers
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
} from "@/lib/actions/insurance";

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
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSync = async (providerName: string) => {
    setSyncingProvider(providerName);
    setStatusMessage(null);

    const res = await syncPackages(providerName);
    if (res.success) {
      setStatusMessage({ type: "success", text: res.message || "Provider synced successfully." });
      void loadData();
    } else {
      setStatusMessage({ type: "error", text: res.error || "Sync failed." });
    }

    setSyncingProvider(null);
  };

  const handleTogglePackage = async (packageId: string, currentStatus: boolean) => {
    const res = await togglePackageStatus(packageId, currentStatus);
    if (res.success) {
      setPackages((prev) =>
        prev.map((pkg) => (pkg.packageId === packageId ? { ...pkg, isActive: !currentStatus } : pkg))
      );
    } else {
      alert(res.error || "Failed to update package.");
    }
  };

  const maxEnrolled = Math.max(...packages.map((p) => p.enrolledCount), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Insurance & Packages</h2>
          <p className="text-slate-500 text-sm">
            contracted insurers, coverage utilization, patient policies, and package rules.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={cn(
            "p-3 rounded-lg text-xs flex items-center gap-2",
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Utilized Coverage
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">
              Rs. {stats.totalCoverageUtilized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Claimed hospital expenses by patients</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Patient Policies
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{stats.activePoliciesCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Currently valid insurance plans</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Insured Patients
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{stats.totalInsuredPatients}</div>
            <p className="text-[11px] text-slate-400 mt-1">Unique patients with insurance records</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Partner Insurers
            </CardTitle>
            <Building2 className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">{stats.totalProvidersCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">{stats.totalPackagesCount} packages in catalog</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Insurance Providers */}
        <Card className="lg:col-span-5 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Insurance Providers
              </span>
              <span className="text-xs font-normal text-slate-400">
                {providers.length} registered
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Synchronize package details directly from insurance providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-8 flex justify-center items-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-teal-600" />
                Loading providers...
              </div>
            ) : providers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No providers found in packages table.</div>
            ) : (
              providers.map((p) => (
                <div key={p.providerName} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{p.providerName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {p.activePackages} active packages ({p.totalPackages} total)
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncingProvider === p.providerName}
                      onClick={() => handleSync(p.providerName)}
                      className="h-8 text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                      {syncingProvider === p.providerName ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-teal-600" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      )}
                      Sync API
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{p.enrolledPoliciesCount} enrolled policies</span>
                    <span className="font-medium text-slate-700">
                      Rs. {p.totalCoverageUtilized.toLocaleString()} utilized
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Used Packages */}
        <Card className="lg:col-span-7 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                Top Packages by Patient Adoption
              </span>
              <span className="text-xs font-normal text-slate-400">
                
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Package distribution to evaluate partner contract terms and negotiations.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {isLoading ? (
              <div className="py-8 flex justify-center items-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-teal-600" />
                Loading package metrics...
              </div>
            ) : packages.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No package data found.</div>
            ) : (
              packages.slice(0, 5).map((pkg) => {
                const percentage = Math.round((pkg.enrolledCount / maxEnrolled) * 100);
                return (
                  <div key={pkg.packageId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{pkg.packageName}</span>
                        <span className="text-slate-400 ml-2">({pkg.providerName})</span>
                      </div>
                      <span className="font-bold text-slate-700">{pkg.enrolledCount} policies</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Copay: {pkg.copaymentPercentage}%</span>
                      <span>Total Spent: Rs. {pkg.totalUtilizedAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Packages Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            Insurance Packages Directory
          </CardTitle>
          <CardDescription className="text-xs">
            Packages list
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Copay</th>
                  <th className="py-3 px-4">Annual Limit</th>
                  <th className="py-3 px-4">Enrolled</th>
                  <th className="py-3 px-4">Total Utilized</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((pkg) => (
                  <tr key={pkg.packageId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{pkg.packageName}</div>
                      {pkg.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{pkg.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{pkg.providerName}</td>
                    <td className="py-3 px-4 text-slate-600">{pkg.copaymentPercentage}%</td>
                    <td className="py-3 px-4 text-slate-600">
                      {pkg.annualLimit > 0
                        ? `Rs. ${pkg.annualLimit.toLocaleString()}`
                        : "Unlimited"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{pkg.enrolledCount}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      Rs. {pkg.totalUtilizedAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          pkg.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {pkg.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTogglePackage(pkg.packageId, pkg.isActive)}
                        className="h-7 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        {pkg.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}