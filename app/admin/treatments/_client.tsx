// "use client";

// import React, { useEffect, useState } from "react";
// import { useClinicalStore } from "@/lib/stores/clinicalStore";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { StatusPill } from "@/components/catms/StatusPill";
// import {
//   createTreatment,
//   deleteTreatment,
//   getTreatments,
//   updateTreatment,
//   type TreatmentInput,
// } from "@/lib/actions/treatments";
// import {
//   Activity, Check, ClipboardCheck, Clock, Loader2, Pencil, Plus, Search,
//   FlaskConical, Radiation, Stethoscope, Dumbbell,
//   Trash2, DollarSign, X,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import type { AuthUser } from "@/lib/types";

// // ─── Category config ──────────────────────────────────────────────────────────

// const CATEGORY_CONFIG: Record<
//   string,
//   { label: string; color: string; bg: string; Icon: React.ElementType }
// > = {
//   Laboratory: { label: "Laboratory",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   Icon: FlaskConical  },
//   Radiology:  { label: "Radiology",   color: "text-purple-700", bg: "bg-purple-50 border-purple-200", Icon: Radiation    },
//   Procedure:  { label: "Procedure",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  Icon: Stethoscope  },
//   Therapy:    { label: "Therapy",     color: "text-green-700",  bg: "bg-green-50 border-green-200",  Icon: Dumbbell     },
//   Consultation: { label: "Consultation", color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200", Icon: Stethoscope },
//   Injection: { label: "Injection", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", Icon: Activity },
//   Surgery: { label: "Surgery", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", Icon: Activity },
//   Other: { label: "Other", color: "text-slate-700", bg: "bg-slate-50 border-slate-200", Icon: Activity },
// };

// const CATEGORIES = ["All", "Consultation", "Radiology", "Laboratory", "Injection", "Surgery", "Other"];

// type Treatment = TreatmentInput & {
//   treatment_service_code: string;
//   duration: string | null;
//   description: string | null;
//   is_insurable: boolean;
//   is_active: boolean;
// };

// const EMPTY_FORM: TreatmentInput = {
//   category: "Laboratory",
//   treatment_name: "",
//   base_price: "",
//   duration: "00:15:00",
//   description: "",
//   is_insurable: true,
// };

// // ─── Admin View — Treatment Catalogue ─────────────────────────────────────────

// function AdminCatalogueView() {
//   const [search, setSearch] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [treatments, setTreatments] = useState<Treatment[]>([]);
//   const [form, setForm] = useState<TreatmentInput>(EMPTY_FORM);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState("");

//   const loadTreatments = async () => {
//     setIsLoading(true);
//     const result = await getTreatments();
//     if (result.success) {
//       setTreatments((result.data ?? []) as Treatment[]);
//       setError("");
//     } else {
//       setError(result.error ?? "Unable to load treatments.");
//     }
//     setIsLoading(false);
//   };

//   useEffect(() => {
//     void loadTreatments();
//   }, []);

//   const openCreateForm = () => {
//     setEditingId(null);
//     setForm(EMPTY_FORM);
//     setError("");
//     setIsFormOpen(true);
//   };

//   const openEditForm = (treatment: Treatment) => {
//     setEditingId(treatment.treatment_service_code);
//     setForm({
//       category: treatment.category,
//       treatment_name: treatment.treatment_name,
//       base_price: treatment.base_price,
//       duration: treatment.duration ?? "00:15:00",
//       description: treatment.description ?? "",
//       is_insurable: treatment.is_insurable,
//     });
//     setError("");
//     setIsFormOpen(true);
//   };

//   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsSaving(true);
//     setError("");
//     const result = editingId
//       ? await updateTreatment(editingId, form)
//       : await createTreatment(form);

//     if (!result.success) {
//       setError(result.error ?? "Unable to save treatment.");
//       setIsSaving(false);
//       return;
//     }

//     setIsFormOpen(false);
//     setIsSaving(false);
//     await loadTreatments();
//   };

//   const handleDelete = async (id: string) => {
//     if (!window.confirm("Deactivate this treatment?")) return;
//     setError("");
//     const result = await deleteTreatment(id);
//     if (!result.success) {
//       setError(result.error ?? "Unable to deactivate treatment.");
//       return;
//     }
//     await loadTreatments();
//   };

