import { LoginForm } from "@/components/auth/login-form";
import { Sparkles } from "lucide-react";
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
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            <Sparkles size={24} />
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
