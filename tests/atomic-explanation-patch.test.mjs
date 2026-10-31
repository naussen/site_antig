import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasCredentials = Boolean(url && serviceKey);

const adminClient = hasCredentials
  ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const anonClient = hasCredentials && anonKey
  ? createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

function sha256(text) {
  return createHash("sha256").update(Buffer.from(text || "", "utf8")).digest("hex");
}

test("segurança de privilégios: anon não pode invocar funções atômicas administrativas", async (t) => {
  if (!hasCredentials || !anonClient) {
    t.skip("Credenciais do Supabase ausentes no ambiente do runner.");
    return;
  }
  const { error: applyErr } = await anonClient.rpc("apply_atomic_explanation_patches", {
    p_payload: { atomic_unit: "batch", patches: [] },
  });
  assert.ok(applyErr, "Anon não deve conseguir chamar apply_atomic_explanation_patches");

  const { error: rbErr } = await anonClient.rpc("rollback_atomic_explanation_patches", {
    p_payload: { atomic_unit: "batch", items: [] },
  });
  assert.ok(rbErr, "Anon não deve conseguir chamar rollback_atomic_explanation_patches");
});

test("lote com ID inexistente deve abortar com erro", async (t) => {
  if (!hasCredentials) {
    t.skip("Credenciais do Supabase ausentes no ambiente do runner.");
    return;
  }
  const fakeId = "00000000-0000-0000-0000-000000000000";
  const fakeHash = "a".repeat(64);

  const { data, error } = await adminClient.rpc("apply_atomic_explanation_patches", {
    p_payload: {
      atomic_unit: "batch",
      patches: [
        {
          question_id: fakeId,
          expected_explanation_sha256: fakeHash,
          new_body_markdown: "Novo texto teste",
        },
      ],
    },
  });

  assert.ok(error, "Deve retornar erro para questão inexistente em modo batch");
  assert.match(error.message, /nao encontrada/iu);
});

test("transação atômica de lote com falha intermediária desfaz todo o lote (all-or-nothing)", async (t) => {
  if (!hasCredentials) {
    t.skip("Credenciais do Supabase ausentes no ambiente do runner.");
    return;
  }
  // Buscar 2 questões reais para testar
  const { data: samples, error: sErr } = await adminClient
    .from("question_explanations")
    .select("question_id, body_markdown")
    .limit(2);
  assert.equal(sErr, null);
  assert.equal(samples.length, 2);

  const q1 = samples[0];
  const q2 = samples[1];
  const q1Original = q1.body_markdown;
  const q2Original = q2.body_markdown;
  const q1Hash = sha256(q1Original);
  const q2BogusHash = "f".repeat(64); // hash errado para forçar erro no 2º item!

  const { data, error } = await adminClient.rpc("apply_atomic_explanation_patches", {
    p_payload: {
      atomic_unit: "batch",
      patches: [
        {
          question_id: q1.question_id,
          expected_explanation_sha256: q1Hash,
          new_body_markdown: "Texto temporário q1 que NAO deve persistir",
        },
        {
          question_id: q2.question_id,
          expected_explanation_sha256: q2BogusHash,
          new_body_markdown: "Texto temporário q2",
        },
      ],
    },
  });

  assert.ok(error, "Deve falhar no 2º item");
  assert.match(error.message, /alteracao concorrente|sofreu alteracao/iu);

  // Verificar que q1 NÃO foi alterado no banco (atomicidade do lote comprovada)
  const { data: checkQ1 } = await adminClient
    .from("question_explanations")
    .select("body_markdown")
    .eq("question_id", q1.question_id)
    .single();

  assert.equal(checkQ1.body_markdown, q1Original, "q1 deve permanecer idêntico ao original (rollback total do lote)");
});

test("ciclo completo: aplicação atômica, idempotência, proteção concorrente e rollback condicionado", async (t) => {
  if (!hasCredentials) {
    t.skip("Credenciais do Supabase ausentes no ambiente do runner.");
    return;
  }
  // Pegar uma questão real para teste
  const { data: sample, error: sErr } = await adminClient
    .from("question_explanations")
    .select("question_id, body_markdown")
    .limit(1)
    .single();
  assert.equal(sErr, null);

  const qId = sample.question_id;
  const originalBody = sample.body_markdown;
  const originalHash = sha256(originalBody);

  const patchBody = originalBody + "\n\n<!-- TEST_TAG_ATOMIC_45 -->";
  const patchHash = sha256(patchBody);

  // 1. Aplicação bem-sucedida
  const { data: applyRes, error: applyErr } = await adminClient.rpc("apply_atomic_explanation_patches", {
    p_payload: {
      atomic_unit: "batch",
      patches: [
        {
          question_id: qId,
          expected_explanation_sha256: originalHash,
          new_body_markdown: patchBody,
          reason: "Teste de gravação atômica",
        },
      ],
    },
  });
  assert.equal(applyErr, null, "Aplicação legítima deve ter sucesso");
  assert.equal(applyRes.success, true);
  assert.equal(applyRes.applied_count, 1);

  // Conferir leitura no banco
  const { data: readAfterApply } = await adminClient
    .from("question_explanations")
    .select("body_markdown")
    .eq("question_id", qId)
    .single();
  assert.equal(readAfterApply.body_markdown, patchBody);

  // 2. Execução repetida imediata (idempotência segura):
  // O esperado originalHash não bate mais com o estado do banco (que agora é patchHash).
  const { error: repeatErr } = await adminClient.rpc("apply_atomic_explanation_patches", {
    p_payload: {
      atomic_unit: "batch",
      patches: [
        {
          question_id: qId,
          expected_explanation_sha256: originalHash,
          new_body_markdown: patchBody,
        },
      ],
    },
  });
  assert.ok(repeatErr, "Reexecução com hash desatualizado deve ser rejeitada");

  // 3. Rollback com hash divergente (simulando que outra pessoa editou após o patch) deve abortar!
  const wrongAppliedHash = "b".repeat(64);
  const { error: wrongRbErr } = await adminClient.rpc("rollback_atomic_explanation_patches", {
    p_payload: {
      atomic_unit: "batch",
      items: [
        {
          question_id: qId,
          applied_sha256: wrongAppliedHash,
          restore_body_markdown: originalBody,
        },
      ],
    },
  });
  assert.ok(wrongRbErr, "Rollback deve abortar se hash aplicado divergir do estado atual");
  assert.match(wrongRbErr.message, /rollback abortado/iu);

  // 4. Rollback normal bem-sucedido
  const { data: rbRes, error: rbErr } = await adminClient.rpc("rollback_atomic_explanation_patches", {
    p_payload: {
      atomic_unit: "batch",
      items: [
        {
          question_id: qId,
          applied_sha256: patchHash,
          restore_body_markdown: originalBody,
          reason: "Reversão do teste atômico",
        },
      ],
    },
  });
  assert.equal(rbErr, null, "Rollback condicionado com hash coincidente deve suceder");
  assert.equal(rbRes.success, true);

  // Conferir restauração fiel no banco
  const { data: readAfterRollback } = await adminClient
    .from("question_explanations")
    .select("body_markdown")
    .eq("question_id", qId)
    .single();
  assert.equal(readAfterRollback.body_markdown, originalBody, "O estado original deve ser restaurado perfeitamente");
});
