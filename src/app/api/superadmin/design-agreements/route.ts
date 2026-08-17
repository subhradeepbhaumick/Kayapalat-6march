import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

export async function GET() {
    try {
        const connection = await mysql.createConnection(
            dbConfig
        );

        const [rows] = await connection.execute(`
      SELECT 
        id,
        client_id,
        client_name,
        accepted,
        accepted_date
      FROM \`design-agreement-client\`
      ORDER BY id DESC
    `);

        await connection.end();

        return NextResponse.json({
            agreements: rows,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to fetch agreements",
            },
            { status: 500 }
        );
    }
}