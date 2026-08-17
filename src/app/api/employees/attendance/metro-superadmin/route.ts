import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
export async function GET() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                id,
                emp_id,
                emp_type,
                name,
                checkin,
                checkout,
                ta_entry,
                leave_type,
                login_location,
                note,
                per_day_income,
                salary_status,
                created_at,
                checkin_location,
                ta_location,
                checkout_location
            FROM kp_emp_attendance
            ORDER BY created_at DESC
        `);
        return NextResponse.json(Array.isArray(rows) ? rows : []);
    } catch (error) {
        console.error("Attendance Fetch Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch attendance" },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}