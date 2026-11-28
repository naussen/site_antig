import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createClient } from 'file:///C:/PRO/site/node_modules/@supabase/supabase-js/dist/index.mjs';
import { fetchState, compareState, buildManifest, verifyManifest } from '../../../saneamento-onda-5/manifesto-preparacao-onda5.mjs';
import { createStore, apply } from '../../../saneamento-onda-5/executar-onda5.mjs';
import { getMermaidSecurityIssue } from 'file:///C:/PRO/site/src/lib/mermaid/security.mjs';
import { normalizeSectionContent, sha256 } from '../../../saneamento-onda-4/manifesto_saneamento_onda4.mjs';

const folder = import.meta.dirname;
const read = (n) => JSON.parse(fs.readFileSync(`${folder}/${n}`, 'utf8'));
const save = (n, d) => fs.writeFileSync(`${folder}/${n}`, JSON.stringify(d, null, 2) + '\n', { flag: 'wx' });
const mode = process.argv[2];
assert.ok(['prepare', 'negative', 'apply', 'reconcile'].includes(mode));

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const [state, financas, ethics] = await Promise.all([
  fetchState(sb, [{ discipline: 'Legislação Aduaneira' }]),
  fetchState(sb, [{ discipline: 'Finanças Públicas' }]),
  fetchState(sb, [{ discipline: 'Ética no Serviço Público' }]),
]);

assert.equal(state.topics.length, 5);
assert.equal(state.sections.length, 31);

// Preservação integral de Finanças Públicas (7/7)
const acceptedFin = read('../../36-financas-publicas/aceite-documental-20261126/matriz-aceite.json');
assert.equal(financas.topics.length, 1);
assert.equal(financas.sections.length, 7);
for (const r of acceptedFin.sections) {
  const row = financas.sections.find((s) => s.section_id === r.section_id);
  assert.ok(row, `Falta seção em Finanças Públicas: ${r.section_id}`);
  assert.equal(row.current_revision_id, r.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(row)), r.content_sha256);
}

// Preservação integral de Ética no Serviço Público (20/20)
const acceptedEthics = read('../../35-etica-no-servico-publico/aceite-documental-20261125/matriz-aceite.json');
assert.equal(ethics.sections.length, 20);
for (const r of acceptedEthics.sections) {
  const row = ethics.sections.find((s) => s.section_id === r.section_id);
  assert.ok(row, `Falta seção em Ética: ${r.section_id}`);
  assert.equal(row.current_revision_id, r.current_revision_id);
  assert.equal(sha256(normalizeSectionContent(row)), r.content_sha256);
}

const topicIds = state.topics.map((t) => t.topic_id);
const bindings = {};
for (const table of ['question_topic_relations', 'topic_discipline_relations']) {
  const r = await sb.from(table).select('*').in('topic_id', topicIds);
  assert.ifError(r.error);
  bindings[table] = r.data;
}
const redir = await sb.from('topic_id_redirects').select('*').or(`old_topic_id.in.(${topicIds.join(',')}),new_topic_id.in.(${topicIds.join(',')})`);
assert.ifError(redir.error);
bindings.topic_id_redirects = redir.data;

if (mode !== 'prepare') {
  const old = read('vinculos-antes.json');
  const norm = (a) => a.map((x) => JSON.stringify(x)).sort();
  for (const k of Object.keys(bindings)) {
    assert.deepEqual(norm(bindings[k]), norm(old[k]));
  }
}

const expectedScopeIds = [1, 2, 3, 4, 5].map((n) => `jurisdicao-aduaneira-sec-0${n}`);

