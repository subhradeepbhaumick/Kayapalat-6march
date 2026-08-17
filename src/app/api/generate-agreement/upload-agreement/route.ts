import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
const file = formData.get("file") as File;
const spaceType = formData.get("space_type") as string;

if (!file || !spaceType) {
  return NextResponse.json(
    { error: "File and space_type required" },
    { status: 400 }
  );
}

    // ✅ Generate filename with datetime
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

const safeSpaceType = spaceType
  .replace(/\s+/g, "_")        // spaces → _
  .replace(/[^\w\-]/g, "");    // remove special chars
    const fileName = `agreement_${safeSpaceType}_${timestamp}.pdf`;

    const uploadDir = path.join(process.cwd(), "public/display_agreement");

    // Ensure folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    fs.writeFileSync(filePath, buffer);

    // ✅ Save path to DB
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const publicPath = `/display_agreement/${fileName}`;

    await db.execute(`UPDATE showroom_a SET agreement = ? WHERE space_type = ?`,[publicPath, spaceType]);

    await db.end();

    return NextResponse.json({
      message: "Uploaded successfully",
      filePath: publicPath,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}