import Link from "next/link";
import { SharedLoginForm } from "@/components/auth/shared-login-form";

export const metadata = { title: "Conta Amigos", robots: { index: false, follow: false } };

export default function SharedLoginPage() {
  return <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6"><div className="w-full max-w-sm"><Link href="/login" className="text-sm text-[var(--accent)]">Voltar ao login</Link><SharedLoginForm /></div></main>;
}
