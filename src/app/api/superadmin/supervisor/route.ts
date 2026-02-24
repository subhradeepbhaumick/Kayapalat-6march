import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { executeQuery } from "@/lib/db";
import fs from "fs";
import path from "path";

/* ---------------------------------------------
   Helper: Save uploaded profile picture
---------------------------------------------- */
async function saveProfilePic(file: File, filePrefix: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${filePrefix}_${Date.now()}_${file.name}`;
  const filePath = path.join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return `/uploads/profiles/${fileName}`;
}

/* ---------------------------------------------
   POST — CREATE NEW SUPERVISOR
---------------------------------------------- */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const address = formData.get("address") as string;
    const password = formData.get("password") as string;
    const profilePicFile = formData.get("profilePic") as File;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, Email & Password are required" },
        { status: 400 }
      );
    }

    // Fetch existing supervisor IDs
    const [allUsers] = await executeQuery("SELECT user_id FROM users_kp_db");
    const existingIds = new Set(
      allUsers.map((u: any) => u.user_id || u.USER_ID || u.User_id)
    );

    // Generate unique SV-number
    let counter = 1;
    let userId: string;
    do {
      userId = `SV${counter}`;
      counter++;
    } while (existingIds.has(userId));

    const passwordHash = await bcrypt.hash(password, 10);

    // Profile upload
    let profilePicPath = null;
    if (profilePicFile && profilePicFile.size > 0) {
      profilePicPath = await saveProfilePic(profilePicFile, userId);
    }

    await executeQuery(
      `
      INSERT INTO users_kp_db
      (user_id, name, email, phone, whatsapp, password_hash, address, profile_pic, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'supervisor')
      `,
      [
        userId,
        name,
        email,
        phone || null,
        whatsapp || null,
        passwordHash,
        address || null,
        profilePicPath,
      ]
    );

    return NextResponse.json(
      { message: "Supervisor created successfully", user_id: userId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CREATE SUPERVISOR ERROR:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Duplicate user_id, try again" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Server error while creating supervisor" },
      { status: 500 }
    );
  }
}

/* ---------------------------------------------
   PUT — UPDATE SUPERVISOR
---------------------------------------------- */
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();

    const user_id = formData.get("user_id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const address = formData.get("address") as string;
    const password = formData.get("password") as string;
    const profilePicFile = formData.get("profilePic") as File;

    if (!user_id || !name || !email) {
      return NextResponse.json(
        { error: "User ID, Name & Email are required" },
        { status: 400 }
      );
    }

    // Check user
    const [existingUser] = await executeQuery(
      "SELECT * FROM users_kp_db WHERE user_id = ?",
      [user_id]
    );

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "Supervisor not found" }, { status: 404 });
    }

    let profilePicPath = null;
    if (profilePicFile && profilePicFile.size > 0) {
      profilePicPath = await saveProfilePic(profilePicFile, user_id);
    }

    let updateFields = `name = ?, email = ?, phone = ?, whatsapp = ?, address = ?`;
    let updateValues = [
      name,
      email,
      phone || null,
      whatsapp || null,
      address || null,
    ];

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields += ", password_hash = ?";
      updateValues.push(passwordHash);
    }

    if (profilePicPath) {
      updateFields += ", profile_pic = ?";
      updateValues.push(profilePicPath);
    }

    updateValues.push(user_id);

    await executeQuery(

      `UPDATE users_kp_db SET ${updateFields} WHERE user_id = ?`,

      updateValues

    );

    return NextResponse.json(

      { message: "Supervisor updated successfully" },

      { status: 200 }

    );
  } catch (error) {
    console.error("UPDATE SUPERVISOR ERROR:", error);
    return NextResponse.json(
      { error: "Server error while updating supervisor" },
      { status: 500 }
    );
  }
}

/* ---------------------------------------------
   GET — FETCH ALL SUPERVISORS AND PROJECTS
---------------------------------------------- */
export async function GET() {
  try {
    // Fetch all supervisors
    const [supervisors] = await executeQuery(`
      SELECT user_id, name, email, phone, profile_pic
      FROM users_kp_db
      WHERE role = 'supervisor'
      ORDER BY user_id DESC
    `);
    
    // Fetch all projects and join with supervisors
    const [projects] = await executeQuery(`
      SELECT 
        p.appointment_id,
        p.project_name,
        p.project_value
      FROM projects p
      WHERE p.booking_status = 'Booked'
      ORDER BY p.created_at DESC
    `);

    const projectAllotments = projects.map((p: any) => ({
      id: p.appointment_id,
      appointment_id: p.appointment_id,
      project_name: p.project_name,
      project_value: p.project_value,
      supervisor_id: null,
      supervisor_name: null,
    }));

    return NextResponse.json({ supervisors, projects: projectAllotments }, { status: 200 });
  } catch (error) {
    console.error("FETCH SUPERVISORS/PROJECTS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
