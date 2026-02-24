import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function ReferUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const role = session.user.role;

  // Allow superadmin or referuser
  if (!["superadmin", "referuser"].includes(role)) {
    redirect("/login");
  }

  return (
    <div className="referuser-layout">
      {children}
    </div>
  );
}
