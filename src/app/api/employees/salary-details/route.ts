import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
// ================= GET =================
export async function GET(req: NextRequest) {
    let connection;
    try {
        const { searchParams } = new URL(req.url);
        const emp_id = searchParams.get("emp_id");
        const month = searchParams.get("month");
        const year = searchParams.get("year");
        if (!emp_id) {
            return NextResponse.json(
                { error: "Employee ID required" },
                { status: 400 }
            );
        }
        const selectedMonth = month
            ? Number(month)
            : new Date().getMonth() + 1;
        const selectedYear = year
            ? Number(year)
            : new Date().getFullYear();
        connection = await mysql.createConnection(dbConfig);
        // ================= ATTENDANCE =================
        const attendanceQuery = `
        SELECT a.*,
            CASE
                WHEN a.checkin IS NOT NULL
                    AND d.login_time IS NOT NULL
                    AND (a.leave_type IS NULL OR TRIM(a.leave_type) = '')
                    AND TIME(a.checkin) > d.login_time
                THEN 1
                ELSE 0
            END AS is_late
        FROM kp_emp_attendance a
        JOIN kp_emp_details d
            ON a.emp_id = d.emp_id
        WHERE a.emp_id = ?
        AND MONTH(a.created_at) = ?
        AND YEAR(a.created_at) = ?
        ORDER BY a.created_at DESC
    `;
        const [attendance]: any = await connection.execute(
            attendanceQuery,
            [emp_id, selectedMonth, selectedYear]
        );
        // ================= TOTAL SALARY =================
        const totalSalaryQuery = `
        SELECT
            SUM(a.per_day_income) AS base_salary,
            MAX(a.salary_status) AS payment_status,
            MAX(a.ta) AS ta_amount,
            MAX(a.incentive) AS incentive_amount,
            COUNT(CASE WHEN LOWER(a.leave_type)='Half Day' THEN 1 END) AS halfday_count,
            COUNT(CASE WHEN LOWER(a.leave_type)='Weekoff' THEN 1 END) AS used_weekoff,
            MAX(a.per_day_income) AS per_day_income,
            MAX(d.Weekoff) AS total_weekoff,
            COUNT(CASE
                WHEN a.checkin IS NOT NULL
                    AND d.login_time IS NOT NULL
                    AND (a.leave_type IS NULL OR TRIM(a.leave_type) = '')
                    AND TIME(a.checkin) > d.login_time
                THEN 1
            END) AS late_count
        FROM kp_emp_attendance a
        JOIN kp_emp_details d
        ON a.emp_id=d.emp_id
        WHERE a.emp_id=?
        AND MONTH(a.created_at)=?
        AND YEAR(a.created_at)=?;
        `;
        const [salaryRows]: any = await connection.execute(
            totalSalaryQuery,
            [emp_id, selectedMonth, selectedYear]
        );
        const row = salaryRows[0];

        const baseSalary = Number(row.base_salary || 0);
        const totalWeekoff = Number(row.total_weekoff || 0);
        const usedWeekoff = Number(row.used_weekoff || 0);
        const halfdayCount = Number(row.halfday_count || 0);
        const perDayIncome = Number(row.per_day_income || 0);
        const lateCount = Number(row.late_count || 0);
        const taAmount = Number(row.ta_amount || 0);
        const incentiveAmount = Number(row.incentive_amount || 0);
        const unusedWeekoff = Math.max(0, totalWeekoff - usedWeekoff);

        // Every 2 half-days earn one extra paid weekoff
        const eligibleBonusDays = Math.floor(halfdayCount / 2);

        // Cannot exceed unused weekoffs
        const bonusDays = Math.min(unusedWeekoff, eligibleBonusDays);

        // Every 3 late arrivals in the month cost 1 day's income
        const lateDeductionDays = Math.floor(lateCount / 3);
        const lateDeduction = lateDeductionDays * perDayIncome;

        const totalSalary =
            baseSalary + bonusDays * perDayIncome - lateDeduction;

        return NextResponse.json({
            attendance,
            total_salary: totalSalary,
            payment_status: salaryRows[0]?.payment_status || "Pending",
            ta_amount: taAmount,
            incentive_amount: incentiveAmount,
            late_count: lateCount,
            late_deduction_days: lateDeductionDays,
            late_deduction_amount: lateDeduction,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Server Error" },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
// ================= PUT =================
export async function PUT(req: NextRequest) {
    let connection;
    try {
        const body = await req.json();
        const {
            emp_id,
            month,
            year,
            salary_status,
            ta_amount,
            incentive_amount,
        } = body;
        if (
            !emp_id ||
            month == null ||
            year == null ||
            (salary_status == null && ta_amount == null && incentive_amount == null)
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }
        connection = await mysql.createConnection(dbConfig);

        // Build the update dynamically depending on which field(s) were sent
        const setClauses: string[] = [];
        const params: any[] = [];

        if (salary_status != null) {
            setClauses.push("salary_status = ?");
            params.push(salary_status);
        }

        if (ta_amount != null) {
            const parsedTa = Number(ta_amount);
            if (Number.isNaN(parsedTa)) {
                return NextResponse.json(
                    { error: "Invalid TA amount" },
                    { status: 400 }
                );
            }
            setClauses.push("ta = ?");
            params.push(parsedTa);
        }
                if (incentive_amount != null) {
            const parsedIncentive = Number(incentive_amount);
            if (Number.isNaN(parsedIncentive)) {
                return NextResponse.json({ error: "Invalid incentive amount" }, { status: 400 });
            }
            setClauses.push("incentive = ?");
            params.push(parsedIncentive);
        }

        // UPDATE ALL ROWS OF THAT MONTH
        const updateQuery = `
            UPDATE kp_emp_attendance
            SET ${setClauses.join(", ")}
            WHERE emp_id = ?
            AND MONTH(created_at) = ?
            AND YEAR(created_at) = ?
        `;
        params.push(emp_id, month, year);

        await connection.execute(updateQuery, params);
        return NextResponse.json({
            success: true,
            message: "Salary details updated successfully",
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Server Error" },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}