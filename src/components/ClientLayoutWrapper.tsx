"use client";

import { useEffect, useState } from 'react';
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SessionProvider } from "next-auth/react";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/sales-admin") || pathname.startsWith("/superadmin");
  const isReferUserRoute = pathname.startsWith("/referuser");
  const isDesignerRoute = pathname.startsWith("/designer");
  const isSupervisorRoute = pathname.startsWith("/supervisor");
  const isBusinessBrandRoute = pathname.startsWith("/businessBrand");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider>
      {!isAdminRoute && !isReferUserRoute && !isSupervisorRoute && !isBusinessBrandRoute && <Navbar />}
      <main className="flex flex-col min-h-screen">{children}</main>
      {!isAdminRoute && !isReferUserRoute && !isSupervisorRoute && !isBusinessBrandRoute && <Footer />}
    </SessionProvider>
  );
}
