import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// ================= GET EMPLOYEES =================
export async function GET() {
    try {
        const [rows] = await pool.query(`
            SELECT 
                k.*,
                u.profile_pic AS profile_picture
            FROM kp_emp_details k
            LEFT JOIN users_kp_db u
            ON k.emp_id = u.user_id
            ORDER BY k.created_at DESC
        `);

        return NextResponse.json(rows);

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Failed to fetch employees" },
            { status: 500 }
        );
    }
}

// ================= ADD EMPLOYEE =================
export async function POST(req: NextRequest) {
    try {

        const formData = await req.formData();

        const emp_id = formData.get("emp_id") as string;
        const name = formData.get("name") as string;
        const job_details = formData.get("job_details") as string;
        const joining_date = formData.get("joining_date") as string;
        const resignation_date = formData.get("resignation_date") as string;
        const weekoff = formData.get("weekoff") as string;
        const emp_type = formData.get("emp_type") as string;
        const salary = formData.get("salary") as string;
        const login_time = formData.get("login_time") as string;
        const profile_picture =
            formData.get("profile_picture") as File | null;
        if (
            !emp_id ||
            !name ||
            !joining_date ||
            !emp_type ||
            !salary ||
            !login_time
        ) {
            return NextResponse.json(
                { error: "Required fields missing" },
                { status: 400 }
            );
        }

        // CHECK EXISTING
        const [existing]: any = await pool.query(
            `
            SELECT id
            FROM kp_emp_details
            WHERE emp_id = ?
            `,
            [emp_id]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: "Employee already exists" },
                { status: 400 }
            );
        }

        // FETCH USER
        const [userRows]: any = await pool.query(
            `
            SELECT email
            FROM users_kp_db
            WHERE user_id = ?
            LIMIT 1
            `,
            [emp_id]
        );

        if (userRows.length === 0) {
            return NextResponse.json(
                { error: "Employee user not found" },
                { status: 404 }
            );
        }

        const email = userRows[0].email;

        let profilePicPath = "";

        // SAVE IMAGE
        if (profile_picture && profile_picture.size > 0) {

            const bytes = await profile_picture.arrayBuffer();

            const buffer = Buffer.from(bytes);

            const fileName =
                `${Date.now()}-${profile_picture.name}`;

            const uploadDir = path.join(
                process.cwd(),
                "public/employee_dp"
            );

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, buffer);

            profilePicPath =
                `/employee_dp/${fileName}`;

            // UPDATE PROFILE PIC IN users_kp_db
            await pool.query(
                `
                UPDATE users_kp_db
                SET profile_pic = ?
                WHERE user_id = ?
                `,
                [profilePicPath, emp_id]
            );
        }

        // INSERT EMPLOYEE
        await pool.query(
            `
            INSERT INTO kp_emp_details
            (
                emp_id,
                name,
                email,
                job_details,
                joining_date,
                resignation_date,
                weekoff,
                emp_type,
                salary,
    login_time
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                emp_id,
                name,
                email,
                job_details || "",
                joining_date,
                resignation_date || null,
                weekoff,
                emp_type,
                salary,
                login_time
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Employee added successfully",
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            { error: "Failed to add employee" },
            { status: 500 }
        );
    }
}

// ================= UPDATE EMPLOYEE =================
export async function PUT(req: NextRequest) {

    try {

        const formData = await req.formData();
        const id = formData.get("id") as string;
        const emp_id = formData.get("emp_id") as string;
        const name = formData.get("name") as string;
        const job_details = formData.get("job_details") as string;
        const joining_date = formData.get("joining_date") as string;
        const resignation_date = formData.get("resignation_date") as string;
        const weekoff = formData.get("weekoff") as string;
        const emp_type = formData.get("emp_type") as string;
        const salary = formData.get("salary") as string;
        const login_time = formData.get("login_time") as string;
        const profile_picture =
            formData.get("profile_picture") as File | null;

        if (
            !id ||
            !emp_id ||
            !name ||
            !joining_date ||
            !emp_type ||
            !weekoff ||
            !salary ||
            !login_time
        ) {
            return NextResponse.json(
                { error: "Required fields missing" },
                { status: 400 }
            );
        }

        // UPDATE EMPLOYEE
        await pool.query(
            `
            UPDATE kp_emp_details
            SET
                emp_id = ?,
                name = ?,
                job_details = ?,
                joining_date = ?,
                resignation_date = ?,
                weekoff = ?,
                emp_type = ?,
                salary = ?,
                login_time = ?
            WHERE id = ?
            `,
            [
                emp_id,
                name,
                job_details || "",
                joining_date,
                resignation_date || null,
                weekoff,
                emp_type,
                salary,
                login_time,
                id,
            ]
        );

        // UPDATE PROFILE PIC
        if (profile_picture && profile_picture.size > 0) {

            const bytes = await profile_picture.arrayBuffer();

            const buffer = Buffer.from(bytes);

            const fileName =
                `${Date.now()}-${profile_picture.name}`;

            const uploadDir = path.join(
                process.cwd(),
                "public/employee_dp"
            );

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, buffer);

            const profilePicPath =
                `/employee_dp/${fileName}`;

            await pool.query(
                `
                UPDATE users_kp_db
                SET profile_pic = ?
                WHERE user_id = ?
                `,
                [profilePicPath, emp_id]
            );
        }

        return NextResponse.json({
            success: true,
            message: "Employee updated successfully",
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            { error: "Failed to update employee" },
            { status: 500 }
        );
    }
}