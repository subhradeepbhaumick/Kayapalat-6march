import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
function getISTDate(): string {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(ist.getDate()).padStart(2, "0")}`;
}
export async function GET() {
  try {
    const today = getISTDate();
    const result = await executeQuery(
      `
      SELECT
          u.user_id,
          u.name,
          COUNT(DISTINCT p.appointment_id) AS total_count
      FROM users_kp_db u
      LEFT JOIN projects p
      ON p.admin_id = u.user_id
      AND (
          (
              p.cold_call_date = ?
              AND p.cold_call_status IN (
                  'Not Show',
                  'Booked Somewhere Else',
                  'Interested',
                  'Prospect',
                  'Responding',
                  'Confirmed'
              )
          )
          OR
          (
              p.site_visit_date = ?
              AND p.site_visit_status IN (
                  'Not Show',
                  'Booked Somewhere Else',
                  'Interested',
                  'Prospect',
                  'Responding',
                  'Confirmed'
              )
          )
          OR
          (
              p.booking_date = ?
              AND p.booking_status IN (
                  'Not Show',
                  'Booked Somewhere Else',
                  'Booked',
                  'Interested',
                  'Prospect',
                  'Responding'
              )
          )
      )
      WHERE u.role='sales_admin'
      GROUP BY u.user_id,u.name
      ORDER BY u.name;
      `,
      [today, today, today]
    );
const data = (result as any[]).map((r) => ({
  emp_id: r.user_id,
  name: r.name,
  total_count: Number(r.total_count || 0),
}));
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}