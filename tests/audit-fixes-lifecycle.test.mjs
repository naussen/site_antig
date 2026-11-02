import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("auditoria editorial: integridade do lote revisado e manifesto do TJSP 2021", async () => {
  const batchPath = path.join(ROOT, "docs/questoes-workflow/tjsp_2021_revisado_20261031.json");
  const manifestPath = path.join(ROOT, "docs/questoes-workflow/tjsp_2021_manifesto_20261031.json");

  const batchRaw = await readFile(batchPath, "utf8");
  const manifestRaw = await readFile(manifestPath, "utf8");

  const batch = JSON.parse(batchRaw);
  const manifestData = JSON.parse(manifestRaw);
  const manifest = Array.isArray(manifestData) ? manifestData : manifestData.questions;

  // 1. Contagens estritas da população do certame (Caderno Versão 2)
  assert.equal(manifest.length, 100, "Manifesto deve conter 100 registros");
  assert.equal(batch.length, 96, "Lote de questões prontas deve conter exatamente 96 itens");

  const heldItems = manifest.filter((m) => m.disposition === "held");
  assert.equal(heldItems.length, 4, "Exatamente 4 itens devem ter disposition 'held'");
  const heldItemNumbers = new Set(heldItems.map((m) => m.origin.item_number));
  assert.deepEqual(heldItemNumbers, new Set([30, 78, 87, 97]), "Itens anulados devem ser 30, 78, 87 e 97");

  // 2. Todos os 23 itens dependentes de texto possuem contexto íntegro
  const dependentItemNumbers = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17,
    19, 20, 21, 22,
    23, 24
  ];

  for (const num of dependentItemNumbers) {
    const q = batch.find((item) => item.external_id.endsWith(`:${String(num).padStart(3, "0")}`));
    assert.ok(q, `Item ${num} deve existir no lote pronto`);
    assert.ok(q.source_metadata?.statement_parts?.context, `Item ${num} deve ter source_metadata.statement_parts.context`);
    assert.ok(q.statement_markdown.includes("## Texto-base"), `Item ${num} deve incluir seção ## Texto-base`);
  }

  // 3. Taxonomia sem desvios para os casos identificados na auditoria
  // Q83: Informática / Ferramentas de Escritório
  const q83 = batch.find((item) => item.external_id.endsWith(":083"));
  assert.equal(q83.topics[0].topic_id, "ferramentas-de-escritorio-office-e-libreoffice");
  assert.ok(q83.statement_markdown.includes("| | A | B | C | D |"), "Q83 deve conter planilha Excel");

  // Q47: Direitos e garantias fundamentais
  const q47 = batch.find((item) => item.external_id.endsWith(":047"));
  assert.equal(q47.topics[0].topic_id, "direitos-e-garantias-fundamentais");
  assert.ok(q47.explanation.body_markdown.includes("art. 7º, XXV"), "Q47 deve citar art. 7º, XXV");

  // Q48: Nacionalidade e direitos políticos
  const q48 = batch.find((item) => item.external_id.endsWith(":048"));
  assert.equal(q48.topics[0].topic_id, "nacionalidade-e-direitos-politicos");
  assert.ok(q48.explanation.body_markdown.includes("art. 12"), "Q48 deve citar art. 12 da CF");

  // Q49: Nacionalidade e direitos políticos (cargos privativos de nato)
  const q49 = batch.find((item) => item.external_id.endsWith(":049"));
  assert.equal(q49.topics[0].topic_id, "nacionalidade-e-direitos-politicos");
  assert.ok(q49.explanation.body_markdown.includes("art. 12, § 3º") && q49.explanation.body_markdown.includes("oficial das Forças Armadas"), "Q49 deve citar art. 12, § 3º e oficial das Forças Armadas");

  // 4. Nenhum comentário genérico
  for (const q of batch) {
    assert.ok(
      !q.explanation.body_markdown.includes("em estrita conformidade com o edital"),
      `Item ${q.external_id} não pode usar template genérico`
    );
    assert.ok(q.explanation.body_markdown.length >= 80, `Item ${q.external_id} explicação insuficiente`);
  }

  // 5. Rastreabilidade física do manifesto
  const m83 = manifest.find((m) => m.origin.item_number === 83);
  assert.equal(m83.origin.page, 22, "Q83 origin.page deve ser 22");
  assert.equal(m83.answer.page, 1, "Gabarito da Versão 2 deve ser página 1");
});
