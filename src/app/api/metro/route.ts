import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    let connection;

    try {
        const body = await req.json();

        const {
            client_name,
            client_email,
            client_phone,
            client_whatsapp,
            client_location,
            occupation,
            password,
        } = body;

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // Email check
        const [emailRows]: any = await connection.execute(
            `SELECT user_id FROM users_kp_db WHERE email=? AND role = 'metro_client' LIMIT 1`,
            [client_email]
        );

        if (emailRows.length > 0) {
            return NextResponse.json(
                { success: false, message: "Email already exists in database of Metro Clients" },
                { status: 400 }
            );
        }

        // Phone check
        const [phoneRows]: any = await connection.execute(
            `SELECT user_id FROM users_kp_db WHERE phone=? AND role = 'metro_client' LIMIT 1`,
            [client_phone]
        );

        if (phoneRows.length > 0) {
            return NextResponse.json(
                { success: false, message: "Phone already exists in database of Metro Clients" },
                { status: 400 }
            );
        }

        // Last Metro Client
        const [lastRows]: any = await connection.execute(`
            SELECT user_id
            FROM users_kp_db
            WHERE role='metro_client'
            ORDER BY CAST(SUBSTRING(user_id,3) AS UNSIGNED) DESC
            LIMIT 1
        `);

        let nextNumber = 1;

        if (lastRows.length > 0) {
            nextNumber =
                parseInt(lastRows[0].user_id.replace("MC", "")) + 1;
        }

        const user_id = `MC${String(nextNumber).padStart(3, "0")}`;

        const password_hash = await bcrypt.hash(password, 10);

        await connection.execute(
            `
            INSERT INTO users_kp_db
            (
                user_id,
                name,
                email,
                phone,
                whatsapp,
                password_hash,
                occupation,
                address,
                role
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                user_id,
                client_name,
                client_email,
                client_phone,
                client_whatsapp || null,
                password_hash,
                occupation || null,
                client_location || null,
                "metro_client",
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Lead added successfully",
            user_id,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Server error",
            },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
export async function GET() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows]: any = await connection.execute(`
            SELECT
                user_id,
                name,
                email,
                phone,
                whatsapp,
                occupation,
                address,
                created_at
            FROM users_kp_db
            WHERE role = 'metro_client'
            ORDER BY created_at DESC
        `);

        return NextResponse.json({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch metro clients",
            },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
export async function PUT(req: NextRequest) {
    let connection;

    try {
        const body = await req.json();

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        let password_hash = null;

        if (body.password && body.password.trim() !== "") {
            password_hash = await bcrypt.hash(body.password, 10);
        }

        if (password_hash) {
            await connection.execute(
                `
                UPDATE users_kp_db
                SET
                    name=?,
                    email=?,
                    phone=?,
                    whatsapp=?,
                    occupation=?,
                    address=?,
                    password_hash=?
                WHERE user_id=?
                `,
                [
                    body.name,
                    body.email,
                    body.phone,
                    body.whatsapp,
                    body.occupation,
                    body.address,
                    password_hash,
                    body.user_id,
                ]
            );
        } else {
            await connection.execute(
                `
                UPDATE users_kp_db
                SET
                    name=?,
                    email=?,
                    phone=?,
                    whatsapp=?,
                    occupation=?,
                    address=?
                WHERE user_id=?
                `,
                [
                    body.name,
                    body.email,
                    body.phone,
                    body.whatsapp,
                    body.occupation,
                    body.address,
                    body.user_id,
                ]
            );
        }

        return NextResponse.json({
            success: true,
            message: "Lead updated successfully",
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Server error",
            },
            { status: 500 }
        );
    } finally {
        if (connection) await connection.end();
    }
}