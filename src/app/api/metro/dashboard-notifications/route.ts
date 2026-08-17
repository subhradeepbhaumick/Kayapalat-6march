import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

export async function GET() {
    let connection;

    try {
        const session: any = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        connection = await mysql.createConnection(dbConfig);

        const salesId =
            session?.user?.user_id ||
            session?.user?.id;

        const [rows]: any = await connection.execute(
            `
            SELECT
                sv.id,
                sv.client_id,
                sv.property,
                sv.visit_from,
                sv.visit_to,
                sv.status,
                u.name as client_name
            FROM metro_site_visits sv
            LEFT JOIN users_kp_db u
                ON u.user_id = sv.client_id
            WHERE
                sv.sales_id = ?
                AND sv.status = 'Pending'
                AND DATE(sv.visit_from) = CURDATE()
            ORDER BY sv.visit_from ASC
            `,
            [salesId]
        );

        return NextResponse.json({
            success: true,
            total: rows.length,
            data: rows,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Server Error",
            },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}