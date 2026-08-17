import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

function getKolkataDateTime() {
    const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
    const ist = new Date(istMs);

    return {
        date: ist.toISOString().split("T")[0],
        datetime: ist.toISOString().slice(0, 19).replace("T", " "),
    };
}

export async function GET(req: NextRequest) {
    const emp_id = req.nextUrl.searchParams.get("emp_id");
    if (!emp_id) {
        return NextResponse.json({
            success: false,
            message: "Employee ID is required",
        });
    }
    let connection;
    try {
        connection = await mysql.createConnection({ ...dbConfig, dateStrings: true });
        const { date, datetime } = getKolkataDateTime();
        // Attendance
        const [attendance]: any = await connection.execute(
            `
            SELECT checkin, checkout
            FROM kp_emp_attendance
            WHERE emp_id=?
            AND DATE(checkin)=?
            LIMIT 1
            `,
            [emp_id, date]
        );
        // Employee
        const [employee]: any = await connection.execute(
            `
            SELECT
                emp_id,
                name,
                email,
                emp_type,
                joining_date,
                weekoff,
                salary,
                login_time
            FROM kp_emp_details
            WHERE emp_id=?
            LIMIT 1
            `,
            [emp_id]
        );
        // Current Slot
        const [slot]: any = await connection.execute(
            `
            SELECT
                slot_no,
                slot_start,
                slot_end,
                status
            FROM kp_work_progress
            WHERE emp_id=?
            AND work_date=?
            AND ? BETWEEN slot_start AND slot_end
            LIMIT 1
            `,
            [emp_id, date, datetime]
        );
        await connection.end();
        return NextResponse.json({
            success: true,
            attendance: attendance.length ? attendance[0] : null,
            employee: employee.length ? employee[0] : null,
            currentSlot: slot.length ? slot[0] : null,
            currentTime: datetime,
        });
    } catch (error) {
        console.error(error);
        if (connection) {
            await connection.end();
        }
        return NextResponse.json({
            success: false,
            message: "Database error",
        });
    }
}