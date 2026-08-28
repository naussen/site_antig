import Link from "next/link";

export const metadata = {
  title: "Termos de uso",
  description: "Termos de uso da plataforma PRO Concursos.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Institucional</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Termos de uso</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Versão de 28 de agosto de 2026.</p>
      <div className="mt-10 space-y-8 text-base leading-7 text-[var(--text-secondary)]">
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">1. Serviço</h2><p className="mt-3">O PRO Concursos é uma plataforma digital de estudos para concursos públicos, com resumos estruturados, legislação, ferramentas de revisão e recursos de acompanhamento.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">2. Conta e acesso</h2><p className="mt-3">O acesso ao conteúdo contratado é pessoal, vinculado à conta do usuário e condicionado à existência de assinatura mensal paga e vigente. O usuário deve manter suas credenciais protegidas e fornecer informações verdadeiras.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">3. Conteúdo educacional</h2><p className="mt-3">O material apoia a preparação para concursos, mas não garante aprovação, não substitui a leitura das fontes oficiais e não constitui consultoria jurídica.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">4. Pagamento e renovação</h2><p className="mt-3">A assinatura possui cobrança mensal recorrente processada pelo provedor escolhido. Valores, condições da oferta e confirmação do pagamento são apresentados antes da contratação.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">5. Cancelamento</h2><p className="mt-3">O assinante pode consultar as orientações para interromper a renovação na <Link href="/dashboard/assinatura#cancelamento" className="font-bold text-[var(--accent)] underline underline-offset-4">área de assinatura</Link>. As condições e a confirmação apresentadas pelo provedor devem ser conferidas antes de concluir o procedimento.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">6. Uso permitido</h2><p className="mt-3">É proibido compartilhar credenciais, reproduzir ou redistribuir o acervo sem autorização, contornar controles de acesso ou utilizar a plataforma para atividade ilícita.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">7. Identificação e contato</h2><p className="mt-3">O serviço é apresentado sob a marca PRO Concursos e opera no domínio proconcursos.com.br. Os caminhos atuais de atendimento estão reunidos na página de <Link href="/contato" className="font-bold text-[var(--accent)] underline underline-offset-4">Contato</Link>.</p></section>
      </div>
    </main>
  );
}
