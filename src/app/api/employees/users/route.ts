import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    if (!role) {
      return NextResponse.json(
        { error: "Role required" },
        { status: 400 }
      );
    }
    const [rows] = await pool.query(
      `
      SELECT
        user_id,
        name,
        role
      FROM users_kp_db
      WHERE role = ?
      ORDER BY name ASC
      `,
      [role]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}