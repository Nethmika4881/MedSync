import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query("SELECT NOW() AS current_time, version();");

    return NextResponse.json({
      status: "success",
      message: "Database connection successful!",
      data: rows[0],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to database",
        error: message,
      },
      { status: 500 }
    );
  }
}
