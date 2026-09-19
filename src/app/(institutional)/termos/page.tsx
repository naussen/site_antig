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
      <p className="mt-4 text-sm text-[var(--text-muted)]">Versão de 19 de setembro de 2026.</p>
      <div className="mt-10 space-y-8 text-base leading-7 text-[var(--text-secondary)]">
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">1. Serviço</h2><p className="mt-3">O PRO Concursos é uma plataforma digital de estudos para concursos públicos, com resumos estruturados, legislação, ferramentas de revisão e recursos de acompanhamento.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">2. Conta e acesso</h2><p className="mt-3">O acesso ao conteúdo contratado é pessoal, vinculado à conta do usuário e condicionado à existência de assinatura mensal paga e vigente. O usuário deve manter suas credenciais protegidas e fornecer informações verdadeiras.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">3. Conteúdo educacional</h2><p className="mt-3">O material apoia a preparação para concursos, mas não garante aprovação, não substitui a leitura das fontes oficiais e não constitui consultoria jurídica.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">4. Pagamento e renovação</h2><p className="mt-3">A oferta de lançamento custa <strong>R$ 9,90 por mês</strong>, em cobrança mensal recorrente processada pelo provedor escolhido. O preço e a periodicidade são apresentados novamente antes da contratação.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">5. Cancelamento e arrependimento</h2><p className="mt-3">O assinante pode interromper a renovação pela <Link href="/dashboard/assinatura#cancelamento" className="font-bold text-[var(--accent)] underline underline-offset-4">área de assinatura</Link>. Nas contratações realizadas pela internet, o consumidor pode exercer o direito de arrependimento em até <strong>7 dias</strong> contados da contratação, com restituição dos valores pagos, mediante solicitação pelo canal de atendimento. O cancelamento da renovação, quando feito após esse prazo, impede novas cobranças e preserva o acesso referente ao período já pago, ressalvadas as hipóteses previstas em lei.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">6. Uso permitido</h2><p className="mt-3">É proibido compartilhar credenciais, reproduzir ou redistribuir o acervo sem autorização, contornar controles de acesso ou utilizar a plataforma para atividade ilícita.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">7. Identificação e contato</h2><div className="mt-3 space-y-2"><p>Fornecedor responsável: <strong>Naussen Cosme Velho Pezat</strong>, CPF 117.679.887-10.</p><p>Endereço: Rua Ernesto Goss, 105, Lages/SC, CEP 88502-165.</p><p>Atendimento: <a href="mailto:nvpezat@gmail.com" className="font-bold text-[var(--accent)] underline underline-offset-4">nvpezat@gmail.com</a>, com resposta em até 24 horas. O proprietário responde pelas solicitações de suporte e LGPD.</p><p>O serviço é apresentado sob a marca PRO Concursos e opera no domínio proconcursos.com.br. Os demais caminhos de atendimento estão reunidos na página de <Link href="/contato" className="font-bold text-[var(--accent)] underline underline-offset-4">Contato</Link>.</p></div></section>
      </div>
    </main>
  );
}
