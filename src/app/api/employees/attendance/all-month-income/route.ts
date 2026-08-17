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
                { message: "Employee ID required" },
                { status: 400 }
            );
        }
        connection = await mysql.createConnection(dbConfig);
        const [rows]: any = await connection.execute(
            `
    SELECT
        MONTH(a.created_at) AS month,
        YEAR(a.created_at) AS year,
        MONTHNAME(MIN(a.created_at)) AS month_name,

        SUM(a.per_day_income) AS base_salary,
        MAX(a.ta) AS ta_amount,
        MAX(a.incentive) AS incentive_amount,

        COUNT(
            CASE
                WHEN a.leave_type = 'Half Day'
                THEN 1
            END
        ) AS halfday_count,

        COUNT(
            CASE
                WHEN a.leave_type = 'Weekoff'
                THEN 1
            END
        ) AS used_weekoff,

        MAX(a.per_day_income) AS per_day_income,

        MAX(d.weekoff) AS total_weekoff,
    CASE
        WHEN COUNT(*) = SUM(CASE WHEN a.salary_status = 'Paid' THEN 1 ELSE 0 END)
        THEN 'Paid'
        ELSE 'Pending'
    END AS payment_status
    FROM kp_emp_attendance a
    JOIN kp_emp_details d
        ON a.emp_id = d.emp_id

    WHERE a.emp_id = ?

    GROUP BY
        YEAR(a.created_at),
        MONTH(a.created_at)

    ORDER BY
        YEAR(a.created_at) DESC,
        MONTH(a.created_at) DESC
    `,
            [emp_id]
        );
        const months = rows.map((row: any) => {
            const baseSalary = Number(row.base_salary || 0);
            const totalWeekoff = Number(row.total_weekoff || 0);
            const usedWeekoff = Number(row.used_weekoff || 0);
            const halfdayCount = Number(row.halfday_count || 0);
            const perDayIncome = Number(row.per_day_income || 0);
            const taAmount = Number(row.ta_amount || 0);
            const incentiveAmount = Number(row.incentive_amount || 0);
            const unusedWeekoff = Math.max(0, totalWeekoff - usedWeekoff);
            const eligibleBonusDays = Math.floor(halfdayCount / 2);
            const bonusDays = Math.min(unusedWeekoff, eligibleBonusDays);

            return {
                month: row.month,
                year: row.year,
                month_name: row.month_name,
                total_income: baseSalary + bonusDays * perDayIncome,
                payment_status: row.payment_status,
                ta_amount: taAmount,
                incentive_amount: incentiveAmount,
            };
        });
        return NextResponse.json({
            months,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Server Error" },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}