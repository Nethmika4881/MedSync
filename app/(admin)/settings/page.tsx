"use client";

import React, { useState } from "react";
import { useAuthStore, useCurrentUser, useRole } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Bell, Lock, Monitor, CheckCircle2, HeartPulse, Shield, Clock, Plus, Trash2 } from "lucide-react";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";
import { roleConfig, UserRole } from "@/lib/mockData/users";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { branches } from "@/lib/mockData/branches";
import { DAYS_OF_WEEK, type DayOfWeek } from "@/lib/mockData/doctorSchedules";
import { useDoctorScheduleStore } from "@/lib/stores/doctorScheduleStore";

const NOTIFICATION_SETTINGS = [
  { id: "appt_confirm", label: "Appointment Confirmations", desc: "Receive alerts when appointments are confirmed or rescheduled.", defaultOn: true },
  { id: "appt_remind", label: "Appointment Reminders", desc: "Reminders 24h and 1h before your next appointment.", defaultOn: true },
  { id: "lab_results", label: "Lab & Test Results", desc: "Notify when new lab results are uploaded for your records.", defaultOn: true },
  { id: "billing_due", label: "Billing & Payment Alerts", desc: "Reminders for outstanding invoices and successful payments.", defaultOn: false },
  { id: "new_msg", label: "New Messages", desc: "In-app notification for every new message received.", defaultOn: true },
  { id: "prescriptions", label: "Prescription Ready", desc: "Alert when a dispensed prescription is ready for pickup.", defaultOn: false },
];

export default function SettingsPage() {
  const user = useCurrentUser();
  const role = useRole() as UserRole | null;
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_SETTINGS.map(n => [n.id, n.defaultOn]))
  );
  const [saved, setSaved] = useState(false);
  const { schedules, addSlot, updateSlot, removeSlot } = useDoctorScheduleStore();

  if (!user || !role) return null;
  const rConfig = roleConfig[role];
  const colorClass = getAvatarColor(user.name);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const mySchedule = schedules
    .filter((s) => s.doctorId === user.userId)
    .sort((a, b) => DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek));

  const handleAddSlot = () => {
    const defaultBranch = branches.find((b) => b.branchId === user.branchId) ?? branches[0];
    addSlot({
      doctorId: user.userId,
      branchId: defaultBranch.branchId,
      branchName: defaultBranch.name,
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "13:00",
      slotDurationMinutes: 30,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500">Manage your profile, notifications, and account preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Lock className="w-4 h-4 mr-2" /> Security
          </TabsTrigger>
          {role === "doctor" && (
            <TabsTrigger value="working-hours" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Clock className="w-4 h-4 mr-2" /> Working Hours
            </TabsTrigger>
          )}
          <TabsTrigger value="appearance" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Monitor className="w-4 h-4 mr-2" /> Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {/* Cover banner */}
            <div className="h-28 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10"
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
              <div className="absolute left-1/3 -bottom-4 w-16 h-16 bg-white/10"
                style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }} />
              <div className="absolute right-1/3 top-3 w-10 h-10 bg-white/10"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }} />
            </div>

            <CardContent className="px-8 pb-8 relative">
              {/* Big CSS shape avatar */}
              <div className="-mt-10 mb-6 flex items-end gap-5">
                <div
                  className={cn("w-20 h-20 flex items-center justify-center text-2xl font-black ring-4 ring-white shadow-lg", colorClass)}
                  style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
                  <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", rConfig.color)}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {rConfig.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input defaultValue={user.name} className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                  <input defaultValue={user.email || `${user.userId.toLowerCase()}@healthora.com`} className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Role</label>
                  <input value={rConfig.label} readOnly className="w-full h-10 px-4 rounded-xl border border-slate-100 text-sm bg-slate-50 text-slate-500 cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">User ID</label>
                  <input value={user.userId} readOnly className="w-full h-10 px-4 rounded-xl border border-slate-100 text-sm bg-slate-50 text-slate-400 cursor-not-allowed outline-none font-mono" />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Button onClick={handleSave} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-6">
                  {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</> : "Save Changes"}
                </Button>
                <Button variant="outline" className="rounded-xl h-10 px-6 text-slate-600">Discard</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">Notification Preferences</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Choose which notifications you would like to receive.</p>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100">
              {NOTIFICATION_SETTINGS.map(setting => (
                <div key={setting.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1 mr-8">
                    <p className="text-sm font-semibold text-slate-900">{setting.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{setting.desc}</p>
                  </div>
                  {/* Toggle Switch */}
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [setting.id]: !prev[setting.id] }))}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
                      notifications[setting.id] ? "bg-[var(--brand-primary)]" : "bg-slate-200"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                      notifications[setting.id] ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-6">
              {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</> : "Save Preferences"}
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--brand-primary)]" /> Password & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">New Password</label>
                  <input type="password" placeholder="Min. 8 characters" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
                  <input type="password" placeholder="Re-enter password" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-6">
                  {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Updated!</> : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-sm bg-red-50/50">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-red-900 mb-1">Danger Zone</h3>
              <p className="text-sm text-red-700 mb-4">These actions are irreversible. Please proceed with caution.</p>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 rounded-xl h-10 px-5">
                Deactivate Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Hours & Branch Allocation Tab (doctor only) */}
        {role === "doctor" && (
          <TabsContent value="working-hours" className="mt-6 space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Weekly Working Hours</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Recurring time slots you're available for consultations, per branch.</p>
                </div>
                <Button onClick={handleAddSlot} size="sm" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Slot
                </Button>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {mySchedule.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No working hours set yet. Click "Add Slot" to define your weekly availability.
                  </div>
                )}
                {mySchedule.map((slot) => (
                  <div key={slot.scheduleId} className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Day</label>
                      <Select value={slot.dayOfWeek} onValueChange={(v) => updateSlot(slot.scheduleId, { dayOfWeek: v as DayOfWeek })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Branch</label>
                      <Select
                        value={slot.branchId}
                        onValueChange={(v) => {
                          const b = branches.find((br) => br.branchId === v);
                          if (b) updateSlot(slot.scheduleId, { branchId: b.branchId, branchName: b.name });
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b.branchId} value={b.branchId}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Start</label>
                      <Input type="time" value={slot.startTime} onChange={(e) => updateSlot(slot.scheduleId, { startTime: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">End</label>
                      <Input type="time" value={slot.endTime} onChange={(e) => updateSlot(slot.scheduleId, { endTime: e.target.value })} />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Slot (min)</label>
                        <Input
                          type="number"
                          min={5}
                          step={5}
                          value={slot.slotDurationMinutes}
                          onChange={(e) => updateSlot(slot.scheduleId, { slotDurationMinutes: Number(e.target.value) })}
                        />
                      </div>
                      <button
                        onClick={() => removeSlot(slot.scheduleId)}
                        className="h-9 w-9 shrink-0 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-6">
                {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</> : "Save Working Hours"}
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">Theme & Display</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Color Mode</p>
                <div className="grid grid-cols-3 gap-3">
                  {["Light", "Dark", "System"].map(mode => (
                    <button key={mode} className={cn(
                      "p-4 rounded-xl border-2 text-sm font-semibold transition-all",
                      mode === "Light"
                        ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-blue-50"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                    )}>
                      {mode}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Dark mode coming soon. Only Light is fully supported.</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Sidebar Density</p>
                <div className="grid grid-cols-2 gap-3">
                  {["Compact", "Comfortable"].map(density => (
                    <button key={density} className={cn(
                      "p-4 rounded-xl border-2 text-sm font-semibold transition-all",
                      density === "Comfortable"
                        ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-blue-50"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                    )}>
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
