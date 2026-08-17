import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
function getKolkataDate() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 60 * 60000);
    return ist.toISOString().split("T")[0];
}
function formatIST(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    }).format(date);
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
        connection = await mysql.createConnection({
            ...dbConfig,
            dateStrings: true,
        });
        const today = getKolkataDate();
        // -----------------------------
        // Total Slots
        // -----------------------------
        const [slotRows]: any = await connection.execute(
            `
            SELECT COUNT(*) totalSlots
            FROM kp_work_progress
            WHERE emp_id=? AND work_date=?
            `,
            [emp_id, today]
        );
        const totalSlots = slotRows[0].totalSlots;
        // -----------------------------
        // Finished Slots
        // -----------------------------
        const [finishedRows]: any = await connection.execute(
            `
            SELECT COUNT(*) updatesSubmitted
            FROM kp_work_progress
            WHERE emp_id=? 
            AND work_date=?
            AND status='Finished'
            `,
            [emp_id, today]
        );
        const updatesSubmitted = finishedRows[0].updatesSubmitted;
        // -----------------------------
        // Pending Tomorrow Tasks
        // -----------------------------
        const [pendingRows]: any = await connection.execute(
            `
            SELECT COUNT(*) AS pendingTasks
            FROM kp_tomorrow_plan
            WHERE emp_id = ?
            AND status = 'Pending'
            `,
            [emp_id]
        );
        const pendingTasks = pendingRows[0].pendingTasks;
        // -----------------------------
        // Monthly Productivity
        // -----------------------------
        const [monthlyRows]: any = await connection.execute(
            `
    SELECT
        COUNT(*) AS totalSlots,
        SUM(
            CASE
                WHEN JSON_LENGTH(work_types) > 0
                THEN 1
                ELSE 0
            END
        ) AS filledSlots
    FROM kp_work_progress
    WHERE emp_id = ?
      AND YEAR(work_date) = YEAR(CURDATE())
      AND MONTH(work_date) = MONTH(CURDATE())
    `,
            [emp_id]
        );
        const monthlyTotalSlots =
            Number(monthlyRows[0]?.totalSlots || 0);
        const monthlyFilledSlots =
            Number(monthlyRows[0]?.filledSlots || 0);
        const productivity =
            monthlyTotalSlots > 0
                ? Math.round(
                    (monthlyFilledSlots / monthlyTotalSlots) * 100
                )
                : 0;
        const salaryPenalty = productivity < 50;
        // -----------------------------
        // Current Slot
        // -----------------------------
        const [currentRows]: any = await connection.execute(
            `
            SELECT slot_no
            FROM kp_work_progress
            WHERE emp_id=?
            AND work_date=?
            AND status='Current'
            LIMIT 1
            `,
            [emp_id, today]
        );
        let nextUpdate = "Completed";
        if (currentRows.length) {
            const currentSlot = currentRows[0].slot_no;
            const [nextRows]: any = await connection.execute(
                `
                SELECT slot_start
                FROM kp_work_progress
                WHERE emp_id=?
                AND work_date=?
                AND slot_no > ?
                ORDER BY slot_no
                LIMIT 1
                `,
                [emp_id, today, currentSlot]
            );
            if (nextRows.length) {
                const slotStart = String(nextRows[0].slot_start);

                nextUpdate = new Date(
                    slotStart.replace(" ", "T") + "+05:30"
                ).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                });
            }
        }
        return NextResponse.json({
            success: true,
            updatesSubmitted,
            totalSlots,
            nextUpdate,
            pendingTasks,
            productivity,
            monthlyFilledSlots,
            monthlyTotalSlots,
            salaryPenalty,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            success: false,
            message: "Database Error",
        });
    } finally {
        if (connection) await connection.end();
    }
}