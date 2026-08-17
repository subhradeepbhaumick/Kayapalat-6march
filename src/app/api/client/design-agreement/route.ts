import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { getToken } from "next-auth/jwt";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function POST(req: NextRequest) {
  let connection;

  try {
    const token: any = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { client_name } = body;

    if (!client_name) {
      return NextResponse.json(
        { message: "Client name required" },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // check existing
    const [existing]: any = await connection.execute(
      `SELECT * FROM \`design-agreement-client\`
       WHERE client_id = ?`,
      [token.user_id]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
      });
    }

    await connection.execute(
      `INSERT INTO \`design-agreement-client\`
      (client_id, client_name, accepted, accepted_date)
      VALUES (?, ?, ?, NOW())`,
      [token.user_id, client_name, 1]
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}