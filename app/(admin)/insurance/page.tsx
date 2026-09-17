"use client";

import React, { useState } from "react";
import { insuranceProviders, insurancePackages } from "@/lib/constants";;
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, Phone, Mail, Globe, CheckCircle2, Building2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PROVIDER_COLORS = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-teal-500 to-teal-600",
  "from-amber-500 to-amber-600",
];

export default function InsurancePage() {
  const role = useRole();
  const [activeTab, setActiveTab] = useState("providers");

  if (!role) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Insurance Management</h2>
          <p className="text-slate-500">Manage insurance providers, packages, and patient coverage.</p>
        </div>
        {(role === "admin") && (
          <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Provider
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="providers" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4 mr-2" /> Providers
          </TabsTrigger>
          <TabsTrigger value="packages" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield className="w-4 h-4 mr-2" /> Packages
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insuranceProviders.map((prov, i) => {
              const gradient = PROVIDER_COLORS[i % PROVIDER_COLORS.length];
              const pkgs = insurancePackages.filter(p => p.providerId === prov.providerId);

              return (
                <Card key={prov.providerId} className="border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  {/* Header with CSS shape decoration */}
                  <div className={cn("relative h-28 bg-gradient-to-r p-6 flex items-center gap-4 overflow-hidden", gradient)}>
                    {/* CSS shape decoration in background */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10"
                      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
                    <div className="absolute right-10 bottom-2 w-12 h-12 bg-white/10"
                      style={{ clipPath: "polygon(0 15%, 15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%)" }} />

                    {/* Provider Icon — CSS Shape */}
                    <div
                      className="w-14 h-14 bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"
                      style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
                    >
                      <Shield className="w-7 h-7 text-white" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{prov.name}</h3>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block",
                        prov.isActive ? "bg-white/20 text-white" : "bg-red-200/30 text-red-100"
                      )}>
                        {prov.isActive ? "● Active Partner" : "● Inactive"}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="space-y-2.5 mb-5">
                      <a href={`tel:${prov.contactPhone}`} className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-[var(--brand-primary)] transition-colors">
                        <Phone className="w-4 h-4 text-slate-400" /> {prov.contactPhone}
                      </a>
                      <a href={`mailto:${prov.contactEmail}`} className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-[var(--brand-primary)] transition-colors">
                        <Mail className="w-4 h-4 text-slate-400" /> {prov.contactEmail}
                      </a>
                      <a href={`https://${prov.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-[var(--brand-primary)] hover:underline">
                        <Globe className="w-4 h-4" /> {prov.website}
                      </a>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Active Packages ({pkgs.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pkgs.map(pkg => (
                          <span key={pkg.packageId}
                            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {pkg.packageName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insurancePackages.map((pkg, i) => {
              const gradient = PROVIDER_COLORS[insuranceProviders.findIndex(p => p.providerId === pkg.providerId) % PROVIDER_COLORS.length];
              return (
                <Card key={pkg.packageId} className="border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <div className={cn("h-3 bg-gradient-to-r", gradient)} />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{pkg.packageName}</h3>
                        <p className="text-sm text-slate-500">{pkg.providerName}</p>
                      </div>
                      {/* Pentagon CSS shape */}
                      <div
                        className="w-12 h-12 bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700"
                        style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}
                      >
                        {pkg.copayPercent}%
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Annual Limit</span>
                        <span className="font-bold text-slate-900">${pkg.annualLimit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Copay Coverage</span>
                        <span className="font-bold text-green-600">{pkg.copayPercent}%</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Covers</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.coverage.map(cov => (
                          <span key={cov}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
