import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
// import { sendEmail } from '@/helpers/mailer';

// Generate next user_id based on role
// async function generateUserId(prefix: string) {
//   const query = `
//     SELECT user_id 
//     FROM users_kp_db
//     WHERE user_id LIKE '${prefix}%'
//     ORDER BY user_id DESC
//     LIMIT 1
//   `;

//   const [rows] = await executeQuery(query);

//   if (rows.length === 0) {
//     return prefix + "001";
//   }

//   const lastId = rows[0].user_id; // Example: R015
//   const lastNumber = parseInt(lastId.substring(1)); // → 15
//   const nextNumber = (lastNumber + 1).toString().padStart(3, "0");

//   return prefix + nextNumber; // → R016
// }
async function generateUserId(prefix: string) {
  const query = `
    SELECT user_id
    FROM users_kp_db
    WHERE user_id LIKE '${prefix}%'
    ORDER BY user_id DESC
    LIMIT 1
  `;

  const [rows] = await executeQuery(query);

  if (rows.length === 0) {
    return prefix + "001";
  }

  const lastId = rows[0].user_id;

  // Works for R001, C001, MC001, etc.
  const lastNumber = parseInt(lastId.substring(prefix.length));

  const nextNumber = (lastNumber + 1)
    .toString()
    .padStart(3, "0");

  return prefix + nextNumber;
}
export async function POST(req: NextRequest) {
  try {
    const reqBody = await req.json();
    const {
      full_name,
      email,
      password,
      phone,
      whatsapp,
      address,
      occupation,
      role,
      admin_id  // add admin_id from request body, optional
    } = reqBody;

    // -------------------------------
    // 1. VALIDATIONS
    // -------------------------------

    if (!full_name || !email || !password || !phone || !role) {
      return NextResponse.json(
        { error: "⚠️ Required fields missing." },
        { status: 400 }
      );
    }

    // Block signup for special accounts
    if (['superadmin', 'sales_admin'].includes(role)) {
      return NextResponse.json(
        { error: "❌ You are not allowed to signup. Contact SuperAdmin." },
        { status: 403 }
      );
    }

    // Email validation
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "❗ Invalid email format — must contain @." },
        { status: 400 }
      );
    }

    // Phone validation: 10 digits
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "❗ Phone number must be exactly 10 digits." },
        { status: 400 }
      );
    }

    // WhatsApp validation
    if (whatsapp && !/^\d{10}$/.test(whatsapp)) {
      return NextResponse.json(
        { error: "❗ WhatsApp number must be exactly 10 digits." },
        { status: 400 }
      );
    }

    // -------------------------------
    // 2. CHECK FOR EXISTING USER
    // -------------------------------
    const [existing] = await executeQuery(
      "SELECT * FROM users_kp_db WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Email is already in our database. Kindly use another regular email id" },
        { status: 400 }
      );
    }

    // -------------------------------
    // 3. PASSWORD HASH
    // -------------------------------
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // -------------------------------
    // 4. AUTO USER ID GENERATION
    // -------------------------------

    let prefix = "";

    // if (role === "referuser") prefix = "R";
    // if (role === "client") prefix = "C";
    // if (role === "designer") prefix = "D";
    // if (role === "sales_admin") prefix = "S";
    // if (role === "superadmin") prefix = "O";
    // if (role === "businessBrand") prefix = "B";
    // if (role === "vendor") prefix = "V";
    // if (role === "metro_client") prefix = "MC";
if (role === "referuser") prefix = "R";
else if (role === "client") prefix = "C";
else if (role === "designer") prefix = "D";
else if (role === "sales_admin") prefix = "S";
else if (role === "superadmin") prefix = "O";
else if (role === "businessBrand") prefix = "B";
else if (role === "vendor") prefix = "V";
else if (role === "metro_client") prefix = "MC";

    const user_id = await generateUserId(prefix);

    // const fullName = `full_name`;

    // -------------------------------
    // 5. INSERT USER WITH TRANSACTION
    // -------------------------------

    console.log("🔄 Starting database transaction for user:", user_id);

    const { pool } = require('@/lib/db');
    const connection = await pool.getConnection();

    try {
      await connection.query('START TRANSACTION');
      console.log("🔄 Transaction started");

      // Insert into users_kp_db
      const insertQuery = `
        INSERT INTO users_kp_db
        (user_id, name, email, phone, whatsapp, password_hash, occupation, address, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const params = [
        user_id,
        full_name,
        email,
        phone,
        whatsapp || null,
        hashedPassword,
        occupation || null,
        address || null,
        role
      ];

      console.log("🔄 Executing users_kp_db insert with params:", params);
      const [usersResult] = await connection.execute(insertQuery, params);
      console.log("✅ Inserted into users_kp_db:", user_id, "Result:", usersResult);

      // If user is referuser → also insert into agents table
      if (role === "referuser") {
        const agentsQuery = `
          INSERT INTO agents
          (agent_id, admin_id, agent_name, phone, whatsapp, address, password_hash, occupation, email, profile_pic)
          VALUES (?, "S1", ?, ?, ?, ?, ?, ?, ?, NULL)
        `;
        const agentsParams = [user_id, full_name, phone, whatsapp, address, hashedPassword, occupation, email];

        console.log("🔄 Executing agents insert with params:", agentsParams);
        const [agentsResult] = await connection.execute(agentsQuery, agentsParams);
        console.log("✅ Inserted into agents table:", user_id, "Result:", agentsResult);
      }

      // If user is businessBrand → also insert into manufacturer table
      if (role === "businessBrand") {
        const manufacturerQuery = `
          INSERT INTO manufacturer
          (dealer_id, company_logo, user_name, phone, whatsapp, email, company_name, owner_name, address, gstin, pan, tan, password_hash, created_at)
          VALUES (?, NULL, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, NULL, ?, NOW())
        `;
        const manufacturerParams = [user_id, full_name, phone, whatsapp, email, address, hashedPassword];

        console.log("🔄 Executing manufacturer insert with params:", manufacturerParams);
        const [manufacturerResult] = await connection.execute(manufacturerQuery, manufacturerParams);
        console.log("✅ Inserted into manufacturer table:", user_id, "Result:", manufacturerResult);
      }

      await connection.query('COMMIT');
      console.log("✅ Transaction committed successfully for user:", user_id);

    } catch (error: any) {
      await connection.query('ROLLBACK');
      console.error("❌ Transaction rolled back for user:", user_id, "Error:", {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      });
      throw error; // Re-throw to be caught by outer catch
    } finally {
      connection.release();
      console.log("🔄 Database connection released");
    }
    
    return NextResponse.json(
      {
        message: "🎉 User registered successfully!",
        success: true,
        user_id
      },
      { status: 201 }
    );

} catch (error: any) {
  console.error("🔥 SIGNUP ERROR DETAILS:", {
    message: error.message,
    stack: error.stack,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage
  });

  return NextResponse.json(
    { error: error.message || "Internal Server Error" },
    { status: 500 }
  );
}
}