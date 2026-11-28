import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from 'file:///C:/PRO/site/node_modules/@supabase/supabase-js/dist/index.mjs';
import { fetchState } from '../../../saneamento-onda-5/manifesto-preparacao-onda5.mjs';
import { normalizeSectionContent, sha256 } from '../../../saneamento-onda-4/manifesto_saneamento_onda4.mjs';

const folder = import.meta.dirname;
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const fileHash = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const [adu, fin, eth] = await Promise.all([
  fetchState(sb, [{ discipline: 'Legislação Aduaneira' }]),
  fetchState(sb, [{ discipline: 'Finanças Públicas' }]),
  fetchState(sb, [{ discipline: 'Ética no Serviço Público' }]),
]);

assert.equal(adu.topics.length, 5);
assert.equal(adu.sections.length, 31);
assert.equal(fin.topics.length, 1);
assert.equal(fin.sections.length, 7);
assert.equal(eth.sections.length, 20);

const finMat = read(`${folder}/../../36-financas-publicas/aceite-documental-20261126/matriz-aceite.json`);
for (const r of finMat.sections) {
  const row = fin.sections.find((s) => s.section_id === r.section_id);
  assert.ok(row);
  assert.equal(row.current_revision_id, r.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(row)), r.content_sha256);
}

const ethMat = read(`${folder}/../../35-etica-no-servico-publico/aceite-documental-20261125/matriz-aceite.json`);
for (const r of ethMat.sections) {
  const row = eth.sections.find((s) => s.section_id === r.section_id);
  assert.ok(row);
  assert.equal(row.current_revision_id, r.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(row)), r.content_sha256);
}

const topic1Cp = read(`${folder}/../jurisdicao-01-05-20261126/checkpoint.json`);
for (const r of topic1Cp.revisions) {
  const row = adu.sections.find((s) => s.section_id === r.section_id);
  assert.ok(row);
  assert.equal(row.current_revision_id, r.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(row)), r.content_sha256);
}

const revSec = read(`${folder}/secoes-revisadas.json`);
const rec = read(`${folder}/reconciliacao.json`);
const pre = read(`${folder}/preimagem.json`);
const prep = read(`${folder}/preparacao.json`);
const manifest = read(`${folder}/manifesto.json`);

const scopeIds = revSec.map((x) => x.section_id);
const scopeRows = adu.sections
  .filter((s) => scopeIds.includes(s.section_id))
  .sort((a, b) => a.sort_order - b.sort_order);
assert.equal(scopeRows.length, 4);

const remainingTopic2 = adu.sections
  .filter((s) => s.topic_id === 'tributos-incidentes-no-comercio-exterior' && !scopeIds.includes(s.section_id))
  .sort((a, b) => a.sort_order - b.sort_order);
assert.equal(remainingTopic2.length, 2);
for (const rem of remainingTopic2) {
  const preRem = pre.sections.find((x) => x.section_id === rem.section_id);
  assert.equal(rem.current_revision_id, preRem.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(rem)), sha256(normalizeSectionContent(preRem)));
}

const coverage = scopeRows.map((s) => {
  const expected = revSec.find((x) => x.section_id === s.section_id);
  assert.ok(expected);
  const contentSha = sha256(normalizeSectionContent(s));
  assert.equal(contentSha, sha256(normalizeSectionContent(expected)));
  return {
    section_id: s.section_id,
    title: s.title,
    sort_order: s.sort_order,
    content_unit_id: s.content_unit_id,
    stable_key: s.stable_key,
    batch: 'tributos-01-04-20261128',
    editorial_disposition: 'corrigida_publicada_reconciliada',
    before_revision_id: pre.sections.find((x) => x.section_id === s.section_id).current_revision_id,
    current_revision_id: s.current_revision_id,
    content_sha256: contentSha,
    callouts: s.callouts.length,
    mermaid: Boolean(s.mermaid_mindmap),
    mnemonics: s.mnemonics.length,
    flashcards: s.flashcards.length,
    visual_checks: 6,
  };
});

const suitePath = 'C:/PRO/revisoes-resumos/orquestracao-03-54/saneamento-onda-7/36-financas-publicas/secoes-01-04-20261126/test-content.txt';
const testesValidacao = {
  content_tests_passed_reused: 44,
  suite_ran_in: '../../36-financas-publicas/secoes-01-04-20261126/test-content.txt',
  suite_sha256: fileHash(suitePath),
  reuse_reason: 'Nenhum código de aplicação, importador, validador Mermaid ou CSS alterado desde a suíte de 44 testes (render-proveniencia.json comprova paridade SHA-256 dos 6 arquivos de estudo/segurança). As validações específicas deste lote (segurança Mermaid com 4 payloads maliciosos rejeitados, dry-run do CLI, CAS negativo e 24 combinações visuais com tabelas, KaTeX e 18 checagens de zoom/overlay nos 3 mapas) foram executadas integralmente.',
  malicious_mermaid_rejected_in_prepare: prep.maliciousRejected,
  cas_incorrect_revision_rows: 0,
  effective_visual_combinations: 24,
  zoom_overlay_checks: 18,
};
fs.writeFileSync(`${folder}/testes-validacao.json`, JSON.stringify(testesValidacao, null, 2) + '\n');

