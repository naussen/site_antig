import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from 'file:///C:/PRO/site/node_modules/@supabase/supabase-js/dist/index.mjs';
import { fetchState } from '../../../saneamento-onda-5/manifesto-preparacao-onda5.mjs';
import { normalizeSectionContent, sha256 } from '../../../saneamento-onda-4/manifesto_saneamento_onda4.mjs';
import { getMermaidSecurityIssue } from 'file:///C:/PRO/site/src/lib/mermaid/security.mjs';

const folder = import.meta.dirname;
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const fileSha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const [actual, financas, ethics] = await Promise.all([
  fetchState(sb, [{ discipline: 'Legislação Aduaneira' }]),
  fetchState(sb, [{ discipline: 'Finanças Públicas' }]),
  fetchState(sb, [{ discipline: 'Ética no Serviço Público' }]),
]);

const { data: rawTopics, error: rawTopErr } = await sb
  .from('topics')
  .select('topic_id,discipline,title,sort_order,archived_at')
  .eq('discipline', 'Legislação Aduaneira')
  .order('sort_order', { ascending: true });
assert.ifError(rawTopErr);

const topicIds = rawTopics.map((t) => t.topic_id);
const [rawSecRes, qRelRes, tdRelRes, redirRes] = await Promise.all([
  sb.from('sections').select('section_id,topic_id,archived_at,current_revision_id').in('topic_id', topicIds),
  sb.from('question_topic_relations').select('question_id,topic_id').in('topic_id', topicIds),
  sb.from('topic_discipline_relations').select('topic_id,discipline_id,is_primary').in('topic_id', topicIds),
  sb.from('topic_id_redirects').select('*').or(`old_topic_id.in.(${topicIds.join(',')}),new_topic_id.in.(${topicIds.join(',')})`),
]);
assert.ifError(rawSecRes.error);
assert.ifError(qRelRes.error);
assert.ifError(tdRelRes.error);
assert.ifError(redirRes.error);

assert.equal(rawTopics.length, 5);
assert.equal(actual.topics.length, 5);
assert.equal(rawSecRes.data.length, 31);
assert.equal(actual.sections.length, 31);

// 1. Verificar preservação integral de Finanças Públicas (7/7)
const acceptedFin = readJson(`${folder}/../../36-financas-publicas/aceite-documental-20261126/matriz-aceite.json`);
assert.equal(financas.topics.length, 1);
assert.equal(financas.sections.length, 7);
for (const row of acceptedFin.sections) {
  const s = financas.sections.find((x) => x.section_id === row.section_id);
  assert.ok(s);
  assert.equal(s.current_revision_id, row.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(s)), row.content_sha256);
}

// 2. Verificar preservação integral de Ética no Serviço Público (20/20)
const acceptedEthics = readJson(`${folder}/../../35-etica-no-servico-publico/aceite-documental-20261125/matriz-aceite.json`);
assert.equal(ethics.sections.length, 20);
for (const row of acceptedEthics.sections) {
  const s = ethics.sections.find((x) => x.section_id === row.section_id);
  assert.ok(s);
  assert.equal(s.current_revision_id, row.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(s)), row.content_sha256);
}

// 3. Verificar preservação integral de Jurisdição Aduaneira 01-05 publicada e das 26 restantes
const t1Rec = readJson(`${folder}/../jurisdicao-01-05-20261126/reconciliacao.json`);
const t1Rev = readJson(`${folder}/../jurisdicao-01-05-20261126/secoes-revisadas.json`);
const snap = readJson(`${folder}/../../../../40-legislacao-aduaneira.snapshot.json`);

for (const row of t1Rec.all_31_revisions) {
  const cur = actual.sections.find((s) => s.section_id === row.section_id);
  assert.ok(cur);
  assert.equal(cur.current_revision_id, row.current_revision_id);
  if (cur.topic_id === 'jurisdicao-aduaneira') {
    const pubRow = t1Rev.find((x) => x.section_id === cur.section_id);
    assert.equal(sha256(normalizeSectionContent(cur)), sha256(normalizeSectionContent(pubRow)));
  } else {
    const snapRow = snap.sections.find((x) => x.section_id === cur.section_id);
    assert.equal(sha256(normalizeSectionContent(cur)), sha256(normalizeSectionContent(snapRow)));
  }
}
assert.equal(sha256(actual.sections.map(normalizeSectionContent)), t1Rec.full_discipline_sha256);

const topic2All = actual.sections
  .filter((s) => s.topic_id === 'tributos-incidentes-no-comercio-exterior')
  .sort((a, b) => a.sort_order - b.sort_order);
assert.equal(topic2All.length, 6);

const selectedIds = [1, 2, 3, 4].map((n) => `tributos-incidentes-no-comercio-exterior-sec-0${n}`);
const selected = topic2All.filter((s) => selectedIds.includes(s.section_id));
const remainingInTopic2 = topic2All.filter((s) => !selectedIds.includes(s.section_id));
assert.equal(selected.length, 4);
assert.equal(remainingInTopic2.length, 2);

const countTables = (md) => (md.match(/\n\|[^\n]+\|\n\|[\s:\-|]+\|/g) || []).length;
const countFormulas = (md) => (md.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) || []).length;

