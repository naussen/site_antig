import Link from "next/link";
import { ArrowLeft, CreditCard, LockKeyhole, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrivacyRequestForm } from "@/components/privacy/privacy-request-form";
import { PasswordRecoveryButton } from "./password-recovery-button";

const requestLabels: Record<string, string> = {
  access: "Acesso aos dados",
  correction: "Correção",
  deletion: "Exclusão",
  portability: "Portabilidade",
  information: "Informações",
  other: "Outro",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: privacyRequests, error } = await supabase
    .from("privacy_requests")
    .select("id, request_type, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw new Error("Não foi possível consultar as solicitações de privacidade.");

  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const createdAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(user.created_at));

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)]"><ArrowLeft size={17} />Voltar ao Dashboard</Link>
        <header className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)] sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><UserRound size={24} /></span>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">Conta</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--text-primary)]">Dados, segurança e privacidade</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">Esta área trata sua identidade e seus direitos. Preferências de estudo continuam separadas.</p>
        </header>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <ShieldCheck size={24} className="text-[var(--accent)]" />
            <h2 className="mt-4 text-xl font-extrabold text-[var(--text-primary)]">Identidade</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-bold text-[var(--text-muted)]">E-mail</dt><dd className="mt-1 break-all text-[var(--text-primary)]">{user.email}</dd></div>
              <div><dt className="font-bold text-[var(--text-muted)]">Conta criada em</dt><dd className="mt-1 text-[var(--text-primary)]">{createdAt}</dd></div>
              <div><dt className="font-bold text-[var(--text-muted)]">Métodos de acesso</dt><dd className="mt-1 text-[var(--text-primary)]">{providers.length ? providers.join(", ") : "E-mail"}</dd></div>
            </dl>
          </article>
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <LockKeyhole size={24} className="text-[var(--accent)]" />
            <h2 className="mt-4 text-xl font-extrabold text-[var(--text-primary)]">Segurança da conta</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">A redefinição ocorre por link de uso único enviado ao e-mail confirmado. Contas Google continuam protegidas pelo provedor.</p>
            {user.email && <div className="mt-5"><PasswordRecoveryButton email={user.email} /></div>}
          </article>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/assinatura" className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 font-bold text-[var(--text-primary)] hover:border-[var(--accent)]"><CreditCard size={21} className="text-[var(--accent)]" />Assinatura e cobrança</Link>
          <Link href="/dashboard/configuracoes" className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 font-bold text-[var(--text-primary)] hover:border-[var(--accent)]"><SlidersHorizontal size={21} className="text-[var(--accent)]" />Preferências de estudo</Link>
        </section>

        <section id="privacidade" className="mt-6 scroll-mt-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">Canal LGPD</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--text-primary)]">Exercer direitos sobre seus dados</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">O pedido fica vinculado à conta autenticada e recebe protocolo. A identidade poderá ser confirmada antes de entregar, corrigir, portar ou excluir dados.</p>
          {user.email && <PrivacyRequestForm accountEmail={user.email} />}
          {(privacyRequests ?? []).length > 0 && (
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <h3 className="font-extrabold text-[var(--text-primary)]">Solicitações recentes</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                {(privacyRequests ?? []).map((request) => <li key={request.id} className="rounded-xl bg-[var(--bg-primary)] p-3"><strong>{requestLabels[request.request_type] ?? request.request_type}</strong> · {request.status} · {new Intl.DateTimeFormat("pt-BR").format(new Date(request.created_at))}</li>)}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
