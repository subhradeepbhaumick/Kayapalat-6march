import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { attendanceId, location } = await req.json();

        await executeQuery(
            `
            UPDATE kp_emp_attendance
            SET
                ta_entry = NOW(),
                ta_location = ?
            WHERE id = ?
            `,
            [location, attendanceId]
        );

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to save TA entry",
            },
            { status: 500 }
        );
    }
}