const result = {
  checked_at: new Date().toISOString(),
  date: '2026-11-28',
  mode: 'diagnostico_somente_select',
  database_writes: 0,
  discipline: 'Legislação Aduaneira',
  selected_topic: 'tributos-incidentes-no-comercio-exterior',
  selected_topic_title: 'Tributos Incidentes no Comércio Exterior',
  topic_total_sections: 6,
  selected_count: 4,
  remaining_in_topic_count: 2,
  rationale: 'O tópico possui 6 seções (acima do teto de 5). As seções 01–04 formam um bloco coeso sobre Imposto de Importação (conceitos, fato gerador, sujeição passiva, base de cálculo, alíquotas e regimes RTS/RTE/RTU/MNI), lançamento/pagamento/compensação/restituição/Ex-Tarifário, isenções objetivas/subjetivas e hipóteses de não tributação + Imposto de Exportação + incentivos à exportação + IPI-Importação. As seções 05 e 06 (PIS/Cofins-Importação geral e em cigarros + CIDE-Combustíveis + Taxa Siscomex) permanecem juntas para o lote seguinte do tópico, evitando cindir PIS/Cofins-Importação.',
  selected_sections: selected.map((s) => ({
    ...s,
    content_sha256: sha256(normalizeSectionContent(s)),
    tables_count: countTables(s.content_markdown),
    formulas_count: countFormulas(s.content_markdown),
    mermaid_security_issue: s.mermaid_mindmap ? getMermaidSecurityIssue(s.mermaid_mindmap) : null,
  })),
  remaining_in_topic: remainingInTopic2.map(({ section_id, title, sort_order, current_revision_id }) => ({
    section_id,
    title,
    sort_order,
    current_revision_id,
    content_sha256: sha256(normalizeSectionContent(topic2All.find((x) => x.section_id === section_id))),
  })),
  published_topic1_preserved: {
    topic_id: 'jurisdicao-aduaneira',
    sections: 5,
    all_contents_and_revisions_equal: true,
    after_topic1_sha256: t1Rec.after_topic1_sha256,
  },
  remaining_other_topics_preserved: {
    topics: ['controle-aduaneiro-de-mercadorias', 'regimes-aduaneiros', 'infracoes-e-penalidades-aduaneiras'],
    sections: 20,
    all_equal_to_snapshot_and_reconciled_revisions: true,
  },
  relations: {
    question_topic_relations: qRelRes.data.length,
    topic_discipline_relations: tdRelRes.data.length,
    topic_id_redirects: redirRes.data.length,
  },
  historical_artifacts: {
    topic2_all_6_equal_to_snapshot_20261118: true,
    topic2_all_6_equal_to_b01_raw_input: true,
    local_old_proposals_for_topic2: false,
    untracked_in_discipline_40: [
      'orquestracao-03-54/saneamento-onda-7/40-legislacao-aduaneira/jurisdicao-01-05-20261126/capturas/',
      'orquestracao-03-54/saneamento-onda-7/40-legislacao-aduaneira/jurisdicao-01-05-20261126/import/',
    ],
    untracked_note: 'Apenas capturas locais PNG e pasta de dry-run do lote já publicado Jurisdição 01–05; zero propostas pendentes para Tributos no Comércio Exterior.',
  },
  components: {
    texts: selected.length,
    callouts: selected.reduce((n, s) => n + s.callouts.length, 0),
    maps: selected.filter((s) => Boolean(s.mermaid_mindmap && s.mermaid_mindmap.trim())).length,
    tables: selected.reduce((n, s) => n + countTables(s.content_markdown), 0),
    formulas: selected.reduce((n, s) => n + countFormulas(s.content_markdown), 0),
    quant_charts: selected.reduce((n, s) => n + (s.content_markdown.match(/```quant-chart/g) || []).length, 0),
    flashcards: selected.reduce((n, s) => n + s.flashcards.length, 0),
    mnemonics: selected.reduce((n, s) => n + s.mnemonics.length, 0),
  },
  current_revisions: actual.sections.map(({ section_id, topic_id, current_revision_id }) => ({
    section_id,
    topic_id,
    current_revision_id,
  })),
  full_discipline_sha256: t1Rec.full_discipline_sha256,
  financas_acceptance_preserved: {
    sections: 7,
    all_contents_and_revisions_equal: true,
    acceptance_file_sha256: fileSha256(`${folder}/../../36-financas-publicas/aceite-documental-20261126/matriz-aceite.json`),
    report_36_sha256: fileSha256(`${folder}/../../../../36-financas-publicas.md`),
  },
  ethics_acceptance_preserved: {
    sections: 20,
    all_contents_and_revisions_equal: true,
    acceptance_file_sha256: fileSha256(`${folder}/../../35-etica-no-servico-publico/aceite-documental-20261125/matriz-aceite.json`),
    report_35_sha256: fileSha256(`${folder}/../../../../35-etica-no-servico-publico.md`),
  },
};

fs.writeFileSync(`${folder}/estado-atual.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(
  JSON.stringify({
    ok: true,
    selected: result.selected_sections.map(({ section_id, title, current_revision_id, mermaid_security_issue, tables_count, formulas_count }) => ({
      section_id,
      title,
      current_revision_id,
      mermaid_security_issue,
      tables_count,
      formulas_count,
    })),
    remaining_in_topic: result.remaining_in_topic,
    components: result.components,
  }, null, 2)
);
