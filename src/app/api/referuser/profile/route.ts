import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { executeQuery, pool } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check using NextAuth
    // --------------------------------------------------
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    console.log('Profile GET token:', token);
    if (!token) {
      console.log('No token found in request');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.user_id as string;
    const role = token.role as string;
    console.log('Profile GET userId:', userId, 'role:', role);

    if (!userId || role !== 'referuser') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch referuser details from users_kp_db
    const [userData]: any = await executeQuery(
      "SELECT user_id, name, email, phone, profile_pic, role FROM users_kp_db WHERE user_id = ? AND role = 'referuser'",
      [userId]
    );

    if (userData.length === 0) {
      return NextResponse.json(
        { message: "Referuser not found" },
        { status: 404 }
      );
    }

    const user = userData[0];

    // Fetch agent details from agents table
    const [agentData]: any = await executeQuery(
      "SELECT agent_id, agent_name, email, phone, whatsapp, address, occupation, admin_id, profile_pic FROM agents WHERE agent_id = ?",
      [userId]
    );

    const agent = agentData.length > 0 ? agentData[0] : null;

    console.log('User profile_pic:', user.profile_pic);
    console.log('Agent profilePic:', agent?.profile_pic);

    return NextResponse.json({
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_pic: user.profile_pic || "/user.png",
      },
      agent: agent ? {
        agent_id: agent.agent_id,
        name: agent.agent_name,
        email: agent.email,
        phone: agent.phone,
        whatsapp: agent.whatsapp,
        address: agent.address,
        occupation: agent.occupation,
        representativeId: agent.admin_id,
        profilePic: agent.profile_pic,
      } : null,
    });
  } catch (error: any) {
    console.error("REFERUSER PROFILE API ERROR:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user_id = token.user_id as string;

    if (!user_id) {
      return NextResponse.json(
        { message: "Invalid token: no user_id" },
        { status: 400 }
      );
    }

    // Parse FormData for file upload
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const address = formData.get('address') as string;
    const occupation = formData.get('occupation') as string;
    let representativeId = formData.get('representativeId') as string;
    const profilePicFile = formData.get('profilePic') as File | null;

    // Ensure representativeId has a value
    representativeId = representativeId || user_id;

    // Validate required fields
    if (!name || !email || !phone || !whatsapp || !address || !occupation || !representativeId) {
      return NextResponse.json(
        { message: "All profile fields are required" },
        { status: 400 }
      );
    }

    let profilePicPath: string | null = null;

    // Handle file upload if present
    if (profilePicFile && profilePicFile.size > 0) {
      // Ensure the directory exists
      const uploadDir = join(process.cwd(), 'public', 'profileDP');
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const fileExtension = profilePicFile.name.split('.').pop();
      const fileName = `${user_id}_${Date.now()}.${fileExtension}`;
      const filePath = join(uploadDir, fileName);

      // Convert file to buffer and save
      const bytes = await profilePicFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Set the relative path for database
      profilePicPath = `/profileDP/${fileName}`;
    }

    // Update both tables using transaction
    const connection = await pool.getConnection();

    try {
      await connection.query('START TRANSACTION');

      // Update agents table
      let updateAgentsQuery = `
        UPDATE agents
        SET agent_name = ?, email = ?, phone = ?, whatsapp = ?, address = ?, occupation = ?, admin_id = ?
      `;
      const params = [name, email, phone, whatsapp, address, occupation, representativeId];

      if (profilePicPath) {
        updateAgentsQuery += `, profile_pic = ?`;
        params.push(profilePicPath);
      }

      updateAgentsQuery += ` WHERE agent_id = ?`;
      params.push(user_id);

      await connection.execute(updateAgentsQuery, params);

      // Update users_kp_db table
      const updateUsersQuery = `
        UPDATE users_kp_db
        SET name = ?, email = ?, phone = ?, whatsapp = ?, address = ?, occupation = ?
        WHERE user_id = ?
      `;
      await connection.execute(updateUsersQuery, [name, email, phone, whatsapp, address, occupation, user_id]);

      await connection.query('COMMIT');

      return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error("PROFILE UPDATE API ERROR:", err.message);

    if (err.name === "JsonWebTokenError") {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