//   const filtered = treatments.filter((item) => {
//     const q = search.toLowerCase();
//     const matchesSearch =
//       !q ||
//       item.treatment_name.toLowerCase().includes(q) ||
//       (item.description ?? "").toLowerCase().includes(q);
//     const matchesCat =
//       selectedCategory === "All" || item.category === selectedCategory;
//     return matchesSearch && matchesCat;
//   });

//   // Stats per category
//   const stats = CATEGORIES.filter((c) => c !== "All").map((cat) => ({
//     cat,
//     count: treatments.filter((i) => i.category === cat).length,
//     avgPrice:
//       treatments
//         .filter((i) => i.category === cat)
//         .reduce((sum, i) => sum + Number(i.base_price), 0) /
//         (treatments.filter((i) => i.category === cat).length || 1),
//     ...CATEGORY_CONFIG[cat],
//   }));

//   return (
//     <div className="space-y-6 animate-fade-in">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
//             Treatment Catalogue
//           </h2>
//           <p className="text-slate-500">
//             Manage all treatment types, categories, and base prices.
//           </p>
//         </div>
//         <Button onClick={openCreateForm} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5 shrink-0">
//           <Plus className="w-4 h-4 mr-2" /> Add Treatment
//         </Button>
//       </div>

//       {isFormOpen && (
//         <Card className="border-[var(--brand-primary)] shadow-sm">
//           <CardContent className="p-5">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-bold text-slate-900">{editingId ? "Edit treatment" : "Add treatment"}</h3>
//               <Button type="button" variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} aria-label="Close form"><X /></Button>
//             </div>
//             <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <label className="text-sm font-medium text-slate-700">Treatment name
//                 <input required value={form.treatment_name} onChange={(e) => setForm({ ...form, treatment_name: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3" />
//               </label>
//               <label className="text-sm font-medium text-slate-700">Category
//                 <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 bg-white">
//                   {CATEGORIES.slice(1).map((category) => <option key={category}>{category}</option>)}
//                 </select>
//               </label>
//               <label className="text-sm font-medium text-slate-700">Base price
//                 <input required min="0" step="0.01" type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3" />
//               </label>
//               <label className="text-sm font-medium text-slate-700">Duration
//                 <input type="time" step="1" value={form.duration ?? ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3" />
//               </label>
//               <label className="text-sm font-medium text-slate-700 md:col-span-2">Description
//                 <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" rows={2} />
//               </label>
//               <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2"><input type="checkbox" checked={form.is_insurable ?? true} onChange={(e) => setForm({ ...form, is_insurable: e.target.checked })} /> Insurable treatment</label>
//               {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
//               <div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving} className="bg-[var(--brand-primary)] text-white">{isSaving ? <Loader2 className="animate-spin" /> : <Check />} Save treatment</Button></div>
//             </form>
//           </CardContent>
//         </Card>
//       )}

//       {error && !isFormOpen && <p className="text-sm text-red-600">{error}</p>}

//       {/* Category Summary Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {stats.map(({ cat, count, avgPrice, color, bg, Icon }) => (
//           <button
//             key={cat}
//             onClick={() =>
//               setSelectedCategory(cat === selectedCategory ? "All" : cat)
//             }
//             className={cn(
//               "p-4 rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
//               selectedCategory === cat
//                 ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg shadow-brand-500/20"
//                 : `${bg} hover:shadow-sm`
//             )}
//           >
//             <div
//               className={cn(
//                 "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
//                 selectedCategory === cat ? "bg-white/20" : "bg-white"
//               )}
//             >
//               <Icon
//                 className={cn(
//                   "w-4 h-4",
//                   selectedCategory === cat ? "text-white" : color
//                 )}
//               />
//             </div>
//             <p
//               className={cn(
//                 "text-xs font-semibold mb-1",
//                 selectedCategory === cat ? "text-white/80" : "text-slate-500"
//               )}
//             >
//               {cat}
//             </p>
//             <p
//               className={cn(
//                 "text-xl font-black",
//                 selectedCategory === cat ? "text-white" : "text-slate-900"
//               )}
//             >
//               {count}
//             </p>
//             <p
//               className={cn(
//                 "text-xs mt-0.5",
//                 selectedCategory === cat ? "text-white/70" : "text-slate-400"
//               )}
//             >
//               avg ${avgPrice.toFixed(0)}
//             </p>
//           </button>
//         ))}
//       </div>

