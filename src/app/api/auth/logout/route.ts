import { NextResponse } from "next/server";

export async function GET() {
  // Clear the token cookie
  const res = NextResponse.redirect("/login"); // redirect to login page
  res.cookies.set("token", "", {
    path: "/",
    expires: new Date(0), // expire immediately
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  return res;
}
export async function POST() {
  // Clear the token cookie for complete logout
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set("token", "", {
    path: "/",
    expires: new Date(0), // expire immediately
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  return res;
}
