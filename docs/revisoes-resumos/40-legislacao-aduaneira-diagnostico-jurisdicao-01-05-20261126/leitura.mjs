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
  .select('topic_id,discipline,title,sort_order,archived_at,archived_by,archived_reason')
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

// Preservação integral de Finanças Públicas (7/7)
const acceptedFin = readJson(`${folder}/../../36-financas-publicas/aceite-documental-20261126/matriz-aceite.json`);
assert.equal(financas.topics.length, 1);
assert.equal(financas.sections.length, 7);
for (const row of acceptedFin.sections) {
  const s = financas.sections.find((x) => x.section_id === row.section_id);
  assert.ok(s, `Seção ausente em Finanças Públicas: ${row.section_id}`);
  assert.equal(s.current_revision_id, row.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(s)), row.content_sha256);
}

// Preservação integral de Ética no Serviço Público (20/20)
const acceptedEthics = readJson(`${folder}/../../35-etica-no-servico-publico/aceite-documental-20261125/matriz-aceite.json`);
assert.equal(ethics.sections.length, 20);
for (const row of acceptedEthics.sections) {
  const s = ethics.sections.find((x) => x.section_id === row.section_id);
  assert.ok(s, `Seção ausente em Ética: ${row.section_id}`);
  assert.equal(s.current_revision_id, row.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(s)), row.content_sha256);
}

// Inventário e comparação com fotografia e lotes de entrada
assert.equal(rawTopics.length, 5);
assert.equal(actual.topics.length, 5);
assert.equal(rawSecRes.data.length, 31);
assert.equal(actual.sections.length, 31);
assert.equal(rawSecRes.data.filter((s) => s.archived_at !== null).length, 0);

const snapshot = readJson(`${folder}/../../../../40-legislacao-aduaneira.snapshot.json`);
const b01 = readJson(`${folder}/../../../lotes/W7--40-legislacao-aduaneira--b01.json`);
const b02 = readJson(`${folder}/../../../lotes/W7--40-legislacao-aduaneira--b02.json`);
const b03 = readJson(`${folder}/../../../lotes/W7--40-legislacao-aduaneira--b03.json`);
const batchInputs = [...b01.sections, ...b02.sections, ...b03.sections];
assert.equal(snapshot.sections.length, 31);
assert.equal(batchInputs.length, 31);

const orderedTopics = [...actual.topics].sort((a, b) => a.sort_order - b.sort_order);
const selected = actual.sections
  .filter((s) => s.topic_id === 'jurisdicao-aduaneira')
  .sort((a, b) => a.sort_order - b.sort_order);
assert.equal(selected.length, 5);

const sameContent = (a, b) =>
  sha256(normalizeSectionContent(a)) ===
  sha256(
    normalizeSectionContent({
      section_id: b.section_id,
      content_unit_id: a.content_unit_id,
      stable_key: a.stable_key,
      topic_id: b.topic_id,
      title: b.title,
      sort_order: b.sort_order,
      content_markdown: b.content_markdown,
      callouts: b.callouts ?? [],
      mnemonics: b.mnemonics ?? [],
      flashcards: b.flashcards ?? [],
      mermaid_mindmap: b.mermaid_mindmap || null,
      archived_at: null,
    })
  );

const snapshotParity = actual.sections.map((s) => {
  const snapRow = snapshot.sections.find((x) => x.section_id === s.section_id);
  const batchRow = batchInputs.find((x) => x.section_id === s.section_id);
  assert.ok(snapRow && batchRow, `Falta correspondência histórica para ${s.section_id}`);
  return {
    section_id: s.section_id,
    same_as_snapshot_content: sha256(normalizeSectionContent(s)) === sha256(normalizeSectionContent(snapRow)),
    same_as_batch_input_content: sameContent(s, batchRow),
  };
});
assert.ok(snapshotParity.every((r) => r.same_as_snapshot_content && r.same_as_batch_input_content));

