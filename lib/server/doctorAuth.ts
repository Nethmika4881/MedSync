import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import type { AuthUser } from "@/lib/types";

export async function requireDoctor(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor") {
    throw new Error("Unauthorized: doctor access only");
  }
  return user;
}

export function clinicToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}
