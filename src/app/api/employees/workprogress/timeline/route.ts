import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

// Returns YYYY-MM-DD for "today + offsetDays" in Asia/Kolkata (IST, UTC+5:30)
function getKolkataDate(offsetDays = 0): string {
    const kolkataMs = Date.now() + 5.5 * 60 * 60000;
    const kolkata = new Date(kolkataMs);
    kolkata.setUTCDate(kolkata.getUTCDate() + offsetDays);
    return kolkata.toISOString().split("T")[0];
}
// Returns "YYYY-MM-DD HH:MM:SS" for the current moment in Asia/Kolkata
function getKolkataDateTime(): string {
    const kolkataMs = Date.now() + 5.5 * 60 * 60000;
    const kolkata = new Date(kolkataMs);
    return kolkata.toISOString().slice(0, 19).replace("T", " ");
}
function toDateStr(val: any): string {
    if (val instanceof Date) return val.toISOString().slice(0, 10);
    return val;
}
function parseJsonArray(val: any): string[] {
    try {
        return Array.isArray(val) ? val : JSON.parse(val || "[]");
    } catch {
        return [];
    }
}
// ---------- GET: fetch kp_tomorrow_plan rows for a date or date range ----------
export async function GET(req: NextRequest) {
    const emp_id = req.nextUrl.searchParams.get("emp_id");
    const date = req.nextUrl.searchParams.get("date"); // optional single YYYY-MM-DD
    const fromParam = req.nextUrl.searchParams.get("from"); // optional range start
    const toParam = req.nextUrl.searchParams.get("to"); // optional range end
    if (!emp_id) {
        return NextResponse.json({
            success: false,
            message: "Employee ID is required",
        });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        let rows: any;
        if (fromParam || toParam) {
            // Range mode — defaults fill in the missing side
            const fromDate = fromParam || getKolkataDate(-6);
            const toDate = toParam || getKolkataDate(1);
            [rows] = await connection.execute(
                `
                SELECT id, emp_id, work_date, work_types, work_number, note, priority, status, created_at, updated_at
                FROM kp_tomorrow_plan
                WHERE emp_id=? AND work_date BETWEEN ? AND ?
                ORDER BY work_date DESC, id ASC
                `,
                [emp_id, fromDate, toDate]
            );
            return NextResponse.json({
                success: true,
                from: fromDate,
                to: toDate,
                tasks: rows,
            });
        }
        // Single-date mode (backward compatible)
        const targetDate = date || getKolkataDate(0);
        [rows] = await connection.execute(
            `
            SELECT id, emp_id, work_date, work_types, work_number, note, priority, status, created_at, updated_at
            FROM kp_tomorrow_plan
            WHERE emp_id=? AND work_date=?
            ORDER BY id ASC
            `,
            [emp_id, targetDate]
        );
        return NextResponse.json({
            success: true,
            work_date: targetDate,
            tasks: rows,
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
// ---------- POST: mark task Completed + log/merge into kp_work_progress ----------
export async function POST(req: NextRequest) {
    let connection;
    try {
        const { id, emp_id } = await req.json();
        if (!id || !emp_id) {
            return NextResponse.json({
                success: false,
                message: "id and emp_id are required",
            });
        }
        connection = await mysql.createConnection(dbConfig);
        // 1. Fetch the plan task
        const [taskRows]: any = await connection.execute(
            `SELECT * FROM kp_tomorrow_plan WHERE id=? AND emp_id=? LIMIT 1`,
            [id, emp_id]
        );
        if (!taskRows.length) {
            return NextResponse.json({
                success: false,
                message: "Task not found.",
            });
        }
        const task = taskRows[0];
        if (task.status === "Completed") {
            return NextResponse.json({
                success: false,
                message: "This task is already completed.",
            });
        }
        const nowIST = getKolkataDateTime(); // <-- single source of truth for "now"
        const workDate = getKolkataDate(0); // always log against TODAY's slot, not the task's original date
        // 2. Make sure the employee has a kp_work_progress row for today —
        //    its absence means they haven't checked in / logged in yet.
        const [progressRows]: any = await connection.execute(
            `SELECT * FROM kp_work_progress WHERE emp_id=? AND work_date=?`,
            [emp_id, workDate]
        );
        if (!progressRows.length) {
            return NextResponse.json({
                success: false,
                message: "Please login/check-in as Present to your system first before completing tasks.",
            });
        }
        // 3. Refresh slot statuses using the IST "now" value bound as a
        //    parameter — NOT SQL's NOW(), which runs in the DB server's own
        //    timezone (usually UTC) and drifts ~5.5 hours from IST.
        await connection.execute(
            `
            UPDATE kp_work_progress
            SET status='Finished'
            WHERE emp_id=? AND work_date=? AND status='Current' AND slot_end < ?
            `,
            [emp_id, workDate, nowIST]
        );
        await connection.execute(
            `
            UPDATE kp_work_progress
            SET status='Current'
            WHERE emp_id=? AND work_date=? AND status='Pending'
            AND slot_start<=? AND slot_end>?
            `,
            [emp_id, workDate, nowIST, nowIST]
        );
        // 4. Find the current active slot
        const [currentRows]: any = await connection.execute(
            `SELECT * FROM kp_work_progress WHERE emp_id=? AND work_date=? AND status='Current' LIMIT 1`,
            [emp_id, workDate]
        );
        if (!currentRows.length) {
            // Fallback: also check directly by time window, in case a slot
            // is mid-window but was never flipped to Current (e.g. row was
            // Finished/Pending from a stale run).
            const [windowRows]: any = await connection.execute(
                `
                SELECT * FROM kp_work_progress
                WHERE emp_id=? AND work_date=?
                AND ? BETWEEN slot_start AND slot_end
                LIMIT 1
                `,
                [emp_id, workDate, nowIST]
            );
            if (!windowRows.length) {
                return NextResponse.json({
                    success: false,
                    message: "No active work slot right now. Please try again during your work hours.",
                });
            }
            // Force it into Current so we can merge into it below
            await connection.execute(
                `UPDATE kp_work_progress SET status='Current' WHERE id=?`,
                [windowRows[0].id]
            );
            windowRows[0].status = "Current";
            currentRows[0] = windowRows[0];
            currentRows.length = 1;
        }
        const currentSlot = currentRows[0];
        // 5. Merge task data into whatever is already on that slot
        const mergedTypes = Array.from(
            new Set([
                ...parseJsonArray(currentSlot.work_types),
                ...parseJsonArray(task.work_types),
            ])
        );
        const mergedWorkNumber = [currentSlot.work_number, task.work_number]
            .filter((v) => v && String(v).trim())
            .join(", ");
        const mergedNote = [currentSlot.note, task.note]
            .filter((v) => v && String(v).trim())
            .join("\n\n");
        await connection.beginTransaction();
        await connection.execute(
            `
            UPDATE kp_work_progress
            SET work_types=?, work_number=?, note=?, status='Current', updated_at=?
            WHERE id=?
            `,
            [
                JSON.stringify(mergedTypes),
                mergedWorkNumber || null,
                mergedNote || null,
                nowIST,
                currentSlot.id,
            ]
        );
        await connection.execute(
            `UPDATE kp_tomorrow_plan SET status='Completed', updated_at=? WHERE id=?`,
            [nowIST, id]
        );
        await connection.commit();
        return NextResponse.json({
            success: true,
            message: "Task marked as completed and logged to work progress.",
        });
    } catch (err) {
        console.error(err);
        if (connection) await connection.rollback();
        return NextResponse.json({
            success: false,
            message: "Database Error",
        });
    } finally {
        if (connection) await connection.end();
    }
}