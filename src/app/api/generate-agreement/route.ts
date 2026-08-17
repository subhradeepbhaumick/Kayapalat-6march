import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mysql from "mysql2/promise";

export async function POST(req: NextRequest) {
  // ✅ AUTH CHECK
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealerId = token.sub;

  // ✅ GET DATA
  const { spaceLocation } = await req.json();

  // ✅ DB CONNECT
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // ✅ FETCH SPACE
  const [rows]: any = await connection.execute(
    `SELECT dealer_id FROM showroom_a WHERE space_type = ?`,
    [spaceLocation]
  );

  await connection.end();

  const space = rows[0];

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  // 🚫 SECURITY CHECK
  if (
    space.dealer_id &&
    space.dealer_id.toString() !== dealerId?.toString()
  ) {
    return NextResponse.json(
      {
        error:
          "This Space is purchased by other Brand. Kindly Contact to KAYAPALAT to discuss",
      },
      { status: 403 }
    );
  }

  // ✅ SUCCESS (NO CONTRACT HERE)
  return NextResponse.json({ success: true });
}