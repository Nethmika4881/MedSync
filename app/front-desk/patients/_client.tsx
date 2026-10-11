"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Phone, Mail, Activity, ArrowRight, Users, MapPin, Loader2 } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { EmptyState } from "@/components/catms/EmptyState";
import { getBranchPatients, type FrontDeskPatientSummary } from "@/lib/actions/frontdesk-patients";

export default function PatientsClientPage({
    initialPatients = [],
    branchId,
}: {
    initialPatients: FrontDeskPatientSummary[];
    branchId?: string;
}) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [patients, setPatients] = useState<FrontDeskPatientSummary[]>(initialPatients);
    const [isSearching, startTransition] = useTransition();

    // Live debounced server search
    useEffect(() => {
        const handler = setTimeout(() => {
            startTransition(async () => {
                const results = await getBranchPatients(branchId, searchTerm);
                setPatients(results);
            });
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm, branchId]);

    const getAge = (dobString: string) => {
        if (!dobString) return "--";
        const birthYear = new Date(dobString).getFullYear();
        const currentYear = new Date().getFullYear();
        return Math.max(0, currentYear - birthYear);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-outfit text-slate-900 tracking-tight">Patient Directory</h2>
                    <p className="text-slate-500 text-sm">Search and manage registered clinic patients.</p>
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
                    <div className="relative group w-full sm:w-72">
                        {isSearching ? (
                            <Loader2 className="w-4 h-4 text-[var(--brand-primary)] absolute left-3 top-1/2 -translate-y-1/2 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        )}
                        <input
                            type="text"
                            placeholder="Search by name, NIC, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white shadow-sm"
                        />
                    </div>
                    <Button
                        onClick={() => router.push("/front-desk/patients/new")}
                        className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-10 px-4 shrink-0 shadow-sm font-semibold text-xs"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        New Patient
                    </Button>
                </div>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map((patient) => (
                    <Card
                        key={patient.patientId}
                        className="border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer rounded-2xl overflow-hidden hover:border-slate-300"
                        onClick={() => router.push(`/front-desk/patients/${patient.patientId}`)}
                    >
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <AvatarWithName
                                    name={patient.fullName}
                                    subtitle={`NIC: ${patient.nic}`}
                                    avatarSrc={patient.fullName.slice(0, 2).toUpperCase()}
                                    size="lg"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 group-hover:text-[var(--brand-primary)] hover:bg-teal-50 transition-colors rounded-xl"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/front-desk/patients/${patient.patientId}`);
                                    }}
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-slate-600">
                                    <Phone className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                                    <span>{patient.phone || "No phone registered"}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Mail className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{patient.email || "No email on file"}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Activity className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                                    <span>
                                        {getAge(patient.dob)} yrs • {patient.gender} • Blood:{" "}
                                        <strong className="font-semibold text-slate-900">{patient.bloodGroup || "O+"}</strong>
                                    </span>
                                </div>
                                {patient.city && (
                                    <div className="flex items-center text-sm text-slate-500">
                                        <MapPin className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                                        <span>{patient.city}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span>Emergency: {patient.emergencyContactName || "Not listed"}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 font-medium">
                                    Active
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {patients.length === 0 && (
                <Card className="border-slate-200 shadow-sm rounded-2xl">
                    <EmptyState
                        icon={Users}
                        title="No patients found"
                        description="No registered patients match your search criteria. Try a different query or register a new patient."
                    />
                </Card>
            )}
        </div>
    );
}
