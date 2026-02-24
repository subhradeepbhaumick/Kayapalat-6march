import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await executeQuery(`
      SELECT 
        ps.id,
        ps.appointment_id,
        ps.supervisor_id,
        u.name as supervisor_name,
        u.profile_pic
      FROM project_supervisor ps
      LEFT JOIN users_kp_db u ON ps.supervisor_id = u.user_id
    `);

    const assignments: Record<string, any[]> = {};
    rows.forEach((row: any) => {
      if (!assignments[row.appointment_id]) {
        assignments[row.appointment_id] = [];
      }
      assignments[row.appointment_id].push({
        id: row.id,
        supervisor_id: row.supervisor_id,
        supervisor_name: row.supervisor_name,
        profile_pic: row.profile_pic || '/placeholder_person.jpg'
      });
    });

    return NextResponse.json({ assignments }, { status: 200 });
  } catch (error) {
    console.error("FETCH ASSIGNMENTS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointment_id, supervisor_id, total_budget } = body;

    if (!appointment_id || !supervisor_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if already assigned
    const [existing] = await executeQuery(
      "SELECT id FROM project_supervisor WHERE appointment_id = ? AND supervisor_id = ?",
      [appointment_id, supervisor_id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: "Supervisor already assigned" }, { status: 400 });
    }

    const [result]: any = await executeQuery(
      `INSERT INTO project_supervisor (appointment_id, supervisor_id, total_budget, progress, created_at) VALUES (?, ?, ?, '0', NOW())`,
      [appointment_id, supervisor_id, total_budget || '0']
    );

    return NextResponse.json({ 
      message: "Assigned successfully", 
      assignment: { id: result.insertId } 
    }, { status: 201 });

  } catch (error) {
    console.error("ASSIGN SUPERVISOR ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await executeQuery("DELETE FROM project_supervisor WHERE id = ?", [id]);

    return NextResponse.json({ message: "Removed successfully" }, { status: 200 });
  } catch (error) {
    console.error("REMOVE SUPERVISOR ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}