import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();

    const file = data.get("file") as File;
    const dealerId = data.get("dealer_id") as string;
    const spaceType = data.get("space_type") as string;

    if (!file || !dealerId || !spaceType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Create filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop();

    const safeSpace = spaceType.replace(/\s+/g, "_");

    const fileName = `${dealerId}-${safeSpace}-${timestamp}.${ext}`;

    // ✅ Path (IMPORTANT)
    const uploadDir = path.join(
      process.cwd(),
      "public/agreement_company_signature"
    );

    // Create folder if not exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      filePath: `/agreement_company_signature/${fileName}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}