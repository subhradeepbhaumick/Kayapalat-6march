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
        const [rows]: any = await connection.execute(
            `
            SELECT id
            FROM kp_emp_attendance
            WHERE emp_id = ?
            AND DATE(created_at) = CURDATE()
            LIMIT 1
            `,
            [emp_id]
        );
        return NextResponse.json({
            exists: rows.length > 0,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to check attendance" },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}