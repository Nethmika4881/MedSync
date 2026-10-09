"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquarePlus, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  History,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getBranches, 
  submitComplaint, 
  getMyComplaints, 
  PatientComplaintItem 
} from "@/lib/actions/patient-complaints";

export default function ComplaintsClientPage({ user }: { user: any }) {
  const [branches, setBranches] = useState<{ branchId: string; branchName: string }[]>([]);
  const [complaints, setComplaints] = useState<PatientComplaintItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    branchId: "",
    subject: "",
    message: "",
    priority: "Normal" as "Low" | "Normal" | "High" | "Urgent",
  });
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [branchRes, complaintsList] = await Promise.all([
        getBranches(),
        getMyComplaints(),
      ]);

      if (branchRes.success && branchRes.branches) {
        setBranches(branchRes.branches);
      }
      setComplaints(complaintsList);
    } catch (err) {
      console.error("Failed to load complaints data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await submitComplaint(formData);

    if (res.success) {
      setStatusMessage({ type: "success", text: res.message || "Complaint filed successfully." });
      setFormData({
        branchId: "",
        subject: "",
        message: "",
        priority: "Normal",
      });
      const updated = await getMyComplaints();
      setComplaints(updated);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to submit complaint." });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Support & Branch Feedback</h2>
        <p className="text-slate-500 text-sm">
          Submit concerns, service issues, or feedback directly to clinic administration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form */}
        <Card className="lg:col-span-5 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-teal-600" />
              File a Complaint or Concern
            </CardTitle>
            <CardDescription className="text-xs">
              Your inquiry will be routed to the respective branch manager and hospital admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {statusMessage && (
              <div
                className={cn(
                  "p-3 rounded-lg text-xs mb-4 flex items-center gap-2",
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Branch Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch / Clinic Location *
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full h-10 px-3 pr-8 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="" disabled>Select the branch involved...</option>
                    {branches.map((b) => (
                      <option key={b.branchId} value={b.branchId}>
                        {b.branchName}
                      </option>
                    ))}
                  </select>
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="Low">Low - General inquiry / suggestion</option>
                  <option value="Normal">Normal - Standard feedback or delay</option>
                  <option value="High">High - Significant issue or billing error</option>
                  <option value="Urgent">Urgent - Clinical concern or immediate incident</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Extended waiting time, Billing discrepancy"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Details *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe what happened, mentioning dates or staff names if applicable..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg h-10"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit to Administration
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: History */}
        <Card className="lg:col-span-7 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                My Submitted Complaints
              </span>
              <span className="text-xs font-normal text-slate-400">
                {complaints.length} total
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Track the progress and review statuses of your past reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="py-12 flex justify-center items-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                Loading your complaints...
              </div>
            ) : complaints.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                <p className="text-sm font-semibold text-slate-600">No complaints registered</p>
                <p className="text-xs text-slate-400">
                  You have not submitted any complaints or issues.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((item) => (
                  <div
                    key={item.complaintId}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {item.subject}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                            item.priority === "Urgent" || item.priority === "High"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 self-start sm:self-auto",
                          item.status === "Resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "Reviewed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {item.status === "Resolved" && <CheckCircle2 className="w-3 h-3" />}
                        {item.status === "Pending" && <Clock className="w-3 h-3" />}
                        {item.status === "Reviewed" && <AlertTriangle className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {item.branchName}
                      </span>
                      <span>Filed: {item.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}