import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
// ---------- Helpers ----------
function addHours(date: Date, hours: number) {
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
}
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
interface IncomingTask {
    id?: number;
    work_types: string[];
    work_number?: string;
    note: string;
    priority: "High" | "Medium" | "Low";
}
function validateTasks(tasks: any): tasks is IncomingTask[] {
    if (!Array.isArray(tasks) || tasks.length < 3) return false;
    return tasks.every(
        (t) =>
            Array.isArray(t.work_types) &&
            t.work_types.length > 0 &&
            typeof t.note === "string" &&
            t.note.trim().length > 0 &&
            ["High", "Medium", "Low"].includes(t.priority)
    );
}
// ---------- GET: fetch tomorrow's plans (for the form) + today's plans (for follow-up) ----------
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
        connection = await mysql.createConnection(dbConfig);
        const tomorrowDate = getKolkataDate(1);
        const todayDate = getKolkataDate(0);
        const [tomorrowRows]: any = await connection.execute(
            `
            SELECT id, emp_id, work_date, work_types, work_number, note, priority, status, created_at, updated_at
            FROM kp_tomorrow_plan
            WHERE emp_id=? AND work_date=?
            ORDER BY id ASC
            `,
            [emp_id, tomorrowDate]
        );
        const [todayRows]: any = await connection.execute(
            `
            SELECT id, emp_id, work_date, work_types, work_number, note, priority, status, created_at, updated_at
            FROM kp_tomorrow_plan
            WHERE emp_id=? AND work_date=?
            ORDER BY
                FIELD(priority,'High','Medium','Low'),
                FIELD(status,'Pending','Started','Completed','Cancelled'),
                id ASC
            `,
            [emp_id, todayDate]
        );
        return NextResponse.json({
            success: true,
            planDate: tomorrowDate, // lets the client detect a midnight rollover
            plans: tomorrowRows,
            todayPlans: todayRows,
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
// ---------- POST: first-time save (wipe + insert) ----------
export async function POST(req: NextRequest) {
    let connection;
    try {
        const { emp_id, tasks } = await req.json();
        if (!emp_id) {
            return NextResponse.json({
                success: false,
                message: "Employee ID is required",
            });
        }
        if (!validateTasks(tasks)) {
            return NextResponse.json({
                success: false,
                message:
                    "Please add at least 3 tasks, each with a work type and note.",
            });
        }
        connection = await mysql.createConnection(dbConfig);
        const workDate = getKolkataDate(1);
        const now = getKolkataDateTime();
        await connection.beginTransaction();
        await connection.execute(
            `DELETE FROM kp_tomorrow_plan WHERE emp_id=? AND work_date=?`,
            [emp_id, workDate]
        );
        for (const task of tasks as IncomingTask[]) {
            await connection.execute(
                `
                INSERT INTO kp_tomorrow_plan
                    (emp_id, work_date, work_types, work_number, note, priority, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
                `,
                [
                    emp_id,
                    workDate,
                    JSON.stringify(task.work_types),
                    task.work_number || null,
                    task.note,
                    task.priority,
                    now,
                    now,
                ]
            );
        }
        await connection.commit();
        return NextResponse.json({
            success: true,
            message: "Tomorrow's plan saved successfully.",
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
// ---------- PUT: update (sync inserts/updates/deletes) ----------
export async function PUT(req: NextRequest) {
    let connection;
    try {
        const { emp_id, tasks } = await req.json();
        if (!emp_id) {
            return NextResponse.json({
                success: false,
                message: "Employee ID is required",
            });
        }
        if (!validateTasks(tasks)) {
            return NextResponse.json({
                success: false,
                message:
                    "Please add at least 3 tasks, each with a work type and note.",
            });
        }
        connection = await mysql.createConnection(dbConfig);
        const workDate = getKolkataDate(1);
        const now = getKolkataDateTime();
        await connection.beginTransaction();
        const [existingRows]: any = await connection.execute(
            `SELECT id FROM kp_tomorrow_plan WHERE emp_id=? AND work_date=?`,
            [emp_id, workDate]
        );
        const existingIds: number[] = existingRows.map((r: any) => r.id);
        const incomingIds: number[] = (tasks as IncomingTask[])
            .filter((t) => t.id)
            .map((t) => t.id as number);
        const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));
        if (idsToDelete.length > 0) {
            await connection.query(
                `DELETE FROM kp_tomorrow_plan WHERE id IN (?)`,
                [idsToDelete]
            );
        }
        for (const task of tasks as IncomingTask[]) {
            if (task.id && existingIds.includes(task.id)) {
                await connection.execute(
                    `
                    UPDATE kp_tomorrow_plan
                    SET work_types=?, work_number=?, note=?, priority=?, updated_at=?
                    WHERE id=? AND emp_id=? AND work_date=?
                    `,
                    [
                        JSON.stringify(task.work_types),
                        task.work_number || null,
                        task.note,
                        task.priority,
                        now,
                        task.id,
                        emp_id,
                        workDate,
                    ]
                );
            } else {
                await connection.execute(
                    `
                    INSERT INTO kp_tomorrow_plan
                        (emp_id, work_date, work_types, work_number, note, priority, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
                    `,
                    [
                        emp_id,
                        workDate,
                        JSON.stringify(task.work_types),
                        task.work_number || null,
                        task.note,
                        task.priority,
                        now,
                        now,
                    ]
                );
            }
        }
        await connection.commit();
        return NextResponse.json({
            success: true,
            message: "Tomorrow's plan updated successfully.",
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
// ---------- PATCH: mark a today's task Complete (requires check-in) ----------
export async function PATCH(req: NextRequest) {
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
        // 1. Employee must be checked in today before completing any task
        const [attendance]: any = await connection.execute(
            `
            SELECT checkin
            FROM kp_emp_attendance
            WHERE emp_id=? AND DATE(checkin)=CURDATE()
            LIMIT 1
            `,
            [emp_id]
        );
        if (!attendance.length) {
            return NextResponse.json({
                success: false,
                message: "Please check in first to complete tasks.",
            });
        }
        const checkin = new Date(attendance[0].checkin);
        // 2. Task must belong to this employee and be scheduled for today
        const [taskRows]: any = await connection.execute(
            `
            SELECT *
            FROM kp_tomorrow_plan
            WHERE id=? AND emp_id=? AND work_date=CURDATE()
            LIMIT 1
            `,
            [id, emp_id]
        );
        if (!taskRows.length) {
            return NextResponse.json({
                success: false,
                message: "Task not found for today.",
            });
        }
        const task = taskRows[0];
        if (task.status === "Completed") {
            return NextResponse.json({
                success: false,
                message: "This task is already completed.",
            });
        }
        await connection.beginTransaction();
        // 3. Determine next slot number for today, following the same
        //    2-hour-from-checkin pattern used when slots are auto-created.
        const [slotResult]: any = await connection.execute(
            `
            SELECT COALESCE(MAX(slot_no), 0) AS maxSlot
            FROM kp_work_progress
            WHERE emp_id=? AND work_date=CURDATE()
            `,
            [emp_id]
        );
        const nextSlotNo = (slotResult[0].maxSlot || 0) + 1;
        const slotStart = addHours(checkin, (nextSlotNo - 1) * 2);
        const slotEnd = addHours(slotStart, 2);
        const now = getKolkataDateTime();
        const workTypesJson =
            typeof task.work_types === "string"
                ? task.work_types
                : JSON.stringify(task.work_types);
        // 4. Log the finished work into kp_work_progress
        await connection.execute(
            `
            INSERT INTO kp_work_progress
                (emp_id, work_date, slot_no, slot_start, slot_end, status, work_types, work_number, note, created_at, updated_at)
            VALUES (?, CURDATE(), ?, ?, ?, 'Finished', ?, ?, ?, ?, ?)
            `,
            [
                emp_id,
                nextSlotNo,
                slotStart,
                slotEnd,
                workTypesJson,
                task.work_number,
                task.note,
                now,
                now,
            ]
        );
        // 5. Mark the plan task Completed
        await connection.execute(
            `UPDATE kp_tomorrow_plan SET status='Completed', updated_at=? WHERE id=?`,
            [now, id]
        );
        await connection.commit();
        return NextResponse.json({
            success: true,
            message: "Task marked as completed.",
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
// ---------- DELETE: remove a single plan by id ----------
export async function DELETE(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    const emp_id = req.nextUrl.searchParams.get("emp_id");
    if (!id || !emp_id) {
        return NextResponse.json({
            success: false,
            message: "id and emp_id are required",
        });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `DELETE FROM kp_tomorrow_plan WHERE id=? AND emp_id=?`,
            [id, emp_id]
        );
        return NextResponse.json({
            success: true,
            message: "Task deleted successfully.",
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