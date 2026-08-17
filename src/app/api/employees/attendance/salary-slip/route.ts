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
        const month = searchParams.get("month");
        const year = searchParams.get("year");
        if (!emp_id || !month || !year) {
            return NextResponse.json(
                { message: "emp_id, month and year are required" },
                { status: 400 }
            );
        }
        connection = await mysql.createConnection(dbConfig);
// Employee Details
const [employeeRows]: any = await connection.execute(
    `
    SELECT
        emp_id,
        name,
        email,
        job_details,
        joining_date,
        salary,
        weekoff,
        login_time
    FROM kp_emp_details
    WHERE emp_id = ?
    `,
    [emp_id]
);
if (employeeRows.length === 0) {
    return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
    );
}
const employee = employeeRows[0];
// Attendance Summary
const [attendanceRows]: any = await connection.execute(
    `
    SELECT
        COUNT(a.checkin) AS total_days,
        SUM(
CASE
    WHEN a.leave_type IS NULL
      OR a.leave_type=''
      OR a.leave_type='Present'
    THEN 1
    ELSE 0
END
) AS present_days,
        SUM(CASE WHEN a.leave_type='Half Day' THEN 1 ELSE 0 END) AS half_days,
        SUM(CASE WHEN a.leave_type='Weekoff' THEN 1 ELSE 0 END) AS weekoff_days,
        SUM(
            CASE
                WHEN (a.leave_type IS NULL OR TRIM(a.leave_type) = '')
                    AND a.checkin IS NOT NULL
                    AND d.login_time IS NOT NULL
                    AND TIME(a.checkin) > d.login_time
                THEN 1
                ELSE 0
            END
        ) AS late_count,
        SUM(a.per_day_income) AS base_salary,
        MAX(a.per_day_income) AS per_day_income,
        CASE
            WHEN SUM(a.salary_status='Paid') = COUNT(*)
            THEN 'Paid'
            ELSE 'Pending'
        END AS payment_status
    FROM kp_emp_attendance a
    JOIN kp_emp_details d
        ON a.emp_id = d.emp_id
    WHERE a.emp_id=?
    AND MONTH(a.created_at)=?
    AND YEAR(a.created_at)=?
    `,
    [emp_id, month, year]
);
const attendance = attendanceRows[0];
if (!attendance || attendance.total_days == 0) {
    return NextResponse.json(
        { message: "No attendance found." },
        { status: 404 }
    );
}
// Do not allow slip until salary is paid
if (attendance.payment_status !== "Paid") {
    return NextResponse.json(
        {
            message: "Salary has not been paid for this month."
        },
        { status: 400 }
    );
}
// Bonus calculation
const unusedWeekoff = Math.max(
    0,
    Number(employee.weekoff) - Number(attendance.weekoff_days)
);
const eligibleBonusDays = Math.floor(
    Number(attendance.half_days) / 2
);
const bonusDays = Math.min(
    unusedWeekoff,
    eligibleBonusDays
);
// Late deduction: every 3 late arrivals cost 1 day's income
const lateCount = Number(attendance.late_count || 0);
const lateDeductionDays = Math.floor(lateCount / 3);
const lateDeductionAmount = lateDeductionDays * Number(attendance.per_day_income);
const totalSalary =
    Number(attendance.base_salary) +
    bonusDays * Number(attendance.per_day_income) -
    lateDeductionAmount;
return NextResponse.json({
    company: {
        name: "John Management Pvt. Ltd.",
        address: "Kolkata, West Bengal",
        email: "info@kayapalat.co",
        phone: "+91 6026026026",
    },
    employee: {
        emp_id: employee.emp_id,
        name: employee.name,
        email: employee.email,
        designation: employee.job_details,
        joining_date: employee.joining_date,
        monthly_salary: Number(employee.salary),
        weekoff_allowed: Number(employee.weekoff),
    },
    attendance: {
        month: Number(month),
        year: Number(year),
        total_days: Number(attendance.total_days),
        present_days: Number(attendance.present_days),
        half_days: Number(attendance.half_days),
        weekoff_days: Number(attendance.weekoff_days),
        late_count: lateCount,
        unused_weekoff: unusedWeekoff,
        bonus_days: bonusDays,
        per_day_income: Number(attendance.per_day_income),
    },
    salary: {
        base_salary: Number(attendance.base_salary),
        bonus_amount: bonusDays * Number(attendance.per_day_income),
        late_deduction_days: lateDeductionDays,
        late_deduction_amount: lateDeductionAmount,
        total_salary: totalSalary,
        payment_status: attendance.payment_status,
    },
    generated_at: new Date(),
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