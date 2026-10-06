import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireDoctor } from "@/lib/server/doctorAuth";
import { toActionError } from "@/lib/server/actionError";
import type { AuthUser } from "@/lib/types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const notFound = (what: string) => new ApiError(404, `${what} not found`);

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
}

export async function doctorRoute(handler: (doctor: AuthUser) => Promise<unknown>): Promise<NextResponse> {
  try {
    const doctor = await requireDoctor();
    const data = await handler(doctor);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ ok: false, error: "Doctor sign-in required" }, { status: 401 });
    }
    const code = (error as { code?: string } | null)?.code;
    const status = error instanceof ZodError ? 400 : code === "P0001" ? 409 : 500;
    return NextResponse.json({ ok: false, error: toActionError(error) }, { status });
  }
}
