import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

/* =========================
GET TODAY ATTENDANCE
========================= */

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const supervisor_id = (session.user as any).id;

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        /* =========================
           GET FULL HISTORY
        ========================= */

        if (type === "history") {
            const [rows] = await executeQuery(
                `SELECT 
          id,
          checkin,
          checkout,
          picture,
          text,
          created_at
         FROM supervisor_attendence
         WHERE supervisor_id = ?
         ORDER BY created_at DESC`,
                [supervisor_id]
            );

            return NextResponse.json(rows);
        }

        /* =========================
           GET TODAY ATTENDANCE
        ========================= */

        const [rows] = await executeQuery(
            `SELECT *
       FROM supervisor_attendence
       WHERE supervisor_id = ?
       AND DATE(created_at) = CURDATE()
       LIMIT 1`,
            [supervisor_id]
        );

        return NextResponse.json((rows as any[])[0] || null);

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { message: "Error fetching attendance", error },
            { status: 500 }
        );
    }
}
/* =========================
CHECK IN
========================= */

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const supervisor_id = (session.user as any).id;

        const formData = await req.formData();

const checkin = formData.get("checkin")?.toString() || null;    
        const text = formData.get("text")?.toString() || null;
        const image = formData.get("image") as File | null;

        let picture: string | null = null;

        /* IMAGE UPLOAD */

        if (image && typeof image === "object" && image.size > 0) {
            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadDir = path.join(process.cwd(), "public/site_visit");

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const ext = image.name.split(".").pop();

            const fileName = `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2)}.${ext}`;

            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, buffer);

            picture = `/site_visit/${fileName}`;
        }

        await executeQuery(
            `INSERT INTO supervisor_attendence
      (supervisor_id, checkin, picture, text, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [
                supervisor_id,
                checkin,
                picture,
                text
            ]
        );

        return NextResponse.json({ message: "Check In saved" });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { message: "Check-in failed", error },
            { status: 500 }
        );
    }
}
/* =========================
CHECK OUT
========================= */

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const supervisor_id = (session.user as any).id;

        const body = await req.json();
const { checkout, id } = body;

        if (!id) {
            return NextResponse.json(
                { message: "Attendance ID required" },
                { status: 400 }
            );
        }

        await executeQuery(
            `UPDATE supervisor_attendence
       SET checkout = ?, updated_at = ?
       WHERE id = ? AND supervisor_id = ?`,
            [checkout, checkout, id, supervisor_id]
        );

        return NextResponse.json({ message: "Check Out saved" });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { message: "Checkout failed", error },
            { status: 500 }
        );
    }
}