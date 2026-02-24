import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: token.user_id,
        name: token.name,
        email: token.email,
        role: token.role,
        phone: token.phone,
        whatsapp: token.whatsapp,
      },
    });
  } catch (error) {
    console.error("Auth check failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
