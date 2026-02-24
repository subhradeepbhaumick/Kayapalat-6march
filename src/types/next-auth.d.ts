import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      user_id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      phone: string;
      whatsapp: string;
      profile_pic?: string;
    };
    token?: string;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    phone: string;
    whatsapp: string;
    profile_pic?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone: string;
    whatsapp: string;
    profile_pic?: string;
  }
}
