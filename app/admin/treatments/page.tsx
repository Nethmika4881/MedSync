"use client";

import React, { useState } from "react";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { useRole, useCurrentUser } from "@/lib/stores/authStore";
import { treatmentCatalogue } from "@/lib/constants";;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import {
  Activity, ClipboardCheck, Clock, Plus, Search,
  FlaskConical, Radiation, Stethoscope, Dumbbell,
  Pencil, Trash2, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  Laboratory: { label: "Laboratory",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   Icon: FlaskConical  },
  Radiology:  { label: "Radiology",   color: "text-purple-700", bg: "bg-purple-50 border-purple-200", Icon: Radiation    },
  Procedure:  { label: "Procedure",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  Icon: Stethoscope  },
  Therapy:    { label: "Therapy",     color: "text-green-700",  bg: "bg-green-50 border-green-200",  Icon: Dumbbell     },
};

const CATEGORIES = ["All", "Laboratory", "Radiology", "Procedure", "Therapy"];

// ─── Admin View — Treatment Catalogue ─────────────────────────────────────────

function AdminCatalogueView() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = treatmentCatalogue.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    const matchesCat =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Stats per category
  const stats = CATEGORIES.filter((c) => c !== "All").map((cat) => ({
    cat,
    count: treatmentCatalogue.filter((i) => i.category === cat).length,
    avgPrice:
      treatmentCatalogue
        .filter((i) => i.category === cat)
        .reduce((sum, i) => sum + i.unitPrice, 0) /
        (treatmentCatalogue.filter((i) => i.category === cat).length || 1),
    ...CATEGORY_CONFIG[cat],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Treatment Catalogue
          </h2>
          <p className="text-slate-500">
            Manage all treatment types, categories, and base prices.
          </p>
        </div>
        <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add Treatment
        </Button>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ cat, count, avgPrice, color, bg, Icon }) => (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(cat === selectedCategory ? "All" : cat)
            }
            className={cn(
              "p-4 rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
              selectedCategory === cat
                ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg shadow-brand-500/20"
                : `${bg} hover:shadow-sm`
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
                selectedCategory === cat ? "bg-white/20" : "bg-white"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  selectedCategory === cat ? "text-white" : color
                )}
              />
            </div>
            <p
              className={cn(
                "text-xs font-semibold mb-1",
                selectedCategory === cat ? "text-white/80" : "text-slate-500"
              )}
            >
              {cat}
            </p>
            <p
              className={cn(
                "text-xl font-black",
                selectedCategory === cat ? "text-white" : "text-slate-900"
              )}
            >
              {count}
            </p>
            <p
              className={cn(
                "text-xs mt-0.5",
                selectedCategory === cat ? "text-white/70" : "text-slate-400"
              )}
            >
              avg ${avgPrice.toFixed(0)}
            </p>
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                selectedCategory === cat
                  ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalogue Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Treatment Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Unit Price
                  </span>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => {
                const catCfg = CATEGORY_CONFIG[item.category];
                const Icon = catCfg?.Icon ?? Activity;
                return (
                  <tr
                    key={item.catalogueId}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                            catCfg?.bg ?? "bg-slate-50 border-slate-200"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4 h-4",
                              catCfg?.color ?? "text-slate-400"
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {item.catalogueId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                          catCfg?.bg ?? "bg-slate-50 border-slate-200",
                          catCfg?.color ?? "text-slate-600"
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 text-base">
                        ${item.unitPrice}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg h-8 gap-1.5 text-slate-600"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="font-semibold">No treatments found</p>
                    <p className="text-sm">Try adjusting your search or filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{treatmentCatalogue.length}</span> items
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Doctor View — Clinical Task Queue ────────────────────────────────────────

function DoctorTaskView() {
  const { treatments, markTreatmentPerformed } = useClinicalStore();
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("pending");

  const pendingTreatments = treatments.filter((t) => t.status !== "Completed");
  const completedTreatments = treatments.filter(
    (t) => t.status === "Completed"
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Clinical Treatments &amp; Tasks
        </h2>
        <p className="text-slate-500">
          Administer patient treatments and mark clinical orders as performed.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={cn(
            "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
            activeTab === "pending"
              ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          Pending Tasks ({pendingTreatments.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={cn(
            "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
            activeTab === "completed"
              ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          Completed
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingTreatments.map((treatment) => {
            const catCfg = CATEGORY_CONFIG[treatment.category] ?? CATEGORY_CONFIG["Procedure"];
            const Icon = catCfg.Icon;
            return (
              <Card
                key={treatment.treatmentId}
                className="border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "w-9 h-9 flex items-center justify-center shrink-0 rounded-xl border",
                        catCfg.bg
                      )}
                    >
                      <Icon className={cn("w-4 h-4", catCfg.color)} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {treatment.patientName}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Ordered{" "}
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-semibold text-[var(--brand-primary)] text-sm">
                      {treatment.treatmentName}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {treatment.description || "No additional instructions."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full border",
                        catCfg.bg,
                        catCfg.color
                      )}
                    >
                      {treatment.category}
                    </span>
                    <Button
                      onClick={() =>
                        markTreatmentPerformed(
                          treatment.treatmentId,
                          user?.name || "Doctor"
                        )
                      }
                      className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg h-9 px-4 text-xs font-bold"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> Mark
                      Performed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pendingTreatments.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Activity className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold">All caught up!</p>
              <p className="text-sm">There are no pending treatment orders.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Time Administered</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Treatment / Task</th>
                  <th className="px-6 py-4">Administered By</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {completedTreatments.map((t) => (
                  <tr key={t.treatmentId} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      {t.performedAt
                        ? new Date(t.performedAt).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {t.patientName}
                    </td>
                    <td className="px-6 py-4 text-[var(--brand-primary)] font-medium">
                      {t.treatmentName}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {t.performedBy}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StatusPill status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Root export — role router ─────────────────────────────────────────────────

export default function TreatmentsPage() {
  const role = useRole();

  if (!role) return null;

  if (role === "admin") return <AdminCatalogueView />;
  if (role === "doctor") return <DoctorTaskView />;

  // receptionist / patient — no access
  return (
    <div className="flex items-center justify-center h-96 text-slate-500">
      You do not have permission to view this page.
    </div>
  );
}
