export default function StudyTopicLoading() {
  return (
    <main
      className="min-w-0 flex-1 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
      aria-label="Carregando seções do resumo"
      aria-busy="true"
    >
      <div
        className="h-16 border-b"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      />
      <div className="mx-auto w-full max-w-[1280px] space-y-8 px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div className="space-y-3">
          <div className="h-4 w-36 animate-pulse rounded bg-[var(--editorial-subtle)]" />
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-[var(--editorial-subtle)]" />
          <div className="h-2 w-full animate-pulse rounded-full bg-[var(--progress-bg)]" />
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <section key={index} className="space-y-4" aria-hidden="true">
            <div className="h-7 w-2/3 animate-pulse rounded bg-[var(--editorial-subtle)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--editorial-subtle)]" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-[var(--editorial-subtle)]" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--editorial-subtle)]" />
          </section>
        ))}
        <p className="sr-only">Carregando seções...</p>
      </div>
    </main>
  );
}
