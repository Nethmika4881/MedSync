"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import {
  Activity, Plus, Search, ChevronLeft, ChevronRight,
  FlaskConical, Radiation, Stethoscope,
  Pencil, Trash2, DollarSign, Syringe, Scissors, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createTreatment,
  deleteTreatment,
  getTreatments,
  updateTreatment,
  type TreatmentInput,
} from "@/lib/actions/treatments";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  Consultation: { label: "Consultation", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:border-blue-800/50", Icon: Stethoscope },
  Radiology: { label: "Radiology", color: "text-purple-700 dark:text-purple-200", bg: "bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:border-purple-800/50", Icon: Radiation },
  Laboratory: { label: "Laboratory", color: "text-amber-700 dark:text-amber-200", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800/50", Icon: FlaskConical },
  Injection: { label: "Injection", color: "text-green-700 dark:text-emerald-300", bg: "bg-green-50 border-green-200 dark:bg-emerald-950/60 dark:border-emerald-800/50", Icon: Syringe },
  Surgery: { label: "Surgery", color: "text-red-700 dark:text-rose-300", bg: "bg-red-50 border-red-20 dark:bg-rose-950/60 dark:border-rose-800/50", Icon: Scissors },
  Other: { label: "Other", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/60", Icon: Activity },
};

const CATEGORIES = ["All", "Consultation", "Radiology", "Laboratory", "Injection", "Surgery", "Other"];

// ─── Admin View — Treatment Catalogue ─────────────────────────────────────────

function AdminCatalogueView() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, pages: 0, pageSize: 10 });
  const [categoryStats, setCategoryStats] = useState<Record<string, { count: number; avgPrice: number }>>({});

  // --- Modal & Loading States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    treatment_name: "",
    category: "Consultation",
    base_price: "",
    duration: "00:15:00", // Hidden default
    description: "",
    is_insurable: true,
  });

  const loadTreatments = useCallback(async (requestedPage: number) => {
    setIsLoading(true);
    const result = await getTreatments(requestedPage, pagination.pageSize);
    if (result.success) {
      setTreatments(result.data ?? []);
      setCategoryStats(result.stats ?? {});
      setPagination(result.pagination ?? { count: 0, pages: 0, pageSize: 10 });
      setPage(result.pagination?.currentPage ?? requestedPage);
    } else {
      toast.error("Failed to load treatments.");
    }
    setIsLoading(false);
  }, [pagination.pageSize]);

  useEffect(() => {
    void loadTreatments(1);
  }, [loadTreatments]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.pages || nextPage === page) return;
    void loadTreatments(nextPage);
  };

  const reloadAfterMutation = async () => {
    const targetPage = page > 1 && treatments.length === 1 ? page - 1 : page;
    await loadTreatments(targetPage);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      treatment_name: "",
      category: "Consultation",
      base_price: "",
      duration: "00:15:00",
      description: "",
      is_insurable: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.treatment_service_code);
    setFormData({
      treatment_name: item.treatment_name,
      category: item.category,
      base_price: item.base_price,
      duration: item.duration || "00:15:00",
      description: item.description || "",
      is_insurable: item.is_insurable,
    });
    setIsModalOpen(true);
  };

  const validateForm = () => {
    if (!formData.treatment_name.trim()) {
      toast.error("Treatment name cannot be empty.");
      return false;
    }
    if (Number(formData.base_price) <= 0) {
      toast.error("Base price must be greater than Rs. 0.");
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const input: TreatmentInput = {
      ...formData,
      base_price: Number(formData.base_price),
    };

    const result = editingId
      ? await updateTreatment(editingId, input)
      : await createTreatment(input);

    if (result.success) {
      if (editingId) {
        await loadTreatments(page);
        toast.success("Treatment updated successfully");
      } else {
        await loadTreatments(1);
        toast.success("Treatment added successfully");
      }
      setIsModalOpen(false);
    } else {
      toast.error(result.error ?? "Failed to save treatment.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this treatment?")) return;
    
    setDeletingId(id);
    const result = await deleteTreatment(id);
    if (result.success) {
      await reloadAfterMutation();
      toast.success("Treatment deleted successfully");
    } else {
      toast.error(result.error ?? "Failed to delete treatment.");
    }
    setDeletingId(null);
  };

  const filtered = treatments.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.treatment_name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const stats = CATEGORIES.filter((c) => c !== "All").map((cat) => {
    const { count = 0, avgPrice = 0 } = categoryStats[cat] ?? {};
    return { cat, count, avgPrice, ...(CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"]) };
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Treatment Catalogue</h2>
          <p className="text-slate-500">Manage all treatment types, categories, and prices.</p>
        </div>
        <Button onClick={openAddModal} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add Treatment
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ cat, count, avgPrice, color, bg, Icon }) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? "All" : cat)}
            className={cn("p-4 rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md", selectedCategory === cat ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg shadow-brand-500/20" : `${bg} hover:shadow-sm`)}
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", selectedCategory === cat ? "bg-white/20" : "bg-white")}>
              <Icon className={cn("w-4 h-4", selectedCategory === cat ? "text-white" : color)} />
            </div>
            <p className={cn("text-xs font-semibold mb-1", selectedCategory === cat ? "text-white/80" : "text-slate-500")}>{cat}</p>
            <p className={cn("text-xl font-black", selectedCategory === cat ? "text-white" : "text-slate-900")}>{count}</p>
            <p className={cn("text-xs mt-0.5", selectedCategory === cat ? "text-white/70" : "text-slate-400")}>avg Rs. {avgPrice.toFixed(0)}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search treatments..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm outline-none bg-white" />
        </div>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * pagination.pageSize + 1}-
            {Math.min(page * pagination.pageSize, pagination.count)} of {pagination.count} treatments
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: pagination.pages }, (_, index) => index + 1).map((pageNumber) => (
              <Button
                key={pageNumber}
                type="button"
                variant={pageNumber === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNumber)}
                disabled={isLoading}
                className={pageNumber === page ? "bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white" : ""}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page === pagination.pages || isLoading}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Treatment Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4"><span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Base Price</span></th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />Loading treatments...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Activity className="w-8 h-8 mx-auto mb-2 text-slate-200" /><p className="font-semibold">No treatments found</p></td></tr>
              ) : (
                filtered.map((item) => {
                  const catCfg = CATEGORY_CONFIG[item.category];
                  const Icon = catCfg?.Icon ?? Activity;
                  const isDeletingThis = deletingId === item.treatment_service_code;

                  return (
                    <tr key={item.treatment_service_code} className={cn("hover:bg-slate-50/50 transition-colors", isDeletingThis && "opacity-50 pointer-events-none")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", catCfg?.bg ?? "bg-slate-50 border-slate-200")}>
                            <Icon className={cn("w-4 h-4", catCfg?.color ?? "text-slate-400")} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{item.treatment_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", catCfg?.bg ?? "bg-slate-50 border-slate-200", catCfg?.color ?? "text-slate-600")}>
                          <Icon className="w-3 h-3" /> {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{item.description || "—"}</td>
                      <td className="px-6 py-4"><span className="font-bold text-slate-900 text-base">Rs. {Number(item.base_price).toFixed(2)}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditModal(item)} disabled={isDeletingThis} className="rounded-lg h-8 gap-1.5 text-slate-600">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item.treatment_service_code)} disabled={isDeletingThis} className="rounded-lg h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                            {isDeletingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-xl border-0">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{editingId ? "Edit Treatment" : "Add New Treatment"}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Name</label>
                  <input required type="text" value={formData.treatment_name} onChange={(e) => setFormData({ ...formData, treatment_name: e.target.value })} disabled={isSubmitting} className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-[var(--brand-primary)] disabled:opacity-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={isSubmitting} className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-[var(--brand-primary)] bg-white disabled:opacity-50">
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Price ($)</label>
                    <input required type="number" step="0.01" min="0.01" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} disabled={isSubmitting} className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-[var(--brand-primary)] disabled:opacity-50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={isSubmitting} className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-[var(--brand-primary)] resize-none disabled:opacity-50" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white w-32">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function DoctorTaskView() {
  return <div className="p-8">Doctor view placeholder</div>;
}

export default function TreatmentsPage({ user }: { user: any }) {
  const role = user?.role;
  if (!role) return null;
  if (role === "admin") return <AdminCatalogueView />;
  if (role === "doctor") return <DoctorTaskView />;
  return <div className="flex items-center justify-center h-96 text-slate-500">No permission.</div>;
}
