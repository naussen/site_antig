import Link from "next/link";
import type { createClient } from "@/lib/supabase/server";

export const loaTopic = "orcamento-publico-constituicao-federal-e-lei-4-320";
export const loaSection = loaTopic + "-sec-05";
const question = "pdf:dpf14_009_01:071";
const fragment = "cf-88.art-165.paragrafo-5";

export async function LoaStudyMission({ supabase }: {
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const [law, practice] = await Promise.all([
    supabase.from("laws")
      .select("id,law_versions!laws_current_version_fk!inner(id,legal_fragments!inner(stable_key))")
      .eq("slug", "cf-88").eq("status", "published")
      .eq("law_versions.status", "published")
      .eq("law_versions.legal_fragments.stable_key", fragment).maybeSingle(),
    supabase.rpc("list_questions_filtered_v2", {
      p_question_identifier: question, p_topic_id: loaTopic, p_limit: 1,
    }),
  ]);
  if (!law.data || practice.data?.items?.[0]?.external_id !== question) return null;

  const linkStyle = "rounded text-sm font-semibold text-[var(--accent)] underline underline-offset-4 focus-visible:outline-2";
  return (
    <section aria-labelledby="loa-mission-title" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h2 id="loa-mission-title" className="font-semibold text-[var(--text-primary)]">Estudo integrado · Lei Orçamentária Anual</h2>
      <ol className="mt-3 flex list-inside list-decimal flex-wrap gap-x-6 gap-y-3 text-[var(--text-secondary)]">
        <li><Link className={linkStyle} href={`/${loaTopic}#section-${loaSection}`}>Ler o resumo da LOA</Link></li>
        <li><a className={linkStyle} href={`/legis/cf-88?fragment=${fragment}`}>Consultar o art. 165, § 5º, da Constituição</a></li>
        <li><Link className={linkStyle} href={`/dashboard/questoes?id=${encodeURIComponent(question)}`}>Resolver a questão sobre a LOA</Link></li>
      </ol>
    </section>
  );
}
