import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }
        const users = await executeQuery(
            `
            SELECT
                user_id,
                name,
                email,
                phone
            FROM users_kp_db
            WHERE user_id = ?
            LIMIT 1
            `,
            [session.user.id]
        );
        if (!users || (users as any[]).length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User not found",
                },
                { status: 404 }
            );
        }
        return NextResponse.json({
            success: true,
            data: (users as any[])[0],
        });
    } catch (error) {
        console.error("Property Visit User Details Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}
/* POST */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }
        const body = await req.json();
        const {
            client_id,
            client_name,
            phone,
            property_name,
            budget,
            contact_from_datetime,
            contact_to_datetime,
        } = body;
const [rows]: any = await executeQuery(`
    SELECT appointment_id
    FROM metro_property_visit
    ORDER BY CAST(SUBSTRING(appointment_id,2) AS UNSIGNED) DESC
    LIMIT 1
`);
console.log("rows:", rows);
let nextAppointmentId = "A0001";
if (rows.length > 0) {
    const lastNum = parseInt(
        rows[0].appointment_id.replace("A", ""),
        10
    );
    nextAppointmentId =
        "A" + String(lastNum + 1).padStart(4, "0");
}
        // Kolkata current datetime
        const kolkataNow = new Date().toLocaleString("en-CA", {
            timeZone: "Asia/Kolkata",
            hour12: false,
        });
        const createdAt = kolkataNow
            .replace(",", "")
            .replace(/\//g, "-");
        if (
            new Date(contact_from_datetime) >
            new Date(contact_to_datetime)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Contact From time cannot be greater than Contact To time",
                },
                { status: 400 }
            );
        }
        await executeQuery(
            `
                INSERT INTO metro_property_visit
            (
                appointment_id,
                lead_id,
                agent_id,
                admin_id,
                client_name,
                client_phone,
                project_name,
                budget,
                created_at,
                cold_call_from,
                cold_call_to,
                cold_call_status,
                site_visit_from,
                site_visit_to,
                site_visit_status
            )
            VALUES
            (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
                `,
            [
                nextAppointmentId,
                client_id,
                null,
                "MSM001",
                client_name,
                phone,
                property_name,
                parseInt(budget),
                new Date(),
                // Cold Call
                contact_from_datetime,
                contact_to_datetime,
                "Confirmed",
                // Site Visit
                contact_from_datetime,
                contact_to_datetime,
                "Upcoming",
            ]
        );
        return NextResponse.json({
            success: true,
            appointment_id: nextAppointmentId,
            message: "Site visit booked successfully",
        });
    } catch (error) {
        console.error("Site Visit Booking Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}