import type { DayOfWeek } from "@/lib/types";

const DB_DAYS: DayOfWeek[] = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export const dbDayToUi = (n: number): DayOfWeek => {
  const day = DB_DAYS[n];
  if (!day) throw new Error(`Invalid day_of_week: ${n}`);
  return day;
};

export const uiDayToDb = (day: DayOfWeek): number => DB_DAYS.indexOf(day);

export const dbTimeToUi = (t: string): string => t.slice(0, 5);
