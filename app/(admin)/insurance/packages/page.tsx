"use client";

import React from "react";
import { insurancePackages } from "@/lib/mockData/insurance";
import { insuranceProviders } from "@/lib/mockData/insurance";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PROVIDER_COLORS = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-teal-500 to-teal-600",
  "from-amber-500 to-amber-600",
];

export default function InsurancePackagesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/insurance">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Insurance Packages</h2>
          <p className="text-slate-500">All available coverage plans from our partner providers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insurancePackages.map((pkg) => {
          const provider = insuranceProviders.find(p => p.providerId === pkg.providerId);
          const providerIndex = insuranceProviders.findIndex(p => p.providerId === pkg.providerId);
          const gradient = PROVIDER_COLORS[providerIndex % PROVIDER_COLORS.length];
          const coveragePct = pkg.copayPercent;
          const remaining = 100 - coveragePct;

          return (
            <Card key={pkg.packageId} className="border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
              <div className={cn("h-4 bg-gradient-to-r", gradient)} />
              <CardContent className="p-6">
                {/* Package icon — Pentagon CSS shape */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{pkg.packageName}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{pkg.providerName}</p>
                  </div>
                  <div
                    className={cn("w-14 h-14 flex flex-col items-center justify-center shrink-0 bg-gradient-to-br text-white font-black text-sm leading-tight", gradient)}
                    style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}
                  >
                    <span>{coveragePct}%</span>
                    <span className="text-[8px] font-semibold opacity-80">COVER</span>
                  </div>
                </div>

                {/* Circular-style coverage visual using CSS */}
                <div className="relative mb-5 flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div
                    className={cn("w-16 h-16 flex items-center justify-center shrink-0 bg-gradient-to-br text-white", gradient)}
                    style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
                  >
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                      <span>Copay Coverage</span>
                      <span className="text-green-600 font-bold">{coveragePct}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full bg-gradient-to-r", gradient)} style={{ width: `${coveragePct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Patient pays remaining {remaining}%</p>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Annual Coverage Limit</span>
                    <span className="font-bold text-slate-900">${pkg.annualLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Provider</span>
                    <span className="font-semibold text-slate-700">{pkg.providerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Package ID</span>
                    <span className="font-mono text-xs text-slate-500">{pkg.packageId}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Coverage Includes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pkg.coverage.map(cov => (
                      <span key={cov} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="w-3 h-3" /> {cov}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
