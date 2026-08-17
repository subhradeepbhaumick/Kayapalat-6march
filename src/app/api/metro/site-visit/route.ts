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

export async function POST(req: NextRequest) {
    let connection;

    try {
        const session: any = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();

        const {
            client_id,
            property,
            budget,
            visit_from,
            visit_to,
        } = body;

        connection = await mysql.createConnection(dbConfig);
        console.log({
            client_id,
            sales_id: session?.user?.user_id,
            property,
            budget,
            visit_from,
            visit_to,
        });
        console.log("SESSION =", JSON.stringify(session, null, 2));

        const sales_id =
            session?.user?.user_id ||
            session?.user?.id ||
            session?.user?.employee_id ||
            null;

        console.log({
            client_id,
            sales_id,
            property,
            budget,
            visit_from,
            visit_to,
        });
        await connection.execute(
            `
            INSERT INTO metro_site_visits
            (
                client_id,
                sales_id,
                property,
                budget,
                visit_from,
                visit_to
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                client_id,
                sales_id,
                property,
                budget,
                visit_from,
                visit_to,
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Site Visit Saved",
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

export async function GET(req: NextRequest) {
    let connection;

    try {
        const client_id =
            req.nextUrl.searchParams.get("client_id");

        connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(
            `
            SELECT *
            FROM metro_site_visits
            WHERE client_id=?
            ORDER BY id DESC
            `,
            [client_id]
        );

        return NextResponse.json({
            success: true,
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
export async function PUT(req: NextRequest) {
    let connection;

    try {
        const body = await req.json();

        const {
            id,
            property,
            budget,
            visit_from,
            visit_to,
            status,
        } = body;

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `
            UPDATE metro_site_visits
            SET
                property=?,
                budget=?,
                visit_from=?,
                visit_to=?,
                status=?
            WHERE id=?
            `,
            [
                property,
                budget,
                visit_from,
                visit_to,
                status,
                id,
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Visit Updated",
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