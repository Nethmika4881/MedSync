"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  Banknote,
  Loader2,
  RefreshCw,
  Search,
  AlertCircle,
  Eye,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getClaimsQueue,
  approveClaim,
  settleClaim,
  rejectClaim,
  ClaimItem,
} from "@/lib/actions/admin-insurance"; // Use your actual action file import

export default function InsuranceClaimsPage() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("Submitted");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [modalMode, setModalMode] = useState<"VIEW" | "APPROVE" | "REJECT" | null>(null);

  const [approvalAmount, setApprovalAmount] = useState<number>(0);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getClaimsQueue(filterStatus);
      setClaims(data);
    } catch (err: any) {
      console.error("Claims queue error:", err);
      setAlert({ type: "error", text: err?.message || "Failed to fetch claims records." });
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  const openApproveModal = (claim: ClaimItem) => {
    setSelectedClaim(claim);
    const copayFactor = (100 - Number(claim.copaymentPercentage)) / 100;
    const suggested = Math.round(Number(claim.claimAmount) * copayFactor);
    setApprovalAmount(suggested);
    setAdminRemarks("");
    setModalMode("APPROVE");
  };

  const handleApproveSubmit = async () => {
    if (!selectedClaim) return;
    setIsSubmitting(true);
    setAlert(null);

    const res = await approveClaim({
      claimId: selectedClaim.claimId,
      approvedAmount: Number(approvalAmount),
      remarks: adminRemarks,
    });

    if (res.success) {
      setAlert({ type: "success", text: res.message || "Claim approved successfully." });
      setModalMode(null);
      void loadClaims();
    } else {
      setAlert({ type: "error", text: res.error || "Approval failed." });
    }
    setIsSubmitting(false);
  };

  const handleSettle = async (claimId: string) => {
    setIsSubmitting(true);
    setAlert(null);
    const res = await settleClaim(claimId);
    if (res.success) {
      setAlert({ type: "success", text: res.message || "Claim marked as settled." });
      void loadClaims();
    } else {
      setAlert({ type: "error", text: res.error || "Failed to settle claim." });
    }
    setIsSubmitting(false);
  };

  const handleRejectSubmit = async () => {
    if (!selectedClaim) return;
    setIsSubmitting(true);
    setAlert(null);
    const res = await rejectClaim(selectedClaim.claimId, adminRemarks);
    if (res.success) {
      setAlert({ type: "success", text: res.message || "Claim rejected." });
      setModalMode(null);
      void loadClaims();
    } else {
      setAlert({ type: "error", text: res.error || "Failed to reject claim." });
    }
    setIsSubmitting(false);
  };

  const filteredClaims = claims.filter(
    (c) =>
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.providerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Insurance Claims</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void loadClaims()}
          disabled={isLoading}
          className="h-9 text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin text-teal-600")} />
          Refresh Queue
        </Button>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          role="alert"
          className={cn(
            "p-3.5 rounded-lg text-xs flex items-center justify-between border shadow-xs transition-all",
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          )}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-100 rounded-lg text-xs font-medium w-full sm:w-auto">
          {(["Submitted", "Approved", "Settled", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-md transition-all",
                filterStatus === tab
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab === "Submitted"
                ? "Pending Queue"
                : tab === "Approved"
                ? "Approved"
                : tab === "Settled"
                ? "Settled"
                : "All Claims"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, policy, or insurer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Claims Table */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Claims Directory
            </span>
            <span className="text-xs font-normal text-slate-500">
              {filteredClaims.length} records found
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Claim ID & Date</th>
                  <th className="py-3.5 px-4 font-semibold">Patient & Policy</th>
                  <th className="py-3.5 px-4 font-semibold">Insurer / Package</th>
                  <th className="py-3.5 px-4 font-semibold">Claimed</th>
                  <th className="py-3.5 px-4 font-semibold">Approved</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                        <span>Loading claims queue...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No claim records in this status.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim.claimId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-700 font-medium">{claim.claimId.slice(0, 8)}...</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(claim.submittedAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{claim.patientName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Pol: {claim.policyNumber}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{claim.providerName}</div>
                        <div className="text-[11px] text-slate-400">{claim.packageName}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        Rs. {Number(claim.claimAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {claim.approvedAmount > 0
                          ? `Rs. ${Number(claim.approvedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : <span className="text-slate-400 font-normal italic">Pending</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center",
                            claim.status.toLowerCase() === "submitted" && "bg-amber-100 text-amber-800",
                            claim.status.toLowerCase() === "approved" && "bg-blue-100 text-blue-800",
                            claim.status.toLowerCase() === "settled" && "bg-emerald-100 text-emerald-800",
                            claim.status.toLowerCase() === "rejected" && "bg-rose-100 text-rose-800"
                          )}
                        >
                          {claim.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setModalMode("VIEW");
                          }}
                          className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>

                        {claim.status.toLowerCase() === "submitted" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openApproveModal(claim)}
                              className="h-7 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedClaim(claim);
                                setAdminRemarks("");
                                setModalMode("REJECT");
                              }}
                              className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {claim.status.toLowerCase() === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => handleSettle(claim.claimId)}
                            className="h-7 px-2.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                          >
                            <Banknote className="w-3.5 h-3.5 mr-1" />
                            Settle
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog / Modal */}
      {modalMode && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                {modalMode === "APPROVE" && "Approve Reimbursement Claim"}
                {modalMode === "REJECT" && "Reject Claim"}
                {modalMode === "VIEW" && "Claim & Patient Details"}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Claim Details Card */}
            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-semibold text-slate-900">{selectedClaim.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Policy:</span>
                <span className="text-slate-800">{selectedClaim.policyNumber} ({selectedClaim.providerName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Package Annual Limit:</span>
                <span className="text-slate-800">
                  {selectedClaim.annualLimit > 0
                    ? `Rs. ${Number(selectedClaim.annualLimit).toLocaleString()}`
                    : "Unlimited"}{" "}
                  ({selectedClaim.copaymentPercentage}% Copay)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Claimed Amount:</span>
                <span className="font-bold text-slate-900">
                  Rs. {Number(selectedClaim.claimAmount).toLocaleString()}
                </span>
              </div>
              {selectedClaim.remarks && (
                <div className="pt-1 border-t border-slate-200/60 text-slate-600">
                  <strong>Remarks:</strong> {selectedClaim.remarks}
                </div>
              )}
            </div>

            {modalMode === "APPROVE" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Approved Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={approvalAmount}
                    max={selectedClaim.claimAmount}
                    onChange={(e) => setApprovalAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Suggested after {selectedClaim.copaymentPercentage}% copay: Rs.{" "}
                    {Math.round(Number(selectedClaim.claimAmount) * ((100 - Number(selectedClaim.copaymentPercentage)) / 100)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Approval Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified hospital invoice and discharge summary."
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            {modalMode === "REJECT" && (
              <div className="text-xs space-y-2">
                <label className="block font-medium text-slate-700">Rejection Reason</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Services not covered under contracted insurance terms."
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            )}

            {modalMode === "VIEW" && (
              <div className="text-xs space-y-2 text-slate-600">
                {selectedClaim.settledAt && (
                  <div>
                    <strong>Settled Date:</strong> {new Date(selectedClaim.settledAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                size="sm"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => setModalMode(null)}
                className="h-8 text-xs"
              >
                Close
              </Button>

              {modalMode === "APPROVE" && (
                <Button
                  size="sm"
                  disabled={isSubmitting || approvalAmount <= 0}
                  onClick={handleApproveSubmit}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Confirm Approval
                </Button>
              )}

              {modalMode === "REJECT" && (
                <Button
                  size="sm"
                  disabled={isSubmitting || !adminRemarks.trim()}
                  onClick={handleRejectSubmit}
                  className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                  Confirm Rejection
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}