import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// ==============================
// GET EMPLOYEES
// ==============================
export async function GET() {
    try {
        const [rows]: any = await db.execute(`
            SELECT
                ed.emp_id,
                ed.name
            FROM kp_emp_details ed
            INNER JOIN users_kp_db u
                ON ed.emp_id = u.user_id
            WHERE u.role = 'metro'
            ORDER BY ed.name
        `);

        return NextResponse.json({
            success: true,
            employees: rows,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch employees",
            },
            { status: 500 }
        );
    }
}

// ==============================
// ALLOT TASK
// ==============================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            emp_id,
            work_types,
            work_number,
            note,
            priority,
        } = body;

        if (!emp_id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Employee is required.",
                },
                { status: 400 }
            );
        }

        if (!work_types || work_types.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Select at least one work type.",
                },
                { status: 400 }
            );
        }

        if (!note.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Work note is required.",
                },
                { status: 400 }
            );
        }

        // Today's Kolkata date
        const now = new Date();

        const workDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(now);

        await db.execute(
            `
            INSERT INTO kp_tomorrow_plan
            (
                emp_id,
                work_date,
                work_types,
                work_number,
                note,
                priority,
                status,
                created_at,
                updated_at
            )
            VALUES
            (?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
            `,
            [
                emp_id,
                workDate,
                JSON.stringify(work_types),
                work_number || "",
                note,
                priority,
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Task allotted successfully.",
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}