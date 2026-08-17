import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export async function GET() {
    try {
        // =====================================
        // EMPLOYEE LIST
        // =====================================

        const [employeeRows]: any = await db.execute(`
            SELECT
                ed.emp_id,
                ed.name
            FROM kp_emp_details ed
            INNER JOIN users_kp_db u
                ON ed.emp_id = u.user_id
            WHERE u.role = 'metro'
            ORDER BY ed.name ASC
        `);

        // =====================================
        // PENDING TASKS
        // =====================================

        const [taskRows]: any = await db.execute(`
            SELECT

                tp.id,
                tp.emp_id,

                ed.name AS employee_name,

                tp.work_date,
                tp.work_types,
                tp.work_number,
                tp.note,
                tp.priority,
                tp.status

            FROM kp_tomorrow_plan tp

            LEFT JOIN kp_emp_details ed
                ON tp.emp_id = ed.emp_id

            INNER JOIN users_kp_db u
                ON tp.emp_id = u.user_id

            WHERE tp.status = 'Pending'
            AND u.role = 'metro'

            ORDER BY
                tp.work_date ASC,
                ed.name ASC
        `);

        const tasks = taskRows.map((task: any) => ({
            ...task,

            work_types: (() => {
                try {
                    if (!task.work_types) return [];

                    if (Array.isArray(task.work_types))
                        return task.work_types;

                    return JSON.parse(task.work_types);
                } catch {
                    return [];
                }
            })(),
        }));

        return NextResponse.json({
            success: true,
            employees: employeeRows,
            tasks,
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