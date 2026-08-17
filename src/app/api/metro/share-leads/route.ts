import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const role = token.role as string;
    const userId = token.user_id as string;

    // ============================================================
    // FETCH LEADS
    // ============================================================

    let leadsQuery = "";
    let leadsParams: any[] = [];

    // Superadmin and Metro Superadmin
    // can see ALL leads
    if (
      role === "superadmin" ||
      role === "metro-superadmin"
    ) {
      leadsQuery = `
        SELECT
          appointment_id,
          lead_id,
          client_name,
          client_phone,
          project_name,
          cold_call_status,
          created_at,
          admin_id
        FROM metro_property_visit
        ORDER BY created_at DESC
      `;

      leadsParams = [];
    } else {
      // Normal users only see their own assigned leads
      leadsQuery = `
        SELECT
          appointment_id,
          lead_id,
          client_name,
          client_phone,
          project_name,
          cold_call_status,
          created_at,
          admin_id
        FROM metro_property_visit
        WHERE admin_id = ?
        ORDER BY created_at DESC
      `;

      leadsParams = [userId];
    }

    const leadsResult: any = await executeQuery(
      leadsQuery,
      leadsParams
    );

    const leads = Array.isArray(leadsResult[0])
      ? leadsResult[0]
      : leadsResult;

    // ============================================================
    // FETCH METRO MANAGERS
    // ============================================================

    const metroManagersResult: any = await executeQuery(
      `
        SELECT
          user_id,
          name
        FROM users_kp_db
        WHERE role IN ('metro', 'metro-superadmin')
        ORDER BY name ASC
      `,
      []
    );

    const metroManagers = Array.isArray(
      metroManagersResult[0]
    )
      ? metroManagersResult[0]
      : metroManagersResult;

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      metroManagers,
      leads,
    });

  } catch (error) {
    console.error(
      "Error fetching metro leads:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}


// ============================================================
// PUT - SHARE / ASSIGN LEADS TO METRO MANAGER
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const role = token.role as string;

    // Only Superadmin / Metro Superadmin
    // should be allowed to share leads
    if (
      role !== "superadmin" &&
      role !== "metro-superadmin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to share leads.",
        },
        { status: 403 }
      );
    }

    const { appointmentIds, adminId } =
      await request.json();

    if (
      !Array.isArray(appointmentIds) ||
      appointmentIds.length === 0 ||
      !adminId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing data.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Verify selected manager exists
    // ------------------------------------------------------------

    const [managerRows] = await executeQuery(
      `
        SELECT user_id, name
        FROM users_kp_db
        WHERE user_id = ?
          AND role = 'metro'
        LIMIT 1
      `,
      [adminId]
    );

    if (
      !Array.isArray(managerRows) ||
      managerRows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected Metro Manager not found.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // Update selected leads
    // ------------------------------------------------------------

    const placeholders = appointmentIds
      .map(() => "?")
      .join(",");

    await executeQuery(
      `
        UPDATE metro_property_visit
        SET admin_id = ?
        WHERE appointment_id IN (${placeholders})
      `,
      [adminId, ...appointmentIds]
    );

    return NextResponse.json({
      success: true,
      message: "Leads shared successfully.",
    });

  } catch (error) {
    console.error(
      "Error sharing metro leads:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}