//       {/* Search + Filter Bar */}
//       <div className="flex flex-col sm:flex-row gap-3">
//         <div className="relative flex-1 max-w-sm">
//           <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//           <input
//             type="text"
//             placeholder="Search treatments..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none bg-white"
//           />
//         </div>
//         <div className="flex gap-2 flex-wrap">
//           {CATEGORIES.map((cat) => (
//             <button
//               key={cat}
//               onClick={() => setSelectedCategory(cat)}
//               className={cn(
//                 "px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
//                 selectedCategory === cat
//                   ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
//                   : "bg-white text-slate-600 border-slate-200 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
//               )}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Catalogue Table */}
//       <Card className="border-slate-200 shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left text-slate-600">
//             <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
//               <tr>
//                 <th className="px-6 py-4">Treatment Name</th>
//                 <th className="px-6 py-4">Category</th>
//                 <th className="px-6 py-4">Description</th>
//                 <th className="px-6 py-4">
//                   <span className="flex items-center gap-1">
//                     <DollarSign className="w-3.5 h-3.5" /> Unit Price
//                   </span>
//                 </th>
//                 <th className="px-6 py-4 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100 bg-white">
//               {filtered.map((item) => {
//                 const catCfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.Other;
//                 const Icon = catCfg?.Icon ?? Activity;
//                 return (
//                   <tr
//                     key={item.treatment_service_code}
//                     className="hover:bg-slate-50/50 transition-colors"
//                   >
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-3">
//                         <div
//                           className={cn(
//                             "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
//                             catCfg?.bg ?? "bg-slate-50 border-slate-200"
//                           )}
//                         >
//                           <Icon
//                             className={cn(
//                               "w-4 h-4",
//                               catCfg?.color ?? "text-slate-400"
//                             )}
//                           />
//                         </div>
//                         <div>
//                           <p className="font-semibold text-slate-900">
//                             {item.treatment_name}
//                           </p>
//                           <p className="text-xs text-slate-400 font-mono">
//                             {item.treatment_service_code}
//                           </p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span
//                         className={cn(
//                           "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
//                           catCfg?.bg ?? "bg-slate-50 border-slate-200",
//                           catCfg?.color ?? "text-slate-600"
//                         )}
//                       >
//                         <Icon className="w-3 h-3" />
//                         {item.category}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
//                       {item.description || "No description"}
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className="font-bold text-slate-900 text-base">
//                         ${Number(item.base_price).toFixed(2)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-right">
//                       <div className="flex items-center justify-end gap-2">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => openEditForm(item)}
//                           className="rounded-lg h-8 gap-1.5 text-slate-600"
//                         >
//                           <Pencil className="w-3.5 h-3.5" /> Edit
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => void handleDelete(item.treatment_service_code)}
//                           className="rounded-lg h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
//                         >
//                           <Trash2 className="w-3.5 h-3.5" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//               {!isLoading && filtered.length === 0 && (
//                 <tr>
//                   <td
//                     colSpan={5}
//                     className="px-6 py-12 text-center text-slate-400"
//                   >
//                     <Activity className="w-8 h-8 mx-auto mb-2 text-slate-200" />
//                     <p className="font-semibold">No treatments found</p>
//                     <p className="text-sm">Try adjusting your search or filter.</p>
//                   </td>
//                 </tr>
//               )}
//               {isLoading && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></td></tr>}
//             </tbody>
//           </table>
//         </div>
//         <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
//           <p className="text-xs text-slate-500">
//             Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
//             <span className="font-semibold text-slate-700">{treatments.length}</span> items
//           </p>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─── Doctor View — Clinical Task Queue ────────────────────────────────────────

