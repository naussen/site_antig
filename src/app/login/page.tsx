import { LoginForm } from "@/components/auth/login-form";
import { ProLogoLink } from "@/components/brand/pro-logo";
import { isAllowedReturnPath } from "@/lib/return-paths.mjs";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const query = await searchParams;
  const requestedNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const returnTo = typeof requestedNext === "string" && isAllowedReturnPath(requestedNext)
    ? requestedNext
    : null;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <ProLogoLink
            href="/"
            label="Voltar para a página inicial"
            size={44}
            variant="full"
            className="mb-4"
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Bem-vindo de volta
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Faça login para salvar seu progresso e anotações.
          </p>
        </div>

        <LoginForm returnTo={returnTo} />
      </div>
    </main>
  );
}
