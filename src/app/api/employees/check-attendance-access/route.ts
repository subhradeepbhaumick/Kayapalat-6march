// app/api/employee/check-attendance-access/route.ts
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
        {
          exists: false,
          message: "Employee ID is required",
        },
        { status: 400 }
      );
    }
    connection = await mysql.createConnection(dbConfig);
    // CHECK EMPLOYEE EXISTENCE
    const [rows]: any = await connection.execute(
      `
      SELECT 
        emp_id,
        name,
        emp_type,
        salary
      FROM kp_emp_details
      WHERE emp_id = ?
      LIMIT 1
      `,
      [emp_id]
    );
    if (rows.length === 0) {
      return NextResponse.json(
        {
          exists: false,
          message: "Employee not found",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        exists: true,
        employee: rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CHECK ATTENDANCE ACCESS API ERROR:", error);
    return NextResponse.json(
      {
        exists: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}