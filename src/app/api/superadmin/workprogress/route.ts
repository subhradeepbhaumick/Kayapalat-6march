import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export async function GET(req: NextRequest) {

    const { searchParams } = new URL(req.url);

    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    const selectedDate = searchParams.get("date") || today;

    try {
        // =====================================
        // UPDATE SLOT STATUS BASED ON CURRENT TIME
        // =====================================

        if (selectedDate === today) {

            // Finished
            await db.execute(`
        UPDATE kp_work_progress
        SET
            status='Finished',
            updated_at=NOW()
        WHERE
            DATE(work_date)=?
            AND slot_end < NOW()
    `, [selectedDate]);

            // Current
            await db.execute(`
        UPDATE kp_work_progress
        SET
            status='Current',
            updated_at=NOW()
        WHERE
            DATE(work_date)=?
            AND NOW() BETWEEN slot_start AND slot_end
    `, [selectedDate]);

            // Pending
            await db.execute(`
        UPDATE kp_work_progress
        SET
            status='Pending',
            updated_at=NOW()
        WHERE
            DATE(work_date)=?
            AND slot_start > NOW()
    `, [selectedDate]);

        }
        // =====================================
        // DASHBOARD STATS
        // =====================================

        const [statsRows]: any = await db.execute(
            `
            SELECT
                (SELECT COUNT(*) FROM kp_emp_details) AS totalEmployees,

                (
                    SELECT COUNT(DISTINCT emp_id)
                    FROM kp_emp_attendance
                    WHERE DATE(checkin)=?
                ) AS presentEmployees,

                (
                    SELECT COUNT(*)
                    FROM kp_tomorrow_plan
                    WHERE status='Pending'
                ) AS pendingTasks,

                (
                    SELECT COUNT(*)
                    FROM kp_tomorrow_plan
                    WHERE status='Pending'
                    AND work_date=?
                ) AS todayPendingTasks,

                (
                    SELECT COUNT(*)
                    FROM kp_work_progress
                    WHERE DATE(work_date)=?
                ) AS totalSlots,

                (
                    SELECT COUNT(*)
                    FROM kp_work_progress
                    WHERE DATE(work_date)=?
                    AND work_types IS NOT NULL
                    AND JSON_LENGTH(work_types)>0
                ) AS completedSlots,

                (
                    SELECT COUNT(*)
                    FROM kp_work_progress
                    WHERE work_date BETWEEN DATE_FORMAT(?, '%Y-%m-01') AND ?
                ) AS monthTotalSlots,

                (
                    SELECT COUNT(*)
                    FROM kp_work_progress
                    WHERE work_date BETWEEN DATE_FORMAT(?, '%Y-%m-01') AND ?
                    AND work_types IS NOT NULL
                    AND JSON_LENGTH(work_types)>0
                ) AS monthCompletedSlots
            `,
            [
                selectedDate, // attendance
                selectedDate, // todayPendingTasks
                selectedDate, // totalSlots
                selectedDate, // completedSlots
                selectedDate, // monthTotalSlots start
                selectedDate, // monthTotalSlots end
                selectedDate, // monthCompletedSlots start
                selectedDate, // monthCompletedSlots end
            ]
        );

        const stat = statsRows[0];

        const totalEmployees = Number(stat.totalEmployees || 0);
        const presentEmployees = Number(stat.presentEmployees || 0);
        const pendingTasks = Number(stat.pendingTasks || 0);
        const todayPendingTasks = Number(stat.todayPendingTasks || 0);
        // Today's Productivity
        const totalSlots = Number(stat.totalSlots || 0);
        const completedSlots = Number(stat.completedSlots || 0);

        const productivity =
            totalSlots === 0
                ? 0
                : Math.round((completedSlots / totalSlots) * 100);

        // Month Productivity
        const monthTotalSlots = Number(stat.monthTotalSlots || 0);
        const monthCompletedSlots = Number(stat.monthCompletedSlots || 0);

        const monthProductivity =
            monthTotalSlots === 0
                ? 0
                : Math.round((monthCompletedSlots / monthTotalSlots) * 100);

        // =====================================
        // WORK PROGRESS
        // =====================================

        const [rows]: any = await db.execute(
            `
            SELECT
                wp.id,
                wp.emp_id,
                ed.name AS employee_name,
                ed.job_details AS employee_designation,
                wp.work_date,
                wp.slot_no,
                wp.slot_start,
                wp.slot_end,
                wp.status,
                wp.work_types,
                wp.work_number,
                wp.note
            FROM kp_work_progress wp
            LEFT JOIN kp_emp_details ed
                ON wp.emp_id = ed.emp_id
            WHERE DATE(wp.work_date)=?
            ORDER BY wp.slot_no, ed.name
            `,
            [selectedDate]
        );

        const employees = rows.map((emp: any) => ({
            ...emp,

            work_types: (() => {
                try {
                    if (!emp.work_types) return [];

                    if (Array.isArray(emp.work_types))
                        return emp.work_types;

                    return JSON.parse(emp.work_types);
                } catch {
                    return [];
                }
            })(),
        }));

        return NextResponse.json({
            success: true,

            stats: {
                presentEmployees,
                totalEmployees,
                productivity,
                pendingTasks,
                todayPendingTasks,
                monthProductivity,
            },

            employees,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            {
                status: 500,
            }
        );
    }
}