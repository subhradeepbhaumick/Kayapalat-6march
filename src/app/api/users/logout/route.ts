// import { NextResponse } from "next/server";

// export async function POST() {
//   // For JWT authentication, logout is handled client-side by removing token from localStorage
//   // No server-side action needed
//   return NextResponse.json({ message: "Logged out successfully" });
// }
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
  // For JWT authentication, logout is handled client-side by removing token from localStorage
  // No server-side action needed
  return NextResponse.json({ message: "Logged out successfully" });
}