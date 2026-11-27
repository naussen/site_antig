import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createClient} from 'file:///C:/PRO/site/node_modules/@supabase/supabase-js/dist/index.mjs';
import {fetchState,compareState} from '../../../saneamento-onda-5/manifesto-preparacao-onda5.mjs';
import {normalizeSectionContent,sha256} from '../../../saneamento-onda-4/manifesto_saneamento_onda4.mjs';

const folder = import.meta.dirname;
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const fileHash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const batches = [
  'secoes-01-04-20261126-v2',
  'secoes-05-07-20261126-v2'
];

const extractCharts = md => [...(md.matchAll(/```quant-chart\n([\s\S]*?)\n```/g) || [])].map(m => JSON.parse(m[1]));
const countTables = md => (md.match(/\n\| :---/g) || []).length;

const expectedRows = [];
const matrix = [];
const batchEvidence = [];
const chartDiffAudit = [];

for (const batch of batches) {
  const bDir = `${folder}/../${batch}`;
  const rows = read(`${bDir}/secoes-revisadas.json`);
  const receipt = read(`${bDir}/reconciliacao.json`);
  const cp = read(`${bDir}/checkpoint.json`);
  const visual = read(`${bDir}/render-visual.json`);
  const application = read(`${bDir}/aplicacao-recibo.json`);
  const preimage = read(`${bDir}/preimagem.json`);

  assert.ok(receipt.ok);
  assert.equal(application.status, 'completed');
  assert.ok(visual.checks.every(c => c.ok));
  assert.equal(visual.checks.length, rows.length * 6);
  assert.equal(visual.manifest_sha256, sha256(rows));
  assert.ok(fs.existsSync(`${bDir}/fontes.json`));

  const revisions = receipt.revisions || [];
  let batchChartsReviewed = 0;
  let batchChartsChanged = 0;

  for (const row of rows) {
    const prev = preimage.sections.find(r => r.section_id === row.section_id);
    assert.ok(prev);
    const rev = revisions.find(r => r.section_id === row.section_id)?.current_revision_id || prev.current_revision_id;
    assert.ok(rev);
    expectedRows.push({ ...row, current_revision_id: rev });

    const bCharts = extractCharts(prev.content_markdown);
    const aCharts = extractCharts(row.content_markdown);
    assert.equal(bCharts.length, aCharts.length);
    batchChartsReviewed += aCharts.length;

    let secChartsChanged = 0;
    aCharts.forEach((ac, idx) => {
      const bc = bCharts[idx];
      const changedKeys = Object.keys(ac).filter(k => JSON.stringify(bc[k]) !== JSON.stringify(ac[k]));
      const changed = changedKeys.length > 0;
      if (changed) {
        secChartsChanged += 1;
        batchChartsChanged += 1;
      }
      chartDiffAudit.push({
        batch,
        section_id: row.section_id,
        chart_index: idx,
        title: ac.title,
        changed,
        changed_fields: changedKeys,
        before: bc,
        after: ac
      });
    });

    const isEdited = revisions.some(r => r.section_id === row.section_id);
    matrix.push({
      section_id: row.section_id,
      topic_id: row.topic_id,
      title: row.title,
      sort_order: row.sort_order,
      content_unit_id: row.content_unit_id,
      stable_key: row.stable_key,
      current_revision_id: rev,
      content_sha256: sha256(normalizeSectionContent(row)),
      review_batch: batch,
      disposition: isEdited ? 'corrigida_publicada' : 'conferida_sem_edicao',
      visual_combinations: visual.checks.filter(c => c.id === row.section_id).length,
      components: {
        callouts: row.callouts.length,
        callouts_changed: row.callouts.filter((c, i) => JSON.stringify(c) !== JSON.stringify(prev.callouts[i])).length,
        maps: Number(Boolean(row.mermaid_mindmap)),
        maps_changed: Number((row.mermaid_mindmap || null) !== (prev.mermaid_mindmap || null)),
        quant_charts: aCharts.length,
        quant_charts_changed: secChartsChanged,
        tables: countTables(row.content_markdown),
        flashcards: row.flashcards.length,
        mnemonics: row.mnemonics.length
      }
    });
  }

  const hashFiles = [
    'checkpoint.json',
    'secoes-revisadas.json',
    'reconciliacao.json',
    'render-visual.json',
    'fontes.json',
    'aplicacao-recibo.json'
  ];
  batchEvidence.push({
    batch,
    sections: rows.length,
    visual_passed: visual.checks.length,
    quant_charts_reviewed: batchChartsReviewed,
    quant_charts_changed: batchChartsChanged,
    reconciled: true,
    application_receipt: true,
    checkpoint_status: cp.status,
    evidence_hashes: Object.fromEntries(hashFiles.map(n => [n, fileHash(`${bDir}/${n}`)]))
  });
}

assert.equal(expectedRows.length, 7);
assert.equal(new Set(expectedRows.map(s => s.section_id)).size, 7);
assert.equal(chartDiffAudit.length, 4);
assert.equal(chartDiffAudit.filter(c => c.changed).length, 2);

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const [actual, ethics] = await Promise.all([
  fetchState(sb, [{ discipline: 'Finanças Públicas' }]),
  fetchState(sb, [{ discipline: 'Ética no Serviço Público' }])
]);

// Verify Ethics 20/20 intact
const ethAccepted = read(`${folder}/../../35-etica-no-servico-publico/aceite-documental-20261125/matriz-aceite.json`);
assert.equal(ethics.topics.length, 3);
assert.equal(ethics.sections.length, 20);
for (const r of ethAccepted.sections) {
  const row = ethics.sections.find(s => s.section_id === r.section_id);
  assert.ok(row);
  assert.equal(row.current_revision_id, r.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(row)), r.content_sha256);
}

