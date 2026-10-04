import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            time_slot_id,
            patient_id,
            created_by,
            source = "Booked",
            reason_for_visit = ""
        } = body;

        if (!time_slot_id || !patient_id || !created_by) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const query = `
            SELECT * FROM book_appointment(
                $1::UUID, 
                $2::UUID, 
                $3::UUID, 
                $4::appointment_source_enum, 
                $5::VARCHAR
            );
        `;

        const values = [time_slot_id, patient_id, created_by, source, reason_for_visit];
        const result = await db.query(query, values);

        return NextResponse.json({
            success: true,
            message: "Appointment succeessfully booked",
            data: result.rows[0],
        }, { status: 201 });

    }catch (error: any) {
        console.error("Booking error:", error);

        if(error.message.includes('Time Slot not found')) {
            return NextResponse.json({ error: "Selected time slot does not exist." }, { status: 404});
        }
        if(error.message.includes('Time Slot is full')) {
            return NextResponse.json({ error: "Sorry, this time slot is fully bokked."}, { status: 409 });
        }

        return NextResponse.json({error: "An unexpected error"}, { status: 500});
    }
}