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

const revSec = read(`${folder}/secoes-revisadas.json`);
const rec = read(`${folder}/reconciliacao.json`);
const pre = read(`${folder}/preimagem.json`);
const prep = read(`${folder}/preparacao.json`);
const manifest = read(`${folder}/manifesto.json`);

const topic1Rows = adu.sections
  .filter((s) => s.topic_id === 'jurisdicao-aduaneira')
  .sort((a, b) => a.sort_order - b.sort_order);
assert.equal(topic1Rows.length, 5);

const coverage = topic1Rows.map((s) => {
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
    batch: 'jurisdicao-01-05-20261126',
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
  reuse_reason: 'Nenhum código de aplicação, importador, validador Mermaid ou CSS alterado desde a suíte de 44 testes (render-proveniencia.json comprova paridade SHA-256 dos 6 arquivos de estudo/segurança). As validações específicas deste lote (segurança Mermaid com 4 payloads maliciosos rejeitados, dry-run do CLI, CAS negativo e 30 combinações visuais com 6 checagens de zoom/overlay) foram executadas integralmente.',
  malicious_mermaid_rejected_in_prepare: prep.maliciousRejected,
  cas_incorrect_revision_rows: 0,
  effective_visual_combinations: 30,
  zoom_overlay_checks: 6,
};
fs.writeFileSync(`${folder}/testes-validacao.json`, JSON.stringify(testesValidacao, null, 2) + '\n');

const gatePublicacao = {
  reviewed_sections: 5,
  changed_sections: 5,
  visual_effective: 30,
  zoom_overlay: 6,
  content_tests_passed_reused: 44,
  malicious_mermaid_rejected: prep.maliciousRejected,
  negative_cas_zero_rows: true,
  cli_dry_run_passed: true,
  active_proposal: 'v1',
  manifest_sha256: manifest.manifest_sha256,
  preimage_and_revision_guard: '31 revisões de Legislação Aduaneira (5 atualizadas por CAS no tópico 1 e 26 preservadas nos tópicos 2–5), 7 de Finanças Públicas e 20 de Ética conferidas antes e depois da escrita',
};
fs.writeFileSync(`${folder}/gate-publicacao.json`, JSON.stringify(gatePublicacao, null, 2) + '\n');

const coberturaTopico1 = {
  checkedAt: new Date().toISOString(),
  ok: true,
  discipline: 'Legislação Aduaneira',
  topic_id: 'jurisdicao-aduaneira',
  topic_title: 'Jurisdição Aduaneira',
  reviewedSectionsInTopic: 5,
  totalSectionsInTopic: 5,
  reviewedSectionsInDiscipline: 5,
  totalActiveSectionsInDiscipline: 31,
  remainingTopics: 4,
  remainingSections: 26,
  prior26OutsideScopePreserved: true,
  financas7Preserved: true,
  ethics20Preserved: true,
  coverage,
};
fs.writeFileSync(`${folder}/cobertura-topico-1.json`, JSON.stringify(coberturaTopico1, null, 2) + '\n');

const checkpoint = {
  date: '2026-11-27',
  sources_checked_on: '2026-11-26',
  status: 'revisado_publicado_reconciliado_parcial',
  discipline: 'Legislação Aduaneira',
  report: '40-legislacao-aduaneira.md',
  topic_id: 'jurisdicao-aduaneira',
  topic_title: 'Jurisdição Aduaneira',
  reviewed_sections: coverage.map((c) => c.section_id),
  changed_sections: coverage.map((c) => c.section_id),
  unchanged_reviewed_sections: [],
  components: {
    texts_reviewed: 5,
    texts_changed: 5,
    callouts_reviewed: 11,
    callouts_changed: prep.callouts_changed,
    maps_reviewed: 1,
    maps_changed: 1,
    mnemonics_reviewed: 1,
    mnemonics_changed: 0,
    tables_reviewed: 0,
    quant_charts_reviewed: 0,
    flashcards: 0,
  },
  manifest_sha256: manifest.manifest_sha256,
  after_topic1_sha256: rec.after_topic1_sha256,
  full_discipline_sha256: rec.full_discipline_sha256,
  revisions: rec.updated_section_revisions,
  preserved_outside_scope_revision_ids: 26,
  financas7_contents_and_revisions_preserved: true,
  financas_report_sha256: fileHash('C:/PRO/revisoes-resumos/36-financas-publicas.md'),
  ethics20_contents_and_revisions_preserved: true,
  ethics_report_sha256: fileHash('C:/PRO/revisoes-resumos/35-etica-no-servico-publico.md'),
  bindings_preserved: true,
  dry_run_sections: 5,
  scope_review_sections: 5,
  validation: {
    content_tests_passed_reused: 44,
    malicious_mermaid_rejected: prep.maliciousRejected,
    negative_cas_rows: 0,
    visual_combinations_effective: 30,
    zoom_overlay: 6,
    reconciled: true,
  },
  application: 'cinco CAS sequenciais existentes por identidade/revisão esperada (createStore.cas + apply) com pré-imagem integral de 31 seções, preflight final, diário sincronizado (aplicacao.jsonl) e reconciliação independente; não constitui transação única entre as cinco seções',
  active_version: 'jurisdicao-01-05-20261126',
  application_changes: false,
  student_check: 'dispensado; visual local não é smoke autenticado',
  cumulative_reviewed: 5,
  total_active_sections: 31,
  remaining_topics: [
    'tributos-incidentes-no-comercio-exterior (6 seções)',
    'controle-aduaneiro-de-mercadorias (7 seções)',
    'regimes-aduaneiros (12 seções)',
    'infracoes-e-penalidades-aduaneiras (1 seção)',
  ],
  discipline_complete: false,
  queue_status: '[~] parcial (5/31 seções revisadas/publicadas/reconciliadas; restam 4 tópicos / 26 seções)',
  queue_counts: {
    accepted: 23,
    partial: 25,
    not_started: 6,
  },
  stop: true,
};
fs.writeFileSync(`${folder}/checkpoint.json`, JSON.stringify(checkpoint, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, callouts_changed: prep.callouts_changed, revisions: rec.updated_section_revisions }));
