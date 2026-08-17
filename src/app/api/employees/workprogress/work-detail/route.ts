import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
const kolkataNow =
    "CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30')";
const kolkataDate =
    "DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30'))";
function addHours(date: Date, hours: number) {
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
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
        // Today's checkin
        const [attendance]: any = await connection.execute(
            `
            SELECT checkin, leave_type
            FROM kp_emp_attendance
            WHERE emp_id=?
            AND DATE(checkin)=${kolkataDate}
            LIMIT 1
            `,
            [emp_id]
        );
        if (!attendance.length) {
            return NextResponse.json({
                success: false,
                message: "Employee has not checked in today.",
            });
        }
        const checkin = new Date(attendance[0].checkin);
        const leaveType = (attendance[0].leave_type || "").trim();
        let totalSlots = 4;
        if (
            leaveType === "Weekoff" ||
            leaveType === "Casual Leave" ||
            leaveType === "Sick Leave" || leaveType === "Absent"
        ) {
            totalSlots = 0;
        } else if (leaveType === "Half Day") {
            totalSlots = 2;
        }
        // Existing slots
        const [existing]: any = await connection.execute(
            `
            SELECT id
            FROM kp_work_progress
            WHERE emp_id=?
            AND work_date=${kolkataDate}
            `,
            [emp_id]
        );
        // Create today's slots only once
        if (existing.length === 0 && totalSlots > 0) {
            for (let i = 0; i < totalSlots; i++) {
                const start = addHours(checkin, i * 2);
                const end = addHours(start, 2);
                await connection.execute(
                    `
                    INSERT INTO kp_work_progress
                    (
                        emp_id,
                        work_date,
                        slot_no,
                        slot_start,
                        slot_end,
                        status,
                        work_types
                    )
                    VALUES(?,?,?,?,?,?,?)
                    `,
                    [
                        emp_id,
                        start.toISOString().slice(0, 10),
                        i + 1,
                        start,
                        end,
                        "Pending",
                        JSON.stringify([]),
                    ]
                );
            }
        }
        // Finish expired Current slots
        await connection.execute(`
            UPDATE kp_work_progress
            SET status='Finished'
            WHERE status='Current'
            AND slot_end < ${kolkataNow}
        `);
        // Pending -> Current
        await connection.execute(`
            UPDATE kp_work_progress
            SET status='Current'
            WHERE status='Pending'
            AND slot_start<=${kolkataNow}
            AND slot_end>${kolkataNow}
        `);
        // Fetch slots
        const [rows]: any = await connection.execute(
            `
    SELECT *
    FROM kp_work_progress
    WHERE emp_id=?
    AND ${kolkataNow} BETWEEN slot_start AND slot_end
    LIMIT 1
    `,
            [emp_id]
        );
        return NextResponse.json({
            success: true,
            slot: rows.length ? rows[0] : null,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({
            success: false,
            message: "Database Error",
        });
    } finally {
        if (connection) await connection.end();
    }
}
export async function POST(req: NextRequest) {
    let connection;
    try {
        const body = await req.json();
        const {
            emp_id,
            work_types,
            work_number,
            note,
        } = body;
        connection = await mysql.createConnection(dbConfig);
        const [slot]: any = await connection.execute(
            `
            SELECT *
            FROM kp_work_progress
            WHERE emp_id=?
            AND work_date=${kolkataDate}
            AND status='Current'
            LIMIT 1
            `,
            [emp_id]
        );
        if (!slot.length) {
            return NextResponse.json({
                success: false,
                message: "No active slot available.",
            });
        }
        await connection.execute(
            `
            UPDATE kp_work_progress
            SET
                work_types=?,
                work_number=?,
                note=?
            WHERE id=?
            `,
            [
                JSON.stringify(work_types),
                work_number,
                note,
                slot[0].id,
            ]
        );
        return NextResponse.json({
            success: true,
            message: "Work updated successfully.",
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({
            success: false,
            message: "Database Error",
        });
    } finally {
        if (connection) await connection.end();
    }
}
export async function PUT(req: NextRequest) {
    let connection;
    try {
        const {
            emp_id,
            work_types,
            work_number,
            note,
        } = await req.json();
        if (!emp_id) {
            return NextResponse.json({
                success: false,
                message: "Employee ID required",
            });
        }
        connection = await mysql.createConnection(dbConfig);
        const [result]: any = await connection.execute(
            `
            UPDATE kp_work_progress
            SET
                work_types=?,
                work_number=?,
                note=?,
                updated_at=${kolkataNow}
            WHERE
                emp_id=?
                AND ${kolkataNow} BETWEEN slot_start AND slot_end
            `,
            [
                JSON.stringify(work_types),
                work_number,
                note,
                emp_id,
            ]
        );
        if (result.affectedRows === 0) {
            return NextResponse.json({
                success: false,
                message: "Current slot not found.",
            });
        }
        return NextResponse.json({
            success: true,
            message: "Work updated successfully.",
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({
            success: false,
            message: "Database Error",
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}