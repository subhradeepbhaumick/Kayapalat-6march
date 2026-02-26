export default async function SalesAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sales-admin-layout">
      {children}
    </div>
  );
}