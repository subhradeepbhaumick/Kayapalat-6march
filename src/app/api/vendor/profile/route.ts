import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function PUT(request: NextRequest) {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token || !token.sub) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();

        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const whatsapp = formData.get("whatsapp") as string;

        const profileImage = formData.get(
            "profileImage"
        ) as File | null;

        let imagePath = "";

        // =========================
        // IMAGE SAVE
        // =========================
        if (profileImage && profileImage.size > 0) {
            const bytes = await profileImage.arrayBuffer();

            const buffer = Buffer.from(bytes);

            // extension
            const ext = profileImage.name.split(".").pop();

            // unique filename
            const fileName = `${token.sub}_${Date.now()}.${ext}`;

            // public/profileDP
            const uploadDir = path.join(
                process.cwd(),
                "public",
                "profileDP"
            );

            // create folder if not exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, {
                    recursive: true,
                });
            }

            // final path
            const filePath = path.join(
                uploadDir,
                fileName
            );

            // save file
            fs.writeFileSync(filePath, buffer);

            // db path
            imagePath = `/profileDP/${fileName}`;
        }

        // =========================
        // UPDATE USER
        // =========================
        if (imagePath) {
            await db.query(
                `
                UPDATE users_kp_db
                SET
                    name = ?,
                    phone = ?,
                    whatsapp = ?,
                    profile_pic = ?
                WHERE user_id = ?
                `,
                [
                    name,
                    phone,
                    whatsapp,
                    imagePath,
                    token.sub,
                ]
            );
        } else {
            await db.query(
                `
                UPDATE users_kp_db
                SET
                    name = ?,
                    phone = ?,
                    whatsapp = ?
                WHERE user_id = ?
                `,
                [
                    name,
                    phone,
                    whatsapp,
                    token.sub,
                ]
            );
        }

        // =========================
        // FETCH UPDATED USER
        // =========================
        const user = await db.query(
            `
            SELECT
                user_id as id,
                name,
                email,
                phone,
                whatsapp,
                profile_pic
            FROM users_kp_db
            WHERE user_id = ?
            `,
            [token.sub]
        );

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}