import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check role
    if (session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch attendance
    const attendance = await executeQuery(`
      SELECT 
        id,
        supervisor_id,
        checkin,
        checkout,
        picture,
        text,
        created_at,
        updated_at
      FROM supervisor_attendence
      ORDER BY checkin DESC
    `);

    // ✅ DEBUG LOG
    console.log("Supervisor Attendance Data:", attendance);
    const rows = (attendance as any)[0];
    return NextResponse.json({ attendance: rows || [] });
  } catch (error) {
    console.error("Error fetching attendance:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}