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
            id,
            checkout,
            checkout_location,
        } = body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `
            UPDATE kp_emp_attendance
            SET
                checkout = ?,
                checkout_location = ?
            WHERE id = ?
            `,
            [
                checkout,
                checkout_location,
                id,
            ]
        );
        return NextResponse.json({
            message: "Checkout updated successfully",
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Checkout failed" },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}