"use client";

import React, { useState } from "react";
import { usePatientStore } from "@/lib/stores/patientStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, FileText, Phone, Mail, Activity, ArrowRight, Users } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { EmptyState } from "@/components/catms/EmptyState";
import { ContraindicationRowBadge } from "@/components/catms/ContraindicationBanner";

export default function PatientsPage() {
  const { patients, allergies, conditions } = usePatientStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h2>
          <p className="text-slate-500">View and manage all registered patients.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white"
            />
          </div>
          <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-4">
            <UserPlus className="w-4 h-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => {
          const patientAllergies = allergies.filter(a => a.patientId === patient.patientId);
          const severeAllergy = patientAllergies.find(a => a.severity === "Severe" || a.severity === "Life-threatening");
          const activeConditions = conditions.filter(c => c.patientId === patient.patientId && c.status === "Active");

          return (
            <Card key={patient.patientId} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <AvatarWithName name={patient.name} subtitle={patient.patientId} avatarSrc={patient.avatar} size="lg" />
                  <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-[var(--brand-primary)] transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Activity className="w-4 h-4 mr-2 text-slate-400" />
                    {patient.age} yrs • {patient.gender} • Blood: <span className="font-semibold text-slate-900 ml-1">{patient.bloodGroup}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 min-h-[60px]">
                  {severeAllergy && (
                    <ContraindicationRowBadge patientName={patient.name} allergyName={severeAllergy.allergenName} />
                  )}
                  {activeConditions.length > 0 && !severeAllergy && (
                    <div className="text-xs text-slate-500 font-medium">
                      Active: {activeConditions.map(c => c.conditionName).join(", ")}
                    </div>
                  )}
                  {activeConditions.length === 0 && !severeAllergy && (
                    <div className="text-xs text-slate-400 italic">No severe allergies or active conditions on file.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredPatients.length === 0 && (
        <Card className="border-slate-200 shadow-sm">
          <EmptyState icon={Users} title="No patients found" description="Try adjusting your search criteria." />
        </Card>
      )}
    </div>
  );
}