const gatePublicacao = {
  reviewed_sections: 4,
  changed_sections: 4,
  visual_effective: 24,
  zoom_overlay: 18,
  content_tests_passed_reused: 44,
  malicious_mermaid_rejected: prep.maliciousRejected,
  negative_cas_zero_rows: true,
  cli_dry_run_passed: true,
  active_proposal: 'v1',
  manifest_sha256: manifest.manifest_sha256,
  preimage_and_revision_guard: '31 revisões de Legislação Aduaneira (4 atualizadas por CAS em Tributos 01–04, 5 preservadas de Jurisdição 01–05, 2 preservadas em Tributos 05–06 e 20 preservadas nos tópicos 03–05), 7 de Finanças Públicas e 20 de Ética conferidas antes e depois da escrita',
};
fs.writeFileSync(`${folder}/gate-publicacao.json`, JSON.stringify(gatePublicacao, null, 2) + '\n');

const coberturaLote = {
  checkedAt: new Date().toISOString(),
  ok: true,
  discipline: 'Legislação Aduaneira',
  topic_id: 'tributos-incidentes-no-comercio-exterior',
  topic_title: 'Tributos Incidentes no Comércio Exterior',
  reviewedSectionsInBatch: 4,
  totalSectionsInTopic: 6,
  remainingSectionsInTopic: remainingTopic2.map((r) => ({
    section_id: r.section_id,
    title: r.title,
    current_revision_id: r.current_revision_id,
  })),
  reviewedSectionsInDisciplineCumulative: 9,
  totalActiveSectionsInDiscipline: 31,
  remainingUnreviewedSectionsInDiscipline: 22,
  topic1Jurisdicao5Preserved: true,
  prior27OutsideScopePreserved: true,
  financas7Preserved: true,
  ethics20Preserved: true,
  coverage,
};
fs.writeFileSync(`${folder}/cobertura-tributos-01-04.json`, JSON.stringify(coberturaLote, null, 2) + '\n');

const checkpoint = {
  date: '2026-11-28',
  sources_checked_on: '2026-11-28',
  status: 'revisado_publicado_reconciliado_parcial',
  discipline: 'Legislação Aduaneira',
  report: '40-legislacao-aduaneira.md',
  topic_id: 'tributos-incidentes-no-comercio-exterior',
  topic_title: 'Tributos Incidentes no Comércio Exterior',
  reviewed_sections: coverage.map((c) => c.section_id),
  changed_sections: coverage.map((c) => c.section_id),
  unchanged_reviewed_sections: [],
  remaining_in_topic: remainingTopic2.map((r) => ({
    section_id: r.section_id,
    title: r.title,
    current_revision_id: r.current_revision_id,
  })),
  components: {
    texts_reviewed: 4,
    texts_changed: 4,
    callouts_reviewed: 9,
    callouts_changed: prep.callouts_changed,
    maps_reviewed: 3,
    maps_changed: 3,
    tables_reviewed: 2,
    tables_changed: 2,
    formulas_reviewed: 2,
    formulas_changed: 2,
    mnemonics_reviewed: 1,
    mnemonics_changed: 0,
    quant_charts_reviewed: 0,
    flashcards: 0,
  },
  manifest_sha256: manifest.manifest_sha256,
  after_tributos_01_04_sha256: rec.after_tributos_01_04_sha256,
  full_discipline_sha256: rec.full_discipline_sha256,
  revisions: rec.updated_section_revisions,
  preserved_outside_scope_revision_ids: 27,
  topic1_jurisdicao_5_preserved: true,
  financas7_contents_and_revisions_preserved: true,
  financas_report_sha256: fileHash('C:/PRO/revisoes-resumos/36-financas-publicas.md'),
  ethics20_contents_and_revisions_preserved: true,
  ethics_report_sha256: fileHash('C:/PRO/revisoes-resumos/35-etica-no-servico-publico.md'),
  bindings_preserved: true,
  dry_run_sections: 6,
  scope_review_sections: 4,
  validation: {
    content_tests_passed_reused: 44,
    malicious_mermaid_rejected: prep.maliciousRejected,
    negative_cas_rows: 0,
    visual_combinations_effective: 24,
    zoom_overlay: 18,
    reconciled: true,
  },
  application: 'quatro CAS sequenciais existentes por identidade/revisão esperada (createStore.cas + apply) com pré-imagem integral de 31 seções, preflight final, diário sincronizado (aplicacao.jsonl) e reconciliação independente; não constitui transação única entre as quatro seções',
  active_version: 'tributos-01-04-20261128',
  application_changes: false,
  student_check: 'dispensado; visual local não é smoke autenticado',
  cumulative_reviewed: 9,
  total_active_sections: 31,
  remaining_unreviewed: [
    'tributos-incidentes-no-comercio-exterior (seções 05–06: 2 seções)',
    'controle-aduaneiro-de-mercadorias (7 seções)',
    'regimes-aduaneiros (12 seções)',
    'infracoes-e-penalidades-aduaneiras (1 seção)',
  ],
  discipline_complete: false,
  queue_status: '[~] parcial (9/31 seções revisadas/publicadas/reconciliadas; restam 22 seções pendentes)',
  queue_counts: {
    accepted: 23,
    partial: 25,
    not_started: 6,
  },
  stop: true,
};
fs.writeFileSync(`${folder}/checkpoint.json`, JSON.stringify(checkpoint, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, callouts_changed: prep.callouts_changed, revisions: rec.updated_section_revisions }));
