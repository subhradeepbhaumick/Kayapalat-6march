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
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/sales-admin") || pathname.startsWith("/superadmin") ;
  const isReferUserRoute = pathname.startsWith("/referuser");
  const isDesignerRoute = pathname.startsWith("/designer");
  const isSupervisorRoute = pathname.startsWith("/supervisor");
  const isBusinessBrandRoute = pathname.startsWith("/businessBrand");
  const isMetroSuperAdminRoute = pathname.startsWith("/metro-superadmin");
  const isMetroRoute = pathname.startsWith("/metro");
  const isDeveloperRoute = pathname.startsWith("/developer");
  const isClientRoute = pathname.startsWith("/client");
  const isYourDesignsRoute = pathname === "/client/your-designs";
  const isRelationshipManagerRoute = pathname.startsWith("/relationship-manager");
  const isCasualStaffRoute = pathname.startsWith("/casual-staff");
  const isShowroomStaffRoute = pathname.startsWith("/showroom-staff");
  const isVendorRoute = pathname.startsWith("/vendor");
  const ismetroClientRoute = pathname.startsWith("/metro_management-client");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null;
  }
  return (
    <SessionProvider>
      {!isAdminRoute && !isMetroSuperAdminRoute  && !isReferUserRoute && (!isClientRoute || isYourDesignsRoute) && !isSupervisorRoute && !isDesignerRoute && !isBusinessBrandRoute && !isMetroRoute && !isDeveloperRoute && !isRelationshipManagerRoute && !isCasualStaffRoute && !isShowroomStaffRoute && !isVendorRoute && !ismetroClientRoute && <Navbar />}
      <main className="flex flex-col min-h-screen">{children}</main>
      {!isAdminRoute && !isMetroSuperAdminRoute  && !isReferUserRoute && !isClientRoute && !isYourDesignsRoute && !isSupervisorRoute && !isDesignerRoute && !isBusinessBrandRoute && !isMetroRoute && !isDeveloperRoute && !isRelationshipManagerRoute && !isCasualStaffRoute && !isShowroomStaffRoute && !isVendorRoute && !ismetroClientRoute && <Footer />}
    </SessionProvider>
  );
}
