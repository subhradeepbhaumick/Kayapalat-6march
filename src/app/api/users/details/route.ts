import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token" },
        { status: 401 }
      );
    }

    const userId = token.user_id as string;

    const [users] = await executeQuery(
      "SELECT user_id, name, email, phone, role, profile_pic FROM users_kp_db WHERE user_id = ?",
      [userId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error("User details error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