// function DoctorTaskView({ user }: { user: AuthUser }) {
//   const { treatments, markTreatmentPerformed } = useClinicalStore();
  
//   const [activeTab, setActiveTab] = useState("pending");

//   const pendingTreatments = treatments.filter((t) => t.status !== "Completed");
//   const completedTreatments = treatments.filter(
//     (t) => t.status === "Completed"
//   );

//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div>
//         <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
//           Clinical Treatments &amp; Tasks
//         </h2>
//         <p className="text-slate-500">
//           Administer patient treatments and mark clinical orders as performed.
//         </p>
//       </div>

//       <div className="flex gap-2 border-b border-slate-200">
//         <button
//           onClick={() => setActiveTab("pending")}
//           className={cn(
//             "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
//             activeTab === "pending"
//               ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
//               : "border-transparent text-slate-500 hover:text-slate-900"
//           )}
//         >
//           Pending Tasks ({pendingTreatments.length})
//         </button>
//         <button
//           onClick={() => setActiveTab("completed")}
//           className={cn(
//             "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
//             activeTab === "completed"
//               ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
//               : "border-transparent text-slate-500 hover:text-slate-900"
//           )}
//         >
//           Completed
//         </button>
//       </div>

//       {activeTab === "pending" && (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {pendingTreatments.map((treatment) => {
//             const catCfg = CATEGORY_CONFIG[treatment.category] ?? CATEGORY_CONFIG["Procedure"];
//             const Icon = catCfg.Icon;
//             return (
//               <Card
//                 key={treatment.treatmentId}
//                 className="border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-shadow"
//               >
//                 <CardContent className="p-5">
//                   <div className="flex items-center gap-3 mb-3">
//                     <div
//                       className={cn(
//                         "w-9 h-9 flex items-center justify-center shrink-0 rounded-xl border",
//                         catCfg.bg
//                       )}
//                     >
//                       <Icon className={cn("w-4 h-4", catCfg.color)} />
//                     </div>
//                     <div>
//                       <h4 className="font-bold text-slate-900">
//                         {treatment.patientName}
//                       </h4>
//                       <p className="text-xs text-slate-500 flex items-center gap-1">
//                         <Clock className="w-3 h-3" /> Ordered{" "}
//                         {new Date().toLocaleTimeString([], {
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="mb-4">
//                     <p className="font-semibold text-[var(--brand-primary)] text-sm">
//                       {treatment.treatmentName}
//                     </p>
//                     <p className="text-sm text-slate-600 mt-1">
//                       {treatment.description || "No additional instructions."}
//                     </p>
//                   </div>

//                   <div className="flex items-center justify-between pt-4 border-t border-slate-100">
//                     <span
//                       className={cn(
//                         "text-xs font-semibold px-2.5 py-1 rounded-full border",
//                         catCfg.bg,
//                         catCfg.color
//                       )}
//                     >
//                       {treatment.category}
//                     </span>
//                     <Button
//                       onClick={() =>
//                         markTreatmentPerformed(
//                           treatment.treatmentId,
//                           user?.name || "Doctor"
//                         )
//                       }
//                       className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg h-9 px-4 text-xs font-bold"
//                     >
//                       <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> Mark
//                       Performed
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })}
//           {pendingTreatments.length === 0 && (
//             <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
//               <Activity className="w-8 h-8 mx-auto text-slate-300 mb-3" />
//               <p className="font-semibold">All caught up!</p>
//               <p className="text-sm">There are no pending treatment orders.</p>
//             </div>
//           )}
//         </div>
//       )}

//       {activeTab === "completed" && (
//         <Card className="border-slate-200 shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm text-left text-slate-600">
//               <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
//                 <tr>
//                   <th className="px-6 py-4">Time Administered</th>
//                   <th className="px-6 py-4">Patient</th>
//                   <th className="px-6 py-4">Treatment / Task</th>
//                   <th className="px-6 py-4">Administered By</th>
//                   <th className="px-6 py-4 text-right">Status</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 bg-white">
//                 {completedTreatments.map((t) => (
//                   <tr key={t.treatmentId} className="hover:bg-slate-50/50">
//                     <td className="px-6 py-4">
//                       {t.performedAt
//                         ? new Date(t.performedAt).toLocaleString()
//                         : "N/A"}
//                     </td>
//                     <td className="px-6 py-4 font-semibold text-slate-900">
//                       {t.patientName}
//                     </td>
//                     <td className="px-6 py-4 text-[var(--brand-primary)] font-medium">
//                       {t.treatmentName}
//                     </td>
//                     <td className="px-6 py-4 text-slate-500">
//                       {t.performedBy}
//                     </td>
//                     <td className="px-6 py-4 text-right">
//                       <StatusPill status={t.status} />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─── Root export — role router ─────────────────────────────────────────────────