const result = {
  checked_at: new Date().toISOString(),
  date: '2026-11-26',
  mode: 'diagnostico_somente_select',
  database_writes: 0,
  discipline: 'Legislação Aduaneira',
  topics: orderedTopics.map((t) => {
    const secs = actual.sections.filter((s) => s.topic_id === t.topic_id);
    return {
      ...t,
      active_sections: secs.length,
      callouts: secs.reduce((n, s) => n + s.callouts.length, 0),
      maps: secs.filter((s) => Boolean(s.mermaid_mindmap && s.mermaid_mindmap.trim())).length,
      mnemonics: secs.reduce((n, s) => n + s.mnemonics.length, 0),
      flashcards: secs.reduce((n, s) => n + s.flashcards.length, 0),
    };
  }),
  archived_topics: 0,
  archived_sections: 0,
  total_sections: actual.sections.length,
  relations: {
    question_topic_relations: qRelRes.data.length,
    topic_discipline_relations: tdRelRes.data.length,
    topic_id_redirects: redirRes.data.length,
  },
  historical_artifacts: {
    snapshot_captured_at: snapshot.capturedAt,
    all_31_equal_to_snapshot_20261118: true,
    all_31_equal_to_batch_inputs_b01_b03: true,
    local_old_proposals_found: false,
    note: 'W7--40-legislacao-aduaneira--b01..b03.json agrupam 11+7+13 seções como insumo bruto de coleta; não são propostas revisadas nem autorizam lote acima de cinco seções.',
  },
  selected_topic: 'jurisdicao-aduaneira',
  selected_sections: selected.map((s) => ({
    ...s,
    content_sha256: sha256(normalizeSectionContent(s)),
    mermaid_security_issue: s.mermaid_mindmap ? getMermaidSecurityIssue(s.mermaid_mindmap) : null,
  })),
  remaining_sections: orderedTopics
    .filter((t) => t.topic_id !== 'jurisdicao-aduaneira')
    .flatMap((t) =>
      actual.sections
        .filter((s) => s.topic_id === t.topic_id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ section_id, topic_id, title, sort_order, current_revision_id }) => ({
          section_id,
          topic_id,
          title,
          sort_order,
          current_revision_id,
        }))
    ),
  current_revisions: orderedTopics.flatMap((t) =>
    actual.sections
      .filter((s) => s.topic_id === t.topic_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ section_id, current_revision_id }) => ({ section_id, current_revision_id }))
  ),
  components: {
    texts: selected.length,
    callouts: selected.reduce((n, s) => n + s.callouts.length, 0),
    maps: selected.filter((s) => Boolean(s.mermaid_mindmap && s.mermaid_mindmap.trim())).length,
    tables: selected.reduce((n, s) => n + (s.content_markdown.match(/\n\|[^\n]+\|\n\|[\s:\-|]+\|/g) || []).length, 0),
    quant_charts: selected.reduce((n, s) => n + (s.content_markdown.match(/```quant-chart/g) || []).length, 0),
    flashcards: selected.reduce((n, s) => n + s.flashcards.length, 0),
    mnemonics: selected.reduce((n, s) => n + s.mnemonics.length, 0),
  },
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
  scope: 'Legislação Aduaneira — Tópico 1 completo (jurisdicao-aduaneira, seções 01–05): Administração Aduaneira e Alfandegamento, Fiscalização Aduaneira, Controle Aduaneiro de Veículos, Conhecimento de Carga/Embarque e Manifesto de Carga; demais 4 tópicos (26 seções) reservados para lotes futuros.',
};

fs.writeFileSync(`${folder}/estado-atual.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(
  JSON.stringify({
    ok: true,
    total_topics: result.topics.length,
    total_sections: result.total_sections,
    selected_sections: result.selected_sections.map(({ section_id, title, current_revision_id }) => ({
      section_id,
      title,
      current_revision_id,
    })),
    components: result.components,
    financas_7_preserved: result.financas_acceptance_preserved.all_contents_and_revisions_equal,
    ethics_20_preserved: result.ethics_acceptance_preserved.all_contents_and_revisions_equal,
  })
);