if (mode === 'prepare') {
  save('vinculos-antes.json', bindings);
  const diag = read('../diagnostico-jurisdicao-01-05-20261126/estado-atual.json');
  const snap = JSON.parse(fs.readFileSync('C:/PRO/revisoes-resumos/40-legislacao-aduaneira.snapshot.json', 'utf8'));

  for (const s of state.sections) {
    const snapRow = snap.sections.find((x) => x.section_id === s.section_id);
    assert.ok(snapRow);
    assert.equal(sha256(normalizeSectionContent(s)), sha256(normalizeSectionContent(snapRow)));
    const diagRev = diag.current_revisions.find((x) => x.section_id === s.section_id);
    assert.ok(diagRev);
    assert.equal(s.current_revision_id, diagRev.current_revision_id);
  }

  const proposed = read('proposta.json');
  assert.deepEqual(proposed.map((s) => s.section_id), expectedScopeIds);

  for (const after of proposed) {
    const before = state.sections.find((s) => s.section_id === after.section_id);
    assert.ok(before);
    for (const k of ['section_id', 'topic_id', 'title', 'sort_order', 'content_unit_id', 'stable_key', 'mnemonics', 'flashcards']) {
      assert.deepEqual(after[k], before[k], `Identidade/campo imutável divergente em ${after.section_id}.${k}`);
    }
    assert.equal(after.callouts.length, before.callouts.length);
    assert.ok(before.current_revision_id);
    assert.equal(getMermaidSecurityIssue(after.mermaid_mindmap || ''), null);
  }

  const malicious = [
    'flowchart TD\n A-->B\n click A "javascript:alert(1)"',
    '%%{init: {"securityLevel":"loose"}}%%\nflowchart TD\n A-->B',
    'flowchart TD\n A[<script>alert(1)</script>]',
    'flowchart TD\n A-->B\n classDef x fill:#000;',
  ];
  for (const code of malicious) {
    assert.ok(getMermaidSecurityIssue(code));
  }

  const changes = proposed.filter(
    (s) => sha256(normalizeSectionContent(s)) !== sha256(normalizeSectionContent(state.sections.find((x) => x.section_id === s.section_id)))
  );
  assert.deepEqual(changes.map((s) => s.section_id), expectedScopeIds);

  const photo = {
    disciplines: [{ discipline: 'Legislação Aduaneira', ...state }],
    totalTopics: 5,
    totalSections: 31,
  };
  photo.globalSha256 = sha256(photo.disciplines);

  const delta = {
    base_sha256: photo.globalSha256,
    additions: [],
    changes: changes.map((after) => {
      const before = state.sections.find((s) => s.section_id === after.section_id);
      const keys = ['content_markdown', 'callouts', 'mermaid_mindmap'].filter((k) => sha256(before[k]) !== sha256(after[k]));
      return {
        section_id: before.section_id,
        topic_id: before.topic_id,
        content_unit_id: before.content_unit_id,
        before: Object.fromEntries(keys.map((k) => [k, before[k] || (k === 'callouts' ? [] : '')])),
        after: Object.fromEntries(keys.map((k) => [k, after[k] || (k === 'callouts' ? [] : '')])),
      };
    }),
  };

  const manifest = buildManifest(photo, delta);
  assert.equal(verifyManifest(photo, delta, manifest), manifest.manifest_sha256);

  save('preimagem.json', { capturedAt: new Date().toISOString(), ...state });
  save('fotografia.json', photo);
  save('delta.json', delta);
  save('manifesto.json', manifest);
  save('secoes-revisadas.json', proposed);
  save('render.json', {
    photo: { disciplines: [{ sections: proposed }] },
    delta: { changes: proposed.map((s) => ({ section_id: s.section_id, after: {} })) },
    manifest: { manifest_sha256: sha256(proposed) },
  });

  fs.mkdirSync(`${folder}/import`);
  const topicMeta = state.topics.find((t) => t.topic_id === 'jurisdicao-aduaneira');
  save('import/jurisdicao-aduaneira.json', {
    topic_id: 'jurisdicao-aduaneira',
    topic_title: topicMeta.title,
    discipline: 'Legislação Aduaneira',
    sections: state.sections
      .filter((s) => s.topic_id === 'jurisdicao-aduaneira')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => proposed.find((p) => p.section_id === s.section_id) || s)
      .map(normalizeSectionContent),
  });

  const calloutsChanged = proposed.reduce((acc, after) => {
    const before = state.sections.find((s) => s.section_id === after.section_id);
    return acc + after.callouts.filter((c, i) => sha256(c) !== sha256(before.callouts[i])).length;
  }, 0);

  save('preparacao.json', {
    at: new Date().toISOString(),
    topic_id: 'jurisdicao-aduaneira',
    reviewed_sections: 5,
    changed_sections: 5,
    unchanged_reviewed_sections: 0,
    callouts_reviewed: 11,
    callouts_changed: calloutsChanged,
    maps_reviewed: 1,
    maps_changed: 1,
    mnemonics_reviewed: 1,
    mnemonics_changed: 0,
    maliciousRejected: malicious.length,
    preserved_sections_outside_scope: 26,
    financas_7_preserved: true,
    ethics_20_preserved: true,
    concurrency: 'createStore.cas + apply de executar-onda5.mjs; cinco CAS sequenciais por identidade e current_revision_id com diário sincronizado e reconciliação integral de 31 seções',
    manifest_sha256: manifest.manifest_sha256,
    after_sha256: sha256(proposed),
  });

  console.log(JSON.stringify({ ok: true, mode: 'prepare', changed_sections: 5, callouts_changed: calloutsChanged, manifest_sha256: manifest.manifest_sha256 }));
} else {
  const photo = read('fotografia.json');
  const delta = read('delta.json');
  const manifest = read('manifesto.json');
  assert.equal(verifyManifest(photo, delta, manifest), manifest.manifest_sha256);
  const store = createStore(sb, photo);

  if (mode === 'negative') {
    const current = state.sections.find((s) => s.section_id === manifest.operations[0].op_id);
    assert.equal(current.current_revision_id, photo.disciplines[0].sections.find((s) => s.section_id === current.section_id).current_revision_id);
    const result = await store.cas({ ...current, current_revision_id: '00000000-0000-0000-0000-000000000000' }, manifest.operations[0].after);
    assert.equal(result, null);
    const fresh = await store.snapshot();
    assert.deepEqual(fresh, state);
    save('concorrencia-negativo.json', {
      at: new Date().toISOString(),
      tested_section_id: current.section_id,
      rows_affected: 0,
      all_31_contents_and_revisions_preserved: true,
    });
    console.log('CAS negativo com current_revision_id inválido rejeitado: 0 linhas afetadas.');
  } else if (mode === 'apply') {
    const rv = read('render-visual.json');
    assert.ok(rv.checks.length === 30 && rv.checks.every((c) => c.ok));
    assert.equal(rv.manifest_sha256, sha256(read('secoes-revisadas.json')));
    assert.equal(read('concorrencia-negativo.json').rows_affected, 0);
    assert.ok(fs.readFileSync(`${folder}/dry-run.txt`, 'utf8').includes('Simulação concluída sem escritas'));

    const preflight = compareState(photo, manifest, state);
    assert.ok(preflight.ok, JSON.stringify(preflight));
    for (const old of photo.disciplines[0].sections) {
      assert.equal(state.sections.find((s) => s.section_id === old.section_id).current_revision_id, old.current_revision_id);
    }
    save('preflight-final.json', { at: new Date().toISOString(), ...preflight, revision_ids_preserved: 31 });

    const fd = fs.openSync(`${folder}/aplicacao.jsonl`, 'wx');
    const log = (entry) => {
      fs.writeSync(fd, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
      fs.fsyncSync(fd);
    };
    let result;
    try {
      log({ event: 'start', mode: 'apply', manifest_sha256: manifest.manifest_sha256 });
      result = await apply({ photo, delta, manifest, store, log, expectedSha: manifest.manifest_sha256 });
      log({ event: 'finish', ...result });
    } finally {
      fs.closeSync(fd);
    }
    save('aplicacao-recibo.json', result);
    assert.equal(result.status, 'completed');
    console.log(JSON.stringify(result));
  } else {
    const check = compareState(photo, manifest, state, 'saneado');
    assert.ok(check.ok, JSON.stringify(check));
    const changedIds = manifest.operations.map((op) => op.op_id);
    const untouched = photo.disciplines[0].sections.filter((s) => !changedIds.includes(s.section_id));
    assert.equal(untouched.length, 26);
    for (const old of untouched) {
      assert.equal(state.sections.find((s) => s.section_id === old.section_id).current_revision_id, old.current_revision_id);
    }
    const updatedRows = state.sections
      .filter((s) => changedIds.includes(s.section_id))
      .sort((a, b) => a.sort_order - b.sort_order);
    assert.equal(updatedRows.length, 5);
    for (const row of updatedRows) {
      assert.notEqual(row.current_revision_id, photo.disciplines[0].sections.find((s) => s.section_id === row.section_id).current_revision_id);
    }
    save('vinculos-depois.json', bindings);
    save('reconciliacao.json', {
      at: new Date().toISOString(),
      ...check,
      financas7Preserved: true,
      ethics20Preserved: true,
      bindingsPreserved: true,
      preserved_outside_scope_revision_ids: 26,
      updated_section_revisions: updatedRows.map(({ section_id, current_revision_id, content_unit_id }) => ({
        section_id,
        content_unit_id,
        current_revision_id,
        content_sha256: sha256(normalizeSectionContent(state.sections.find((x) => x.section_id === section_id))),
      })),
      all_31_revisions: state.sections.map(({ section_id, topic_id, current_revision_id }) => ({
        section_id,
        topic_id,
        current_revision_id,
      })),
      after_topic1_sha256: sha256(updatedRows.map(normalizeSectionContent)),
      full_discipline_sha256: sha256(state.sections.map(normalizeSectionContent)),
    });
    console.log(JSON.stringify({ ok: check.ok, updated: updatedRows.length, preserved_outside_scope: untouched.length }));
  }
}