// export default function TreatmentsPage({ user }: { user: AuthUser }) {
//   const role = user?.role;
  

//   if (!role) return null;

//   if (role === "admin") return <AdminCatalogueView />;
//   if (role === "doctor") return <DoctorTaskView user={user} />;

//   // receptionist / patient — no access
//   return (
//     <div className="flex items-center justify-center h-96 text-slate-500">
//       You do not have permission to view this page.
//     </div>
//   );
// }


"use client";

import React, { useState, useEffect } from "react";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import toast, { Toaster } from "react-hot-toast";
import {
  Activity, ClipboardCheck, Clock, Plus, Search,
  FlaskConical, Radiation, Stethoscope, Dumbbell,
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
  Consultation: { label: "Consultation", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", Icon: Stethoscope },
  Radiology: { label: "Radiology", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", Icon: Radiation },
  Laboratory: { label: "Laboratory", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", Icon: FlaskConical },
  Injection: { label: "Injection", color: "text-green-700", bg: "bg-green-50 border-green-200", Icon: Syringe },
  Surgery: { label: "Surgery", color: "text-red-700", bg: "bg-red-50 border-red-200", Icon: Scissors },
  Other: { label: "Other", color: "text-slate-700", bg: "bg-slate-50 border-slate-200", Icon: Activity },
};

const CATEGORIES = ["All", "Consultation", "Radiology", "Laboratory", "Injection", "Surgery", "Other"];

// ─── Admin View — Treatment Catalogue ─────────────────────────────────────────

function AdminCatalogueView() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  useEffect(() => {
    async function loadTreatments() {
      const result = await getTreatments();
      if (result.success) {
        setTreatments(result.data ?? []);
      } else {
        toast.error("Failed to load treatments.");
      }
      setIsLoading(false);
    }
    void loadTreatments();
  }, []);

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
      toast.error("Base price must be greater than $0.");
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
        setTreatments((prev) => prev.map((t) => (
          t.treatment_service_code === editingId ? result.data : t
        )));
        toast.success("Treatment updated successfully");
      } else {
        setTreatments((prev) => [result.data, ...prev]);
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
      setTreatments((prev) => prev.filter((t) => t.treatment_service_code !== id));
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
    const categoryItems = treatments.filter((i) => i.category === cat);
    const count = categoryItems.length;
    const avgPrice = count > 0 ? categoryItems.reduce((sum, i) => sum + Number(i.base_price), 0) / count : 0;
    return { cat, count, avgPrice, ...(CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"]) };
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Treatment Catalogue</h2>
          <p className="text-slate-500">Manage all treatment types, categories, and base prices.</p>
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
            <p className={cn("text-xs mt-0.5", selectedCategory === cat ? "text-white/70" : "text-slate-400")}>avg ${avgPrice.toFixed(0)}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search treatments..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm outline-none bg-white" />
        </div>
      </div>

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
                      <td className="px-6 py-4"><span className="font-bold text-slate-900 text-base">${Number(item.base_price).toFixed(2)}</span></td>
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

function DoctorTaskView({ user }: { user: any }) {
  const { treatments } = useClinicalStore();
  return <div className="p-8">Doctor view placeholder</div>;
}

export default function TreatmentsPage({ user }: { user: any }) {
  const role = user?.role;
  if (!role) return null;
  if (role === "admin") return <AdminCatalogueView />;
  if (role === "doctor") return <DoctorTaskView user={user} />;
  return <div className="flex items-center justify-center h-96 text-slate-500">No permission.</div>;
}
