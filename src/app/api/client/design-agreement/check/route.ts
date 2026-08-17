import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { getToken } from "next-auth/jwt";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function GET(req: NextRequest) {
  let connection;

  try {
    const token: any = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { accepted: false },
        { status: 401 }
      );
    }

    // IMPORTANT
    const clientId =
      token.user_id ||
      token.client_id ||
      token.sub;

    if (!clientId) {
      return NextResponse.json(
        {
          accepted: false,
          message: "Client ID missing in token",
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    const [rows]: any = await connection.execute(
      `SELECT * FROM \`design-agreement-client\`
       WHERE client_id = ? AND accepted = 1
       LIMIT 1`,
      [clientId]
    );

    return NextResponse.json({
      accepted: rows.length > 0,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { accepted: false },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}