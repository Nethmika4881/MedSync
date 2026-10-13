"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Lock,
  Monitor,
  CheckCircle2,
  Shield,
  Clock,
  Plus,
  Trash2,
  Bell,
} from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { branches, DAYS_OF_WEEK, DayOfWeek } from "@/lib/constants";
import { useDoctorScheduleStore } from "@/lib/stores/doctorScheduleStore";
import {
  updateProfile,
  updatePassword,
  type AdminProfileData,
} from "@/lib/actions/admin-settings";

export type AdminNotificationCategory = {
  category: string;
  items: {
    id: string;
    label: string;
    desc: string;
    defaultOn: boolean;
  }[];
};

const ADMIN_NOTIFICATION_SECTIONS: AdminNotificationCategory[] = [
  {
    category: "Security & Governance",
    items: [
      {
        id: "sec_failed_logins",
        label: "Suspicious Login & Lockouts",
        desc: "Immediate alert when repeated failed logins or account lockouts occur.",
        defaultOn: true,
      },
      {
        id: "sec_role_change",
        label: "Privilege Escalation Alerts",
        desc: "Notify when an employee account is assigned Admin or Clinical privileges.",
        defaultOn: true,
      },
      {
        id: "sec_audit_config",
        label: "Hospital Rule Modifications",
        desc: "Notify when operational thresholds or branch parameters are updated.",
        defaultOn: false,
      },
    ],
  },
  {
    category: "Financial & Billing Audits",
    items: [
      {
        id: "fin_void_refund",
        label: "Invoice Voids & Refunds",
        desc: "Alert whenever a settled invoice is cancelled or a refund is recorded.",
        defaultOn: true,
      },
      {
        id: "fin_overdue_debtor",
        label: "Severe Outstanding Debts",
        desc: "Alert when patient unpaid balances exceed the 30-day grace period.",
        defaultOn: true,
      },
      {
        id: "fin_daily_close",
        label: "Daily Settlement Digest",
        desc: "Receive an automated summary of daily collections per branch at 11:59 PM.",
        defaultOn: false,
      },
    ],
  },
  {
    category: "Clinical Operations & Staffing",
    items: [
      {
        id: "ops_session_cancel",
        label: "Doctor Session Cancellations",
        desc: "Urgent alert if a scheduled session with booked patients is cancelled.",
        defaultOn: true,
      },
      {
        id: "ops_queue_overflow",
        label: "Branch Queue Overflow",
        desc: "Alert when walk-in tickets or emergency queue caps reach 100% at any branch.",
        defaultOn: true,
      },
    ],
  },
];

