import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { executeQuery } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing token" },
        { status: 401 }
      );
    }
    const agent_id = token.user_id as string;

    if (!agent_id) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const accountHolderName = formData.get("accountHolderName") as string;
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const ifscCode = formData.get("ifscCode") as string;
    const upiId = formData.get("upiId") as string;
    const file = formData.get("upiQr") as unknown as File;

    if (!accountHolderName) {
      return NextResponse.json(
        { success: false, error: "Account holder name is required" },
        { status: 400 }
      );
    }

    // 🔥 QR Upload
    let qrPath = null;

    if (file && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}_${file.name}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "qr_codes");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      qrPath = `/uploads/qr_codes/${fileName}`;
    }

    // ⛔ REMOVED users_kp_db VALIDATION ⛔
    // Now it will insert even if user does not exist in users table

    // Check if bank details already exist
    const [existing]: any[] = await executeQuery(
      "SELECT agent_id FROM agent_bank_details WHERE agent_id = ?",
      [agent_id]
    );

    if (existing.length > 0) {
      console.log("Updating bank details for agent_id:", agent_id);

      const updateResult = await executeQuery(
        `UPDATE agent_bank_details SET
          account_holder_name = ?,
          bank_name = ?,
          account_number = ?,
          ifsc_code = ?,
          upi_id = ?,
          qr_code = ?,
          updated_at = NOW()
          WHERE agent_id = ?`,
        [
          accountHolderName,
          bankName,
          accountNumber,
          ifscCode,
          upiId,
          qrPath,
          agent_id,
        ]
      );

      console.log("Update result:", updateResult);
    } else {
      console.log("Inserting new bank details for agent_id:", agent_id);

      const insertResult = await executeQuery(
        `INSERT INTO agent_bank_details
          (agent_id, account_holder_name, bank_name, account_number, ifsc_code, upi_id, qr_code, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          agent_id,
          accountHolderName,
          bankName,
          accountNumber,
          ifscCode,
          upiId,
          qrPath,
        ]
      );

      console.log("Insert result:", insertResult);
    }

    return NextResponse.json({
      success: true,
      message: "Bank details saved successfully",
    });

  } catch (error: any) {
    console.error("Save bank details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing token" },
        { status: 401 }
      );
    }
    const agent_id = token.user_id as string;

    if (!agent_id) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const [existing]: any[] = await executeQuery(
      "SELECT * FROM agent_bank_details WHERE agent_id = ?",
      [agent_id]
    );

    if (existing.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No bank details found",
      });
    }

    const bankDetails = existing[0];
    return NextResponse.json({
      success: true,
      data: {
        agent_id: bankDetails.agent_id,
        accountHolderName: bankDetails.account_holder_name,
        bankName: bankDetails.bank_name,
        accountNumber: bankDetails.account_number,
        ifscCode: bankDetails.ifsc_code,
        upiId: bankDetails.upi_id,
        upiQr: bankDetails.qr_code,
      },
    });

  } catch (error: any) {
    console.error("Get bank details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing token" },
        { status: 401 }
      );
    }
    const agent_id = token.user_id as string;

    if (!agent_id) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const accountHolderName = formData.get("accountHolderName") as string;
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const ifscCode = formData.get("ifscCode") as string;
    const upiId = formData.get("upiId") as string;
    const file = formData.get("upiQr") as unknown as File;

    if (!accountHolderName) {
      return NextResponse.json(
        { success: false, error: "Account holder name is required" },
        { status: 400 }
      );
    }

    // Check if bank details exist
    const [existing]: any[] = await executeQuery(
      "SELECT * FROM agent_bank_details WHERE agent_id = ?",
      [agent_id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Bank details not found. Please create them first." },
        { status: 404 }
      );
    }

    // Handle QR upload if new file provided
    let qrPath = existing[0].qr_code; // Keep existing if no new file

    if (file && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}_${file.name}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "qr_codes");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      qrPath = `/uploads/qr_codes/${fileName}`;
    }

    // Update bank details
    const updateResult = await executeQuery(
      `UPDATE agent_bank_details SET
        account_holder_name = ?,
        bank_name = ?,
        account_number = ?,
        ifsc_code = ?,
        upi_id = ?,
        qr_code = ?,
        updated_at = NOW()
        WHERE agent_id = ?`,
      [
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        upiId,
        qrPath,
        agent_id,
      ]
    );

    console.log("Update result:", updateResult);

    return NextResponse.json({
      success: true,
      message: "Bank details updated successfully",
    });

  } catch (error: any) {
    console.error("Update bank details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
