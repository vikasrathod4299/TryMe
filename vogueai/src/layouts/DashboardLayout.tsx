
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-28 px-6 relative z-30">
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
