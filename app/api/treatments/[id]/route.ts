import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const PUT: (request: NextRequest, context: { params: Promise<{ id: string; }>; }) => void | Response | Promise<void | Response> = async (request, { params }) => {
    try {
        const body = await request.json();
        const {id} = await params;
        const { category, treatment_name, base_price, duration, description, is_usable, is_active } = body;

        const result = await db.query(`
            UPDATE treatment_catalogue
            SET category = $1, treatment_name = $2, base_price = $3, duration = $4, description = $5, is_usable = $6, is_active = $7,
            WHERE treatment_service_code = $8
            RETURNING *`,
            [category, treatment_name, base_price, duration, description, is_usable, is_active, id]
        );

        if(result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json(result.rows[0]);
    }catch (error) {
        return NextResponse.json({ error: "Failed to update treatment" }, { status: 500 });
    }
}

export const DELETE: (request: NextRequest, context: { params: Promise<{ id: string; }>; }) => void | Response | Promise<void | Response> = async (request, { params }) => {
    try {
        const { id } = await params;
        await db.query(`
            UPDATE treatment_catalogue SET is_active = false, updated_at = NOW() WHERE treatment_service_code = $1`,
            [id]
        );

        return NextResponse.json({ success: true });
    }catch (error) {
        return NextResponse.json({ error: "Failed to delete treatment" }, { status: 500 });
    }
}