import Link from "next/link";

export const metadata = {
  title: "Privacidade",
  description: "Informações sobre privacidade e tratamento de dados no PRO Concursos.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Institucional</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Privacidade</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Versão de 28 de agosto de 2026.</p>
      <div className="mt-10 space-y-8 text-base leading-7 text-[var(--text-secondary)]">
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Dados tratados</h2><p className="mt-3">A plataforma trata dados de conta e autenticação, preferências, progresso de leitura, notas, realces, informações técnicas de segurança e dados necessários para confirmar o estado da assinatura. Dados completos de cartão não são armazenados pelo PRO Concursos.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Finalidades</h2><p className="mt-3">Os dados são usados para autenticar o usuário, liberar o conteúdo contratado, salvar recursos de estudo, prevenir abuso, processar solicitações e manter a segurança e o funcionamento do serviço.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Compartilhamento</h2><p className="mt-3">Informações são compartilhadas somente quando necessário com provedores de autenticação, banco de dados, hospedagem e pagamento, ou quando exigido por lei. Cada provedor trata os dados sob seus próprios termos e medidas de segurança.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Conservação e segurança</h2><p className="mt-3">Os registros são mantidos pelo período necessário às finalidades do serviço, ao cumprimento de obrigações e à proteção contra fraude. São aplicados controles de acesso, autenticação e isolamento de dados compatíveis com a natureza da plataforma.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Direitos do titular</h2><p className="mt-3">O titular pode solicitar informações, correção ou avaliação de exclusão de dados pelos caminhos reunidos na página de <Link href="/contato" className="font-bold text-[var(--accent)] underline underline-offset-4">Contato</Link>, observadas as obrigações legais de conservação.</p></section>
      </div>
    </main>
  );
}
