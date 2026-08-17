import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
export async function POST(req: NextRequest) {
    let connection;
    try {
        const body = await req.json();
        const {
            emp_id,
            emp_type,
            name,
            checkin,
            checkout,
            leave_type,
            login_location,
            note,
            per_day_income,
            salary_status,
            checkin_location,
            checkout_location,
        } = body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `
            INSERT INTO kp_emp_attendance (
                emp_id,
                emp_type,
                name,
                checkin,
                checkout,
                leave_type,
                login_location,
                note,
                per_day_income,
                salary_status,
                checkin_location,
                checkout_location
            )
            VALUES (?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                emp_id,
                emp_type,
                name,
                checkin || null,
                checkout || null,
                leave_type || null,
                login_location || "Direct Office",
                note || null,
                per_day_income,
                salary_status,
                checkin_location || null,
                checkout_location || null,
            ]
        );
        return NextResponse.json({
            message: "Attendance created successfully",
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Failed to create attendance" },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}