"use client";

import React, { useState } from "react";
import { usePharmacyStore } from "@/lib/stores/pharmacyStore";
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Search, ArrowUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const { stock } = usePharmacyStore();
  const role = useRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "ok">("all");

  if (!role) return null;

  const filtered = stock.filter(s => {
    const matchSearch = s.medicationName.toLowerCase().includes(searchTerm.toLowerCase());
    const isLow = s.quantityOnHand <= s.reorderLevel;
    if (filter === "low") return matchSearch && isLow;
    if (filter === "ok") return matchSearch && !isLow;
    return matchSearch;
  });

  const totalItems = stock.length;
  const lowStockCount = stock.filter(s => s.quantityOnHand <= s.reorderLevel).length;
  const okCount = totalItems - lowStockCount;
  const totalValue = stock.reduce((sum, s) => sum + s.quantityOnHand * 12.5, 0); // mock unit price

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h2>
          <p className="text-slate-500">Monitor medication stock levels and reorder status.</p>
        </div>
        {(role === "admin" || role === "pharmacist") && (
          <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Stock
          </Button>
        )}
      </div>

      {/* Summary KPIs with CSS shapes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: totalItems, shape: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", bg: "bg-blue-100", text: "text-blue-700" },
          { label: "Low Stock Alerts", value: lowStockCount, shape: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", bg: "bg-red-100", text: "text-red-700" },
          { label: "Well Stocked", value: okCount, shape: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)", bg: "bg-green-100", text: "text-green-700" },
          { label: "Est. Stock Value", value: `$${totalValue.toLocaleString()}`, shape: "polygon(0 15%, 15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%)", bg: "bg-amber-100", text: "text-amber-700" },
        ].map(item => (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("w-12 h-12 flex items-center justify-center font-black text-lg shrink-0", item.bg, item.text)}
                style={{ clipPath: item.shape }}>
                {typeof item.value === "number" ? item.value : ""}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</p>
                <p className="text-xl font-black text-slate-900">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search medications..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "ok"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize",
                filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}>
              {f === "all" ? "All" : f === "low" ? "⚠ Low Stock" : "✓ In Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Medication</th>
                <th className="px-6 py-4">Batch / Lot</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Reorder Level</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Status</th>
                {(role === "admin" || role === "pharmacist") && <th className="px-6 py-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map(s => {
                const isLow = s.quantityOnHand <= s.reorderLevel;
                const pct = Math.min(100, Math.round((s.quantityOnHand / (s.reorderLevel * 3)) * 100));
                return (
                  <tr key={s.stockId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Diamond CSS shape for med icon */}
                        <div
                          className={cn("w-9 h-9 flex items-center justify-center text-xs font-black shrink-0",
                            isLow ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"
                          )}
                          style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                        >
                          Rx
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.medicationName}</p>
                          <p className="text-xs text-slate-500">{s.stockId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{s.stockId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold text-base", isLow ? "text-red-600" : "text-slate-900")}>{s.quantityOnHand}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                          <div className={cn("h-full rounded-full transition-all", isLow ? "bg-red-500" : "bg-green-500")} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{s.reorderLevel} units</td>
                    <td className="px-6 py-4">
                      <span className={cn(s.expiryDate < "2026-12-31" ? "text-amber-600 font-semibold" : "text-slate-600")}>{s.expiryDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                          ● In Stock
                        </span>
                      )}
                    </td>
                    {(role === "admin" || role === "pharmacist") && (
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs">
                          <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" /> Reorder
                        </Button>
                      </td>
                    )}
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
