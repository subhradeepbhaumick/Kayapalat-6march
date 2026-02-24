import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminLayoutWrapper from "@/components/admin/AdminLayoutWrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "superadmin") {
    redirect("/login");
  }

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
