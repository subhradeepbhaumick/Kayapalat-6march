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
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `
            SELECT *
            FROM kp_emp_attendance
            WHERE emp_id = ?
            ORDER BY id DESC
            `,
            [emp_id]
        );
        return NextResponse.json({
            attendance: rows,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Failed to fetch attendance" },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}