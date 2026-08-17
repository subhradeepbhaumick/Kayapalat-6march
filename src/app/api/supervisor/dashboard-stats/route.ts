import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const supervisor_id = (session.user as any).id;

    /* =========================
       TOTAL SITE VISITS
    ========================= */

    const [siteVisitRows]: any = await executeQuery(
      `
      SELECT COUNT(id) AS totalSiteVisits
      FROM supervisor_attendence
      WHERE supervisor_id = ?
      `,
      [supervisor_id]
    );

    /* =========================
       TOTAL HANDLED PROJECTS
    ========================= */

    const [projectRows]: any = await executeQuery(
      `
      SELECT COUNT(appointment_id) AS totalProjects
      FROM project_supervisor
      WHERE supervisor_id = ?
      `,
      [supervisor_id]
    );

    return NextResponse.json({
      totalSiteVisits: siteVisitRows[0]?.totalSiteVisits || 0,
      totalProjects: projectRows[0]?.totalProjects || 0,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch dashboard stats",
        error,
      },
      { status: 500 }
    );
  }
}