import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

// ================= DELETE ATTENDANCE =================
export async function DELETE(req: NextRequest) {

    let connection;

    try {

        const { searchParams } = new URL(req.url);

        const id = searchParams.get("id");

        if (!id) {

            return NextResponse.json(
                { error: "Attendance ID required" },
                { status: 400 }
            );

        }

        connection = await mysql.createConnection(dbConfig);

        await connection.execute(
            `DELETE FROM kp_emp_attendance WHERE id = ?`,
            [id]
        );

        return NextResponse.json({
            success: true,
            message: "Attendance deleted successfully",
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