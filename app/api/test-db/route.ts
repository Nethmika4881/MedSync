import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT NOW() as current_time, version();`;

        return NextResponse.json({
            status: "success",
            message: "Database connection successful!",
            data: result[0],
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                status: "error",
                message: "Failed to connect to database",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
