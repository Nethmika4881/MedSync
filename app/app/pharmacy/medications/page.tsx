"use client";

import React, { useState } from "react";
import { medications } from "@/lib/mockData/medications";
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Info, ShieldAlert, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MedicationsDatabasePage() {
  const role = useRole();
  const [searchTerm, setSearchTerm] = useState("");

  if (!role || (role !== "pharmacist" && role !== "admin")) return null;

  const filteredMeds = medications.filter(m => 
    m.genericName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.brandName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/app/pharmacy">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Medication Database</h2>
            <p className="text-slate-500">Reference clinical drug information and contraindications.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search generic or brand..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full md:w-64 rounded-xl border border-slate-200 text-sm focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] outline-none"
            />
          </div>
          <Button className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)] rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add Drug
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeds.map(med => (
          <Card key={med.medicationId} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{med.genericName}</h3>
                  <p className="text-sm text-[var(--brand-primary)] font-semibold mt-0.5">{med.brandName}</p>
                </div>
                {/* CSS Shield Shape for form */}
                <div className="w-12 h-12 bg-slate-100 text-slate-600 flex flex-col items-center justify-center shrink-0"
                  style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                  <span className="text-xs font-bold capitalize">{med.form.substring(0, 4)}</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-medium text-slate-700">{med.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Available Strengths:</span>
                  <span className="font-medium text-slate-700">{med.strength}</span>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                  <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Indication</p>
                  <p className="text-xs text-slate-700">Used for {med.category.toLowerCase()} treatments.</p>
                </div>

                {med.contraindications.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Contraindications</p>
                    <ul className="list-disc pl-4 text-xs text-red-600 space-y-0.5">
                      {med.contraindications.split(", ").map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">{med.medicationId}</span>
                <button className="text-[var(--brand-primary)] font-semibold hover:underline">View Full Monograph</button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredMeds.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No medications found matching "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}
