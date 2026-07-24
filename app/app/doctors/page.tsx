"use client";

import React, { useState } from "react";
import { useRole } from "@/lib/stores/authStore";
import { doctors, Doctor } from "@/lib/mockData/doctors";
import { branches } from "@/lib/mockData/branches";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Calendar, Clock, Star } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { Button } from "@/components/ui/button";

export default function DoctorsPage() {
  const role = useRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");

  if (!role) return null;

  const specialties: string[] = ["All", ...Array.from(new Set(doctors.map((d: Doctor) => d.specialization)))];

  const filteredDoctors = doctors.filter((d: Doctor) => 
    (selectedSpecialty === "All" || d.specialization === selectedSpecialty) &&
    (d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Directory</h2>
          <p className="text-slate-500">Find and schedule appointments with our specialists.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search doctors by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white shadow-sm"
          />
        </div>
        <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2 md:pb-0">
          {specialties.map((spec: string) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedSpecialty === spec ? 'bg-[var(--brand-primary)] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor: Doctor) => {
          const branch = branches.find(b => b.branchId === doctor.branchId);
          return (
            <Card key={doctor.doctorId} className="border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-50 relative">
                <div className="absolute -bottom-8 left-6">
                  <div className="p-1.5 bg-white rounded-2xl shadow-sm">
                    {/* Using our custom avatar shape without images */}
                    <div className="w-16 h-16 bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl avatar-shape shadow-inner">
                      {doctor.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {doctor.rating}
                </div>
              </div>
              <CardContent className="pt-12 pb-6 px-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Dr. {doctor.name}
                  </h3>
                  <p className="text-[var(--brand-primary)] font-semibold text-sm">{doctor.specialization}</p>
                </div>

                <div className="space-y-2.5 mb-6">
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{branch?.name || "Main Clinic"}<br/><span className="text-xs text-slate-400">{branch?.address}</span></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    {doctor.experience} Years Experience
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    Avg. Wait Time: 15 mins
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-sm">
                    <span className="text-slate-500">Consultation Fee</span><br/>
                    <span className="font-bold text-slate-900">${doctor.consultationFee}</span>
                  </div>
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                    Book Visit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
