import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
// GENERATE USER ID
async function generateUserId(
    connection: mysql.Connection,
    prefix: string
) {
    const [rows]: any = await connection.execute(
        `
      SELECT user_id
      FROM users_kp_db
      WHERE user_id LIKE ?
      ORDER BY user_id DESC
      LIMIT 1
    `,
        [`${prefix}%`]
    );
    if (rows.length === 0) {
        return `${prefix}001`;
    }
    const lastId = rows[0].user_id;
    const numberPart = lastId.replace(prefix, "");
    const lastNumber = parseInt(numberPart);
    const nextNumber = (lastNumber + 1)
        .toString()
        .padStart(3, "0");
    return `${prefix}${nextNumber}`;
}
export async function POST(req: NextRequest) {
    let connection;
    try {
        const formData = await req.formData();
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const whatsapp = formData.get("whatsapp") as string;
        const address = formData.get("address") as string;
        const password = formData.get("password") as string;
        const occupation = formData.get("department") as string;
        const file = formData.get(
            "profile_picture"
        ) as File | null;
        // =========================
        // MYSQL CONNECTION
        // =========================
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        // =========================
        // ROLE + PREFIX
        // =========================
        let role = "";
        let prefix = "";
        switch (occupation) {
            case "IT Professionals":
                role = "it";
                prefix = "IT";
                break;
            case "Digital Marketing":
            case "SEO Expert":
                role = "seo";
                prefix = "DM";
                break;
            case "Showroom Staff":
                role = "showroom_staff";
                prefix = "SS";
                break;
            case "Relationship Manager":
                role = "relationship_manager";
                prefix = "RM";
                break;
            case "Casual Staff":
                role = "casual_staff";
                prefix = "CS";
                break;
            case "Metro Sales Manager":
                role = "metro";
                prefix = "MSM";
                break;
            default:
                role = "staff";
                prefix = "EMP";
        }
        // =========================
        // GENERATE USER ID
        // =========================
        const user_id = await generateUserId(
            connection,
            prefix
        );
        // =========================
        // HASH PASSWORD
        // =========================
        const password_hash = await bcrypt.hash(
            password,
            10
        );
        // =========================
        // PROFILE PIC
        // =========================
        let profile_pic = "";
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uploadDir = path.join(
                process.cwd(),
                "public/employee_dp"
            );
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, {
                    recursive: true,
                });
            }
            const fileName =
                Date.now() +
                "-" +
                file.name.replace(/\s/g, "");
            const filePath = path.join(
                uploadDir,
                fileName
            );
            fs.writeFileSync(filePath, buffer);
            profile_pic = `/upemployee_dp/${fileName}`;
        }
        // =========================
        // CHECK EXISTING EMAIL
        // =========================
        const [existingUsers]: any = await connection.execute(
            `
    SELECT user_id
    FROM users_kp_db
    WHERE email = ?
    LIMIT 1
  `,
            [email]
        );
        if (existingUsers.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Email already exists. Please use another email.",
                },
                { status: 400 }
            );
        }
        // =========================
        // INSERT USER
        // =========================
        await connection.execute(
            `
      INSERT INTO users_kp_db
      (
        user_id,
        name,
        email,
        phone,
        whatsapp,
        profile_pic,
        password_hash,
        occupation,
        address,
        role,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
            [
                user_id,
                name,
                email,
                phone,
                whatsapp || null,
                profile_pic || null,
                password_hash,
                occupation,
                address || null,
                role,
            ]
        );
        return NextResponse.json({
            success: true,
            message: "Employee Added Successfully",
            user_id,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}