import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let pdfPath = searchParams.get("path");

  if (!pdfPath) {
    return NextResponse.json({ error: "PDF path is required." }, { status: 400 });
  }

  const normalizedKey = pdfPath.startsWith("/")
    ? pdfPath.substring(1)
    : pdfPath;

  try {
    // 🔐 Optional: protect access (same as image API)
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = join(process.cwd(), "public", normalizedKey);

    try {
      const fileBuffer = await readFile(filePath);

      return new NextResponse(fileBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline", // 👈 open in browser
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (err) {
      console.error("PDF read error:", err);
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("PDF API error:", error);
    return NextResponse.json(
      { error: "Failed to load PDF", details: error.message },
      { status: 500 }
    );
  }
}