import { LoginForm } from "@/components/auth/login-form";
import { ProLogo } from "@/components/brand/pro-logo";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center mb-4"
          >
            <ProLogo size={44} variant="full" />
          </Link>
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

        <LoginForm />
      </div>
    </main>
  );
}
