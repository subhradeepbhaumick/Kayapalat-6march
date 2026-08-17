import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// ==========================================
// GET ALL VENDORS
// ==========================================

export async function GET() {
    try {
        const [vendors]: any = await db.execute(`
            SELECT
                user_id,
                name AS vendor_name,
                email,
                phone,
                occupation AS company_name,
                profile_pic
            FROM users_kp_db
            WHERE role='vendor'
            ORDER BY created_at DESC
        `);

        return NextResponse.json({
            vendors,
        });
    } catch (err) {
        console.log(err);

        return NextResponse.json(
            {
                error: "Failed to fetch vendors",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================
// ADD VENDOR
// ==========================================

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const vendor_name = formData.get("vendor_name") as string;

        const email = formData.get("email") as string;

        const phone = formData.get("phone") as string;

        const company_name = formData.get("company_name") as string;

        const address = formData.get("address") as string;

        const password = formData.get("password") as string;

        // CHECK EXISTING EMAIL

        const [existing]: any = await db.execute(
            `
            SELECT user_id
            FROM users_kp_db
            WHERE email=?
        `,
            [email]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                {
                    error: "Email already exists",
                },
                {
                    status: 400,
                }
            );
        }

        // GENERATE USER ID
        // ==========================================
        // GENERATE NEXT VENDOR ID
        // ==========================================

        const [lastVendor]: any = await db.execute(`
    SELECT user_id
    FROM users_kp_db
    WHERE user_id LIKE 'V%'
    ORDER BY CAST(SUBSTRING(user_id, 2) AS UNSIGNED) DESC
    LIMIT 1
`);

        let user_id = "V001";

        if (lastVendor.length > 0) {
            const lastId = lastVendor[0].user_id;

            const numericPart = parseInt(lastId.substring(1));

            const nextNumber = numericPart + 1;

            user_id = `V${String(nextNumber).padStart(3, "0")}`;
        }

        // HASH PASSWORD

        const password_hash = await bcrypt.hash(password, 10);

        // INSERT VENDOR

        await db.execute(
            `
            INSERT INTO users_kp_db
            (
                user_id,
                name,
                email,
                phone,
                occupation,
                address,
                password_hash,
                role
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
        `,
            [
                user_id,
                vendor_name,
                email,
                phone,
                company_name,
                address,
                password_hash,
                "vendor",
            ]
        );

        return NextResponse.json({
            message: "Vendor added successfully",
            user_id,
        });
    } catch (err) {
        console.log(err);

        return NextResponse.json(
            {
                error: "Failed to add vendor",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================
// UPDATE VENDOR
// ==========================================

export async function PUT(req: NextRequest) {
    try {
        const formData = await req.formData();

        const user_id = formData.get("user_id") as string;

        const vendor_name = formData.get("vendor_name") as string;

        const email = formData.get("email") as string;

        const phone = formData.get("phone") as string;

        const company_name = formData.get("company_name") as string;

        const address = formData.get("address") as string;

        const password = formData.get("password") as string;

        // UPDATE WITH PASSWORD

        if (password && password.trim() !== "") {
            const password_hash = await bcrypt.hash(password, 10);

            await db.execute(
                `
                UPDATE users_kp_db
                SET
                    name=?,
                    email=?,
                    phone=?,
                    occupation=?,
                    address=?,
                    password_hash=?
                WHERE user_id=?
            `,
                [
                    vendor_name,
                    email,
                    phone,
                    company_name,
                    address,
                    password_hash,
                    user_id,
                ]
            );
        }

        // UPDATE WITHOUT PASSWORD

        else {
            await db.execute(
                `
                UPDATE users_kp_db
                SET
                    name=?,
                    email=?,
                    phone=?,
                    occupation=?,
                    address=?
                WHERE user_id=?
            `,
                [
                    vendor_name,
                    email,
                    phone,
                    company_name,
                    address,
                    user_id,
                ]
            );
        }

        return NextResponse.json({
            message: "Vendor updated successfully",
        });
    } catch (err) {
        console.log(err);

        return NextResponse.json(
            {
                error: "Failed to update vendor",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================
// DELETE VENDOR
// ==========================================

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const user_id = searchParams.get("user_id");

        await db.execute(
            `
            DELETE FROM users_kp_db
            WHERE user_id=?
        `,
            [user_id]
        );

        return NextResponse.json({
            message: "Vendor deleted successfully",
        });
    } catch (err) {
        console.log(err);

        return NextResponse.json(
            {
                error: "Failed to delete vendor",
            },
            {
                status: 500,
            }
        );
    }
}