// Verify Finanças Públicas 1 topic / 7 sections parity
const base = read(`${folder}/../secoes-05-07-20261126-v2/preimagem.json`);
const parity = compareState({ disciplines: [{ ...base, sections: expectedRows }] }, { operations: [] }, actual);
assert.ok(parity.ok, JSON.stringify(parity));
assert.equal(actual.topics.length, 1);
assert.equal(actual.sections.length, 7);
for (const row of expectedRows) {
  const live = actual.sections.find(s => s.section_id === row.section_id);
  assert.ok(live);
  assert.equal(live.current_revision_id, row.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(live)), sha256(normalizeSectionContent(row)));
}

// Verify physical topics, bindings, and redirects
const beforeBindings = read(`${folder}/../secoes-05-07-20261126-v2/vinculos-depois.json`);
const physTopicsRes = await sb.from('topics').select('*').eq('discipline', 'Finanças Públicas');
assert.ifError(physTopicsRes.error);
const qRelRes = await sb.from('question_topic_relations').select('*').eq('topic_id', 'financas-publicas');
assert.ifError(qRelRes.error);
const dRelRes = await sb.from('topic_discipline_relations').select('*').eq('topic_id', 'financas-publicas');
assert.ifError(dRelRes.error);
const redirRes = await sb.from('topic_id_redirects').select('*').or('old_topic_id.eq.financas-publicas,new_topic_id.eq.financas-publicas');
assert.ifError(redirRes.error);

const norm = a => a.map(x => JSON.stringify(x)).sort();
assert.deepEqual(norm(qRelRes.data), norm(beforeBindings.question_topic_relations));
assert.deepEqual(norm(dRelRes.data), norm(beforeBindings.topic_discipline_relations));
assert.equal(physTopicsRes.data.length, 1);
assert.equal(redirRes.data.length, 0);

const empty = actual.topics.filter(t => !actual.sections.some(s => s.topic_id === t.topic_id));
assert.equal(empty.length, 0);

const totals = {
  sections: 7,
  topics_active: 1,
  topics_physical: physTopicsRes.data.length,
  callouts: matrix.reduce((n, s) => n + s.components.callouts, 0),
  callouts_changed: matrix.reduce((n, s) => n + s.components.callouts_changed, 0),
  maps: matrix.reduce((n, s) => n + s.components.maps, 0),
  maps_changed: matrix.reduce((n, s) => n + s.components.maps_changed, 0),
  quant_charts: matrix.reduce((n, s) => n + s.components.quant_charts, 0),
  quant_charts_changed: matrix.reduce((n, s) => n + s.components.quant_charts_changed, 0),
  tables: matrix.reduce((n, s) => n + s.components.tables, 0),
  flashcards: matrix.reduce((n, s) => n + s.components.flashcards, 0),
  mnemonics: matrix.reduce((n, s) => n + s.components.mnemonics, 0),
  visual_passed: batchEvidence.reduce((n, b) => n + b.visual_passed, 0),
  corrected: matrix.filter(s => s.disposition === 'corrigida_publicada').length,
  unchanged: matrix.filter(s => s.disposition === 'conferida_sem_edicao').length,
  added: 0
};

assert.equal(totals.quant_charts, 4);
assert.equal(totals.quant_charts_changed, 2);

const matrizOut = {
  date: '2026-11-26',
  discipline: 'Finanças Públicas',
  mode: 'consolidacao_documental_sem_revisao_editorial_nova',
  totals,
  quant_charts_audit: {
    note: 'A comparação exata entre pré-imagem e proposta final na seção 05 comprova 2 gráficos estruturados alterados (e 2 preservados sem alteração na seção 06): (1) "Quantidade de equilíbrio antes e depois da tributação" teve description e data alterados; (2) "Elasticidade e perda de peso morto" teve description alterada ("em mercado sem falhas") e data preservada.',
    charts: chartDiffAudit
  },
  batches: batchEvidence,
  sections: matrix
};

const confOut = {
  checked_at: new Date().toISOString(),
  database_writes: 0,
  parity,
  revision_ids_preserved: 7,
  revision_fingerprint: sha256(actual.sections.map(({ section_id, current_revision_id }) => ({ section_id, current_revision_id }))),
  content_fingerprint: sha256(actual.sections.map(normalizeSectionContent)),
  topics: actual.topics.map(t => ({ ...t, sections: actual.sections.filter(s => s.topic_id === t.topic_id).length })),
  empty_topics: empty,
  bindings_and_physical_catalog_preserved: true,
  archived_topics: physTopicsRes.data.filter(t => t.archived_at),
  redirects_count: redirRes.data.length,
  questions_relations_count: qRelRes.data.length,
  discipline_relations_count: dRelRes.data.length,
  ethics20_contents_and_revisions_preserved: true,
  ethics_revision_fingerprint: sha256(ethics.sections.map(({ section_id, current_revision_id }) => ({ section_id, current_revision_id })))
};

fs.writeFileSync(`${folder}/matriz-aceite.json`, JSON.stringify(matrizOut, null, 2) + '\n');
fs.writeFileSync(`${folder}/conferencia-atual.json`, JSON.stringify(confOut, null, 2) + '\n');
console.log(JSON.stringify({ parity, totals, chartDiffsSummary: chartDiffAudit.map(c => ({ s: c.section_id, idx: c.chart_index, changed: c.changed, fields: c.changed_fields })), ethics20Preserved: true, database_writes: 0 }, null, 2));
