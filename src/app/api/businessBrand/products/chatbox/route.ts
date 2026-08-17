import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { executeQuery } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

// ==========================
// GET CHAT MESSAGES
// ==========================
export async function GET(req: NextRequest) {
    try {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token || !token.user_id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);

        const product_id = searchParams.get("product_id");

        if (!product_id) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        const [messages] = await executeQuery(
            `
      SELECT *
      FROM kp_dealer_chatbox
      WHERE product_id = ?
      ORDER BY created_at ASC
      `,
            [product_id]
        );

        return NextResponse.json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error("GET CHAT ERROR:", error);

        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

// ==========================
// SEND MESSAGE
// ==========================
export async function POST(req: NextRequest) {
    try {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token || !token.user_id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const sender_id = token.user_id;

        const formData = await req.formData();

        const product_id = formData.get("product_id") as string;
        const message = formData.get("message") as string;
        const image = formData.get("image") as File | null;

        if (!product_id) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        // ==========================
        // FETCH DEALER ID
        // ==========================

        const [productResult] = await executeQuery(
            `
      SELECT dealer_id
      FROM product_details
      WHERE product_id = ?
      `,
            [product_id]
        );

        if (!productResult || productResult.length === 0) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        const dealer_id = productResult[0].dealer_id;

        let image_url = null;

        // ==========================
        // IMAGE UPLOAD
        // ==========================

        if (image && image.size > 0) {
            const uploadDir = path.join(
                process.cwd(),
                "public/site_issues_chat"
            );

            await fs.mkdir(uploadDir, { recursive: true });

            const extension = path.extname(image.name);

            const fileName = `chat_${Date.now()}${extension}`;

            const filePath = path.join(uploadDir, fileName);

            const buffer = Buffer.from(await image.arrayBuffer());

            await fs.writeFile(filePath, buffer);

            image_url = `/site_issues_chat/${fileName}`;
        }

        // ==========================
        // INSERT MESSAGE
        // ==========================

        await executeQuery(
            `
      INSERT INTO kp_dealer_chatbox
      (
        product_id,
        dealer_id,
        sender_id,
        message,
        image_url,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'))
      `,
            [
                product_id,
                dealer_id,
                sender_id,
                message || null,
                image_url,
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Message sent successfully",
        });
    } catch (error) {
        console.error("SEND CHAT ERROR:", error);

        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}