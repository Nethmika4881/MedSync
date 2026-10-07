import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const result = await db.query(`
            SELECT * FROM treatment_catalogue ORDER BY created_at DESC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("GET Error fetching treatments:", error);
        return NextResponse.json({ error: "Failed to fetch treatments" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { category, treatment_name, base_price, duration, description, is_insurable } = body;
    
        const result = await db.query(`
            INSERT INTO treatment_catalogue 
                (category, treatment_name, base_price, duration, description, is_insurable)
            VALUES 
                ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [category, treatment_name, base_price, duration, description, is_insurable ?? true]
        );
        
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("POST Error creating treatment:", error);
        console.error("POST Error:", error);
        return NextResponse.json({ error: "Failed to create treatment" }, { status: 500 });
    }
}