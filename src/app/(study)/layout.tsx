export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Content area — sidebar + main + notes são montados pelo page.tsx */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
