import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
export async function GET(req: NextRequest) {
    let connection;
    try {
        const { searchParams } = new URL(req.url);
        const emp_id = searchParams.get("emp_id");
        if (!emp_id) {
            return NextResponse.json(
                { error: "Employee ID required" },
                { status: 400 }
            );
        }
        connection = await mysql.createConnection(dbConfig);
        const [rows]: any = await connection.execute(`
    SELECT
        MONTH(created_at) AS month,
        YEAR(created_at) AS year,
        MAX(DATE_FORMAT(created_at, '%M')) AS month_name,
        SUM(
            CASE
                WHEN leave_type = 'Weekoff'
                THEN 1
                ELSE 0
            END
        ) AS weekoff_count,
        SUM(
            CASE
                WHEN leave_type = 'Absent'
                THEN 1
                ELSE 0
            END
        ) AS absent_count,
        SUM(
            CASE
                WHEN leave_type = 'Half Day'
                THEN 1
                ELSE 0
            END
        ) AS halfday_count,
        SUM(
            CASE
                WHEN leave_type = 'Sick Leave'
                THEN 1
                ELSE 0
            END
        ) AS sick_leave_count,
        SUM(
            CASE
                WHEN leave_type = 'Casual Leave'
                THEN 1
                ELSE 0
            END
        ) AS casual_leave_count,
        SUM(
            CASE
                WHEN leave_type IS NULL
                     OR leave_type = ''
                THEN 1
                ELSE 0
            END
        ) AS present_count,
        SUM(
            CASE
                WHEN ta_entry IS NOT NULL
                    AND ta_location IS NOT NULL
                    AND ta_location <> ''
                THEN 1
                ELSE 0
            END
        ) AS ta_site_visit_count
    FROM kp_emp_attendance
    WHERE emp_id = ?
    GROUP BY YEAR(created_at), MONTH(created_at)
    ORDER BY year DESC, month DESC
`, [emp_id]);
        return NextResponse.json({
            success: true,
            summary: rows,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch summary" },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}