// import { NextRequest, NextResponse } from "next/server";
// import { executeQuery } from "@/lib/db";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export async function POST(req: NextRequest) {
//   try {
//     const { login, password } = await req.json();

//     if (!login || !password) {
//       return NextResponse.json(
//         { error: "Login and password are required." },
//         { status: 400 }
//       );
//     }

//     // Find user by matching login with email, phone or user_id
//     const [users] = await executeQuery(
//       `SELECT user_id, name, email, phone, role, password_hash FROM users_kp_db
//        WHERE (email = ? OR phone = ? OR user_id = ?)`,
//       [login, login, login]
//     );

//     if (!users || users.length === 0) {
//       return NextResponse.json(
//         { error: "Invalid login credentials." },
//         { status: 401 }
//       );
//     }

//     const user = users[0];

//     // Verify password
//     const passwordMatch = await bcrypt.compare(password, user.password_hash);
//     if (!passwordMatch) {
//       return NextResponse.json(
//         { error: "Invalid login credentials." },
//         { status: 401 }
//       );
//     }

//     // Prepare JWT payload
//     const payload = {
//       user_id: user.user_id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: user.role
//     };

//     // Generate JWT token
//     const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

//     // Set cookies using raw Set-Cookie headers to ensure SameSite attribute
//     return NextResponse.json(
//       { message: "Login successful", user: payload },
//       {
//         status: 200,
//         headers: {
//           "Set-Cookie": [
//             \`token=\${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax\`,
//             "loggedIn=true; Path=/; Max-Age=3600; SameSite=Lax"
//           ],
//         },
//       }
//     );

//   } catch (error: any) {
//     console.error("Login error:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Login and password are required." },
        { status: 400 }
      );
    }

    const [users] = await executeQuery(
      `SELECT user_id, name, email, phone, role, password_hash FROM users_kp_db
       WHERE (email = ? OR phone = ? OR user_id = ?)`,
      [login, login, login]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    const payload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    // Set token in httpOnly cookie
    const res = NextResponse.json({
      success: true,
      message: "Login successful",
      user: payload,
      token: token
    });
    res.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 86400, // 1 day
      sameSite: 'lax'
    });

    return res;

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
