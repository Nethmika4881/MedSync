import { ZodError } from "zod";

export function toActionError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid input";
  }
  if (error instanceof Error && error.message.startsWith("Unauthorized")) {
    return "Please sign in again as a doctor.";
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "P0001" && error instanceof Error) {
    return error.message;
  }
  console.error("[doctor portal] action failed:", error);
  return "Something went wrong. Please try again.";
}
