import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // For API routes, return 401 instead of redirect
    if (path.startsWith("/api/")) {
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;

    // ROLE PROTECTION RULES
    if (path.startsWith("/admin") && !["superadmin"].includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/sales-admin") && !["sales_admin"].includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/referuser") && !["referuser"].includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/superadmin") && !["superadmin"].includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/client") && !["client"].includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/designer") && !["designer"].includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    if (path.startsWith("/supervisor") && !["supervisor"].includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/businessBrand") && !["businessBrand"].includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      }

    },
  }
);

export const config = {
  matcher: [
    "/profile",
    "/simple",
    "/dashboard/:path*",
    "/client/:path*",
    "/designer/:path*",
    "/superadmin/:path*",
    "/sales-admin/:path*",
    "/referuser/:path*",
    "/supervisor/:path*",
    "/businessBrand/:path*",
    "/admin/:path*",
  ],
};
