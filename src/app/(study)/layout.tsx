export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Content area — sidebar + main + notes são montados pelo page.tsx */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {children}
      </div>
    </div>
  );
}
