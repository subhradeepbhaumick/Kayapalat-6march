import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { executeQuery } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const [rows] = await executeQuery(
            `SELECT user_id, name, email, phone, role, whatsapp, password_hash, profile_pic
             FROM users_kp_db WHERE email = ?`,
            [credentials.email]
          );

          if (!rows || rows.length === 0) {
            return null;
          }

          const user = rows[0];

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            whatsapp: user.whatsapp,
            profile_pic: user.profile_pic,
          } as any;
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // session duration of 12 hours
    maxAge: 12 * 60 * 60,
    // for 1 day : 24 * 60 * 60, or 1 * 24 * 60 * 60,
    // session update interval of 6 hours
    updateAge: 6 * 60 * 60,

  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('Auth: JWT callback - token before:', token);
      console.log('Auth: JWT callback - user:', user);

      if (user) {
        token.user_id = user.id; // Set user_id for API access
        token.name = user.name;
        token.role = user.role;
        token.phone = user.phone;
        token.whatsapp = user.whatsapp;
        token.profile_pic = user.profile_pic;
        console.log('Auth: JWT callback - added user data to token');
      }

      console.log('Auth: JWT callback - token after:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('Auth: Session callback - session before:', session);
      console.log('Auth: Session callback - token:', token);

      if (token) {
        session.user.id = token.user_id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
        session.user.whatsapp = token.whatsapp as string;
        session.user.image = token.profile_pic as string;
        session.user.profile_pic = token.profile_pic as string;
        console.log('Auth: Session callback - updated session user:', { id: session.user.id, role: session.user.role });
      }

      console.log('Auth: Session callback - session after:', session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function decodeToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
}