export default function SettingsPage({
  user,
  initialProfile,
}: {
  user: AuthUser;
  initialProfile?: AdminProfileData | null;
}) {
  const role = user?.role;
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState("profile");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // ─── 1. Profile State ────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(
    initialProfile?.fullName || user?.name || "",
  );
  const [email, setEmail] = useState(
    initialProfile?.email || user?.email || "",
  );
  const [gender, setGender] = useState(initialProfile?.gender || "Male");
  const [phoneNumber, setPhoneNumber] = useState(
    initialProfile?.phoneNumber || "",
  );
  const [addressLine1, setAddressLine1] = useState(
    initialProfile?.addressLine1 || "",
  );
  const [addressLine2, setAddressLine2] = useState(
    initialProfile?.addressLine2 || "",
  );
  const [city, setCity] = useState(initialProfile?.city || "");
  const [province, setProvince] = useState(initialProfile?.province || "");
  const [postalCode, setPostalCode] = useState(
    initialProfile?.postalCode || "",
  );

  // ─── 2. Password State ───────────────────────────────────────────────────
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // ─── 3. Notifications State (Default Setup) ──────────────────────────────
  const [notifications, setNotifications] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ADMIN_NOTIFICATION_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => {
        initial[item.id] = item.defaultOn;
      });
    });
    return initial;
  });

  // ─── 4. Appearance State ─────────────────────────────────────────────────
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [, setDensity] = useState<"compact" | "comfortable">(
    "comfortable",
  );

  // ─── Doctor Working Hours Store ──────────────────────────────────────────
  const { schedules, addSlot, updateSlot, removeSlot } =
    useDoctorScheduleStore();

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Sync Appearance & Notifications from localStorage on initial render
  useEffect(() => {
    // A. Theme & Layout
    const savedTheme =
      (localStorage.getItem("medsync_theme") as
        | "light"
        | "dark"
        | "system") || "light";
    const savedDensity =
      (localStorage.getItem("medsync_density") as
        | "compact"
        | "comfortable") || "comfortable";

    setTheme(savedTheme);
    setDensity(savedDensity);
    applyTheme(savedTheme);

    // B. Notifications
    const savedNotifications = localStorage.getItem("medsync_admin_notifications");
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        // Fallback silently if corrupt
      }
    }
  }, []);

  const applyTheme = (selectedTheme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (
      selectedTheme === "dark" ||
      (selectedTheme === "system" && systemPrefersDark)
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem(
      "medsync_admin_notifications",
      JSON.stringify(notifications),
    );
    showFeedback("Notification preferences saved.");
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("medsync_theme", newTheme);
    applyTheme(newTheme);
    showFeedback(`Theme changed to ${newTheme}`);
  };

  // const handleDensityChange = (newDensity: "compact" | "comfortable") => {
  //   setDensity(newDensity);
  //   localStorage.setItem("medsync_density", newDensity);
  //   window.dispatchEvent(new Event("medsync_density_change"));
  //   showFeedback(`Sidebar density set to ${newDensity}`);
  // };

  // ─── Submit Handlers ─────────────────────────────────────────────────────
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await updateProfile({
          fullName,
          email,
          gender,
          phoneNumber,
          addressLine1,
          addressLine2,
          city,
          province,
          postalCode,
        });
        showFeedback(res.message);
      } catch (err: any) {
        showFeedback(err.message || "Failed to update profile details.");
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass !== confirmPass) {
      showFeedback("Passwords do not match.");
      return;
    }
    if (newPass.length < 8) {
      showFeedback("Password must be at least 8 characters long.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updatePassword({ currentPass, newPass });
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
        showFeedback(res.message);
      } catch (err: any) {
        showFeedback(err.message || "Failed to change password.");
      }
    });
  };

  // Doctor Schedules List
  const mySchedule = schedules
    .filter((s) => s.doctorId === user?.userId)
    .sort(
      (a, b) =>
        DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek),
    );

  const handleAddSlot = () => {
    const defaultBranch =
      branches.find((b) => b.branchId === user?.branchId) ?? branches[0];
    addSlot({
      doctorId: user?.userId,
      branchId: defaultBranch.branchId,
      branchName: defaultBranch.name,
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "13:00",
      slotDurationMinutes: 30,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-16">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Settings
          </h2>
          <p className="text-slate-500 text-sm">
            Manage profile, notification and account preferences.
          </p>
        </div>

        {statusMessage && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {statusMessage}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
        <TabsList className="bg-slate-100/70 p-1 rounded-xl flex flex-wrap gap-1 h-auto">
          <TabsTrigger
            value="profile"
            className="rounded-lg px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <User className="w-3.5 h-3.5 mr-2 mx-auto" /> Profile
          </TabsTrigger>

          {/* <TabsTrigger
            value="notifications"
            className="rounded-lg px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <Bell className="w-3.5 h-3.5 mr-2 mx-auto" /> Notifications
          </TabsTrigger> */}

          <TabsTrigger
            value="security"
            className="rounded-lg px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <Lock className="w-3.5 h-3.5 mr-2 mx-auto" /> Security
          </TabsTrigger>

          {role === "doctor" && (
            <TabsTrigger
              value="working-hours"
              className="rounded-lg px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
            >
              <Clock className="w-3.5 h-3.5 mr-2 mx-auto" /> Working Hours
            </TabsTrigger>
          )}

          <TabsTrigger
            value="appearance"
            className="rounded-lg px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <Monitor className="w-3.5 h-3.5 mr-2 mx-auto" /> Appearance
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="mt-6 space-y-6 mx-auto *:max-w-4xl">
          <form onSubmit={handleProfileSubmit}>
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="h-28 bg-gradient-to-r from-teal-700 via-teal-600 to-slate-800 relative" />

              <CardContent className="px-6 md:px-8 pb-8 relative space-y-8">
                {/* Avatar Banner Header */}
                <div className="-mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black ring-4 ring-white shadow-lg bg-teal-600 text-white">
                      {getInitials(fullName)}
                    </div>
                    <div className="mb-1">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {fullName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                          {initialProfile?.role?.toUpperCase() || role?.toUpperCase() || "ADMIN"}
                        </span>
                        {initialProfile?.lastLogin && (
                          <span className="text-[11px] text-slate-400">
                            Last session: {initialProfile.lastLogin}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-9 px-5 text-xs font-semibold"
                    >
                      {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>

                {/* Section A: Personal Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Personal Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Full Name
                      </label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section B: Contact & Residential Address */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Contact & Residential Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Primary Mobile Number
                      </label>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+94 7X XXX XXXX"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Address Line 1
                      </label>
                      <Input
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Street address or P.O. Box"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Address Line 2 (Optional)
                      </label>
                      <Input
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Suite, unit, or floor"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        City
                      </label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Province
                      </label>
                      <Input
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="e.g. Western Province"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Postal Code
                      </label>
                      <Input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Read-Only System Identity */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    System & Legal Records (Read-Only)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        NIC / Identification
                      </label>
                      <Input
                        value={initialProfile?.nic || "—"}
                        readOnly
                        className="h-9 text-xs bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Date of Birth
                      </label>
                      <Input
                        value={initialProfile?.dob || "—"}
                        readOnly
                        className="h-9 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Account Created
                      </label>
                      <Input
                        value={initialProfile?.createdAt || "—"}
                        readOnly
                        className="h-9 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* ─── 2. NOTIFICATIONS TAB ───────────────────────────────────────── */}
        {/* <TabsContent value="notifications" className="mt-6 space-y-6">
          {ADMIN_NOTIFICATION_SECTIONS.map((section) => (
            <Card
              key={section.category}
              className="border-slate-200 shadow-sm overflow-hidden"
            >
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6">
                <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {section.items.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex-1 mr-8">
                      <p className="text-sm font-semibold text-slate-900">
                        {setting.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {setting.desc}
                      </p>
                    </div> */}
                    {/* Toggle Switch */}
                    {/* <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [setting.id]: !prev[setting.id],
                        }))
                      }
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
                        notifications[setting.id]
                          ? "bg-teal-600"
                          : "bg-slate-200",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                          notifications[setting.id]
                            ? "translate-x-5"
                            : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleSaveNotifications}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-6 text-xs font-semibold"
            >
              Save Preferences
            </Button>
          </div>
        </TabsContent> */}

        {/* ─── 3. SECURITY TAB ────────────────────────────────────────────── */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <form onSubmit={handlePasswordSubmit}>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" /> Password & Security
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Update your account password to maintain security.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Min. 8 characters"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-6 text-xs font-semibold"
                  >
                    {isPending ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          <Card className="border-red-100 shadow-sm bg-red-50/40">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-red-900 mb-1">
                Danger Zone
              </h3>
              <p className="text-xs text-red-700 mb-4">
                Actions here impact account authorization and system records.
              </p>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100 rounded-xl h-9 px-5 text-xs font-semibold"
              >
                Deactivate Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 4. WORKING HOURS (Doctors Only) ────────────────────────────── */}
        {role === "doctor" && (
          <TabsContent value="working-hours" className="mt-6 space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Weekly Working Hours
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Recurring time slots you are available for consultations, per branch.
                  </p>
                </div>
                <Button
                  onClick={handleAddSlot}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Slot
                </Button>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {mySchedule.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No working hours set yet. Click &quot;Add Slot&quot; to define your weekly availability.
                  </div>
                )}
                {mySchedule.map((slot) => (
                  <div
                    key={slot.scheduleId}
                    className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end"
                  >
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Day
                      </label>
                      <Select
                        value={slot.dayOfWeek}
                        onValueChange={(v) =>
                          updateSlot(slot.scheduleId, {
                            dayOfWeek: v as DayOfWeek,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Branch
                      </label>
                      <Select
                        value={slot.branchId}
                        onValueChange={(v) => {
                          const b = branches.find((br) => br.branchId === v);
                          if (b)
                            updateSlot(slot.scheduleId, {
                              branchId: b.branchId,
                              branchName: b.name,
                            });
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b.branchId} value={b.branchId}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Start
                      </label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(slot.scheduleId, {
                            startTime: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        End
                      </label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSlot(slot.scheduleId, {
                            endTime: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                          Slot (min)
                        </label>
                        <Input
                          type="number"
                          min={5}
                          step={5}
                          value={slot.slotDurationMinutes}
                          onChange={(e) =>
                            updateSlot(slot.scheduleId, {
                              slotDurationMinutes: Number(e.target.value),
                            })
                          }
                          className="h-9 text-xs"
                        />
                      </div>
                      <button
                        type="button"
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
              <Button
                onClick={() => showFeedback("Working hours schedule saved.")}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-6 text-xs font-semibold"
              >
                Save Working Hours
              </Button>
            </div>
          </TabsContent>
        )}

        {/* ─── 5. APPEARANCE TAB ──────────────────────────────────────────── */}
        <TabsContent value="appearance" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-teal-600" /> Theme & Layout Settings
              </CardTitle>
              <p className="text-xs text-slate-500">
                Personalize the visual appearance and density of your workstation.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                  Interface Theme
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleThemeChange(mode)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-xs font-semibold capitalize transition-all text-center",
                        theme === mode
                          ? "border-teal-600 text-teal-700 bg-teal-50/50 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white",
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
{/* 
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                  Sidebar Density
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["compact", "comfortable"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDensityChange(d)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-xs font-semibold capitalize transition-all text-center",
                        density === d
                          ? "border-teal-600 text-teal-700 bg-teal-50/50 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
