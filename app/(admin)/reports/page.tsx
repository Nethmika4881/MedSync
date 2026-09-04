"use client";

import React from "react";
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { revenueByMonth, appointmentsByMonth } from "@/lib/mockData";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

export default function ReportsPage() {
  const role = useRole();

  if (!role || (role !== "admin" && role !== "branch_manager")) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        You do not have permission to view reports.
      </div>
    );
  }

  // Mock data for demographics pie chart
  const demographicsData = [
    { name: 'Under 18', value: 15 },
    { name: '18-35', value: 35 },
    { name: '36-50', value: 25 },
    { name: '51-65', value: 15 },
    { name: '65+', value: 10 },
  ];
  const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h2>
          <p className="text-slate-500">Comprehensive overview of clinic performance and demographics.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 font-medium text-sm">Total Revenue (YTD)</p>
                <h3 className="text-3xl font-bold mt-1">$485,200</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-blue-100">
              <TrendingUp className="w-4 h-4 mr-1 text-green-300" />
              <span className="text-green-300">+12.5%</span><span className="ml-2">vs last year</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm">Total Patients</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">8,405</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              <span className="text-green-600">+4.2%</span><span className="ml-2">this month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm">Appointments (YTD)</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">12,450</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
              <span className="text-slate-900 font-bold mr-1">84%</span> Completion Rate
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm">Avg. Wait Time</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">14m</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-slate-500">
              <TrendingUp className="w-4 h-4 mr-1 text-green-500 rotate-180" />
              <span className="text-green-600">-2m</span><span className="ml-2">improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Revenue Growth vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Patient Demographics</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={demographicsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full flex flex-wrap justify-center gap-3 mt-4">
              {demographicsData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Appointment Trends by Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="completed" name="Completed" stackId="a" fill="#16A085" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
