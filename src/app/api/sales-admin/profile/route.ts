import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check using NextAuth
    // --------------------------------------------------
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.user_id as string;
    const role = token.role as string;

    if (!userId || (role !== 'sales_admin' && role !== 'superadmin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch sales admin details from users_kp_db
    const [adminData]: any = await executeQuery(
      "SELECT user_id, name, email, phone, profile_pic, role FROM users_kp_db WHERE user_id = ? AND role IN ('sales_admin', 'superadmin')",
      [userId]
    );

    if (adminData.length === 0) {
      return NextResponse.json(
        { message: "Sales Admin not found" },
        { status: 404 }
      );
    }

    const admin = adminData[0];

    return NextResponse.json({
      admin: {
        id: admin.user_id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        profile_pic: admin.profile_pic || "/user.png",
      },
    });
  } catch (error: any) {
    console.error("SALES ADMIN PROFILE API ERROR:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
