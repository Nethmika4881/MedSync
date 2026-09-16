import { SessionType } from "./appointments";

export interface SessionConfig {
  doctorId: string;
  session: SessionType;
  maxTickets: number;   // admin-controlled ticket capacity per session
  isEnabled: boolean;   // admin can disable a session entirely for a doctor
}

const SESSIONS: SessionType[] = ["Morning", "Midday", "Afternoon", "Evening"];
const DOCTOR_IDS = [
  "DOC-001", "DOC-002", "DOC-003", "DOC-004", "DOC-005", "DOC-006",
  "DOC-007", "DOC-008", "DOC-009", "DOC-010", "DOC-011", "DOC-012",
  "DOC-013", "DOC-014", "DOC-015", "DOC-016", "DOC-017", "DOC-018",
];

/** Default: 12 tickets per session, all enabled */
export const sessionConfigs: SessionConfig[] = DOCTOR_IDS.flatMap((doctorId) =>
  SESSIONS.map((session) => ({
    doctorId,
    session,
    maxTickets: 12,
    isEnabled: true,
  }))
);
