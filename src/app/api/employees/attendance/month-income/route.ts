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
                SUM(a.per_day_income) AS base_salary,
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
                MAX(a.ta) AS ta_amount,
                MAX(a.incentive) AS incentive_amount,
                MAX(d.weekoff) AS total_weekoff
            FROM kp_emp_attendance a
            JOIN kp_emp_details d
                ON a.emp_id = d.emp_id
            WHERE a.emp_id = ?
            AND MONTH(a.created_at) = MONTH(CURRENT_DATE())
            AND YEAR(a.created_at) = YEAR(CURRENT_DATE());
                `,
            [emp_id]
        );
        const row = rows[0];

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

        const totalIncome = baseSalary + bonusDays * perDayIncome;

        return NextResponse.json({
            total_income: totalIncome,
            ta_amount: taAmount,
            incentive_amount: incentiveAmount,
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