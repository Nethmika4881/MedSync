"use client";
import { create } from "zustand";
import { sessionConfigs, type SessionConfig } from "@/lib/mockData/sessionConfig";
import type { SessionType } from "@/lib/mockData/appointments";

interface SessionConfigStore {
  configs: SessionConfig[];
  /** Get the config for a specific doctor × session. Returns undefined if not found. */
  getConfig: (doctorId: string, session: SessionType) => SessionConfig | undefined;
  /** Admin: update the max ticket capacity */
  updateConfig: (doctorId: string, session: SessionType, maxTickets: number) => void;
  /** Admin: toggle a session on/off for a doctor */
  toggleSession: (doctorId: string, session: SessionType, enabled: boolean) => void;
}

export const useSessionConfigStore = create<SessionConfigStore>((set, get) => ({
  configs: sessionConfigs,

  getConfig: (doctorId, session) =>
    get().configs.find((c) => c.doctorId === doctorId && c.session === session),

  updateConfig: (doctorId, session, maxTickets) =>
    set((state) => ({
      configs: state.configs.map((c) =>
        c.doctorId === doctorId && c.session === session
          ? { ...c, maxTickets }
          : c
      ),
    })),

  toggleSession: (doctorId, session, enabled) =>
    set((state) => ({
      configs: state.configs.map((c) =>
        c.doctorId === doctorId && c.session === session
          ? { ...c, isEnabled: enabled }
          : c
      ),
    })),
}));
