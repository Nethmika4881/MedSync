"use client";

import React, { useState } from "react";
import { useDoctorScheduleStore } from "@/lib/stores/doctorScheduleStore";
import { DAYS_OF_WEEK, type DayOfWeek } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/catms/EmptyState";
import { Clock, Plus, Trash2, MapPin, CalendarClock, Pencil, AlertCircle } from "lucide-react";
import type { DoctorScheduleSlot } from "@/lib/types";

const BRANCH_OPTIONS = [
  { branchId: "BR-001", branchName: "Colombo" },
  { branchId: "BR-002", branchName: "Kandy" },
  { branchId: "BR-003", branchName: "Galle" },
];

export default function DoctorWorkingHoursPage({ user }: { user: any }) {
  const { schedules, addSlot, updateSlot, removeSlot } = useDoctorScheduleStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("Monday");
  const [branchId, setBranchId] = useState(BRANCH_OPTIONS[0].branchId);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(15);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!user) return null;

  const mySlots = schedules.filter((s) => s.doctorId === user.userId);

  function openAddDialog() {
    setEditingId(null);
    setDayOfWeek("Monday");
    setBranchId(BRANCH_OPTIONS[0].branchId);
    setStartTime("09:00");
    setEndTime("17:00");
    setSlotDuration(15);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(slot: DoctorScheduleSlot) {
    setEditingId(slot.scheduleId);
    setDayOfWeek(slot.dayOfWeek);
    setBranchId(slot.branchId);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setSlotDuration(slot.slotDurationMinutes);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSaveSlot() {
    if (!user) return;

    if (startTime >= endTime) {
      setFormError("End time must be after start time.");
      return;
    }

    // A doctor can't be in two places at once, so check every branch.
    const overlap = mySlots.some(
      (s) =>
        s.scheduleId !== editingId &&
        s.dayOfWeek === dayOfWeek &&
        startTime < s.endTime &&
        endTime > s.startTime
    );
    if (overlap) {
      setFormError("This overlaps with an existing slot on that day (any branch).");
      return;
    }

    const branch = BRANCH_OPTIONS.find((b) => b.branchId === branchId)!;
    const slot = {
      doctorId: user.userId,
      branchId: branch.branchId,
      branchName: branch.branchName,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes: slotDuration,
    };

    if (editingId) {
      updateSlot(editingId, slot);
    } else {
      addSlot(slot);
    }
    setDialogOpen(false);
  }

  // group slots by day for display, earliest first
  const slotsByDay: Record<DayOfWeek, typeof mySlots> = DAYS_OF_WEEK.reduce(
    (acc, day) => ({
      ...acc,
      [day]: mySlots
        .filter((s) => s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }),
    {} as Record<DayOfWeek, typeof mySlots>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Working Hours &amp; Branch Allocation
          </h2>
          <p className="text-slate-500">
            Set your recurring weekly availability per branch. This drives the time slots
            patients can book.
          </p>
        </div>

        <Button
          onClick={openAddDialog}
          className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Working Hours
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Working Hours Slot" : "Add Working Hours Slot"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="day">Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={(v) => setDayOfWeek(v as DayOfWeek)}>
                  <SelectTrigger id="day" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger id="branch" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCH_OPTIONS.map((b) => (
                      <SelectItem key={b.branchId} value={b.branchId}>
                        {b.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="start">Start Time</Label>
                  <Input
                    id="start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Time</Label>
                  <Input
                    id="end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Slot Duration (minutes)</Label>
                <Select
                  value={String(slotDuration)}
                  onValueChange={(v) => setSlotDuration(Number(v))}
                >
                  <SelectTrigger id="duration" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 15, 20, 30, 45, 60].map((mins) => (
                      <SelectItem key={mins} value={String(mins)}>
                        {mins} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formError && (
                <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button onClick={handleSaveSlot} className="rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
                Save Slot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {mySlots.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <EmptyState
            icon={CalendarClock}
            title="No working hours set yet"
            description="Add your first weekly availability slot to start appearing in patient bookings."
            className="py-16"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {DAYS_OF_WEEK.filter((day) => slotsByDay[day].length > 0).map((day) => (
            <Card key={day} className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {slotsByDay[day].map((slot) => (
                    <div
                      key={slot.scheduleId}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-slate-900">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          <MapPin className="w-3 h-3" /> {slot.branchName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {slot.slotDurationMinutes}-min slots
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-[var(--brand-primary)] hover:bg-blue-50 rounded-lg"
                          onClick={() => openEditDialog(slot)}
                          title="Edit slot"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={() => {
                            if (confirm(`Remove ${slot.dayOfWeek} ${slot.startTime}–${slot.endTime} at ${slot.branchName}?`)) {
                              removeSlot(slot.scheduleId);
                            }
                          }}
                          title="Remove slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}