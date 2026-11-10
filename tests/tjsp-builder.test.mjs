import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("tjsp_builder: gera 100 itens com textos-base, alternativas limpas, gabarito definitivo e taxonomia canônica", (context) => {
  const script = `
import os
from tjsp_builder import EXAM_PDF_PATH, build_tjsp_questions

if not EXAM_PDF_PATH.is_file():
    if os.environ.get("TJSP_EXAM_PDF"):
        raise FileNotFoundError("O PDF configurado em TJSP_EXAM_PDF não foi encontrado")
    raise SystemExit(77)

ready, manifest = build_tjsp_questions()

# Validações estruturais
assert len(ready) == 96, f"Esperadas 96 questões prontas, obtidas {len(ready)}"
assert len(manifest) == 100, f"Esperados 100 registros no manifesto, obtidos {len(manifest)}"

# 1. F01: Questão 6 tem texto-base completo com lacunas
q6 = next(q for q in ready if q['external_id'].endswith('006'))
assert "Texto-base" in q6['statement_markdown'], "Questão 6 deve ter seção Texto-base"
assert "Perto do apagão" in q6['statement_markdown'], "Texto-base da questão 6 deve conter o editorial"
assert "______" in q6['statement_markdown'], "Texto-base da questão 6 deve conter as lacunas"

# 2. F02: Alternativa E da questão 22 sem contaminação das questões 23/24
q22 = next(q for q in ready if q['external_id'].endswith('022'))
opt_e_22 = next(o for o in q22['options'] if o['label'] == 'E')
assert "Leia o texto para responder" not in opt_e_22['body_markdown'], "Alternativa E da Q22 não pode conter texto de outras questões"
assert "Motivação" not in opt_e_22['body_markdown'], "Alternativa E da Q22 não pode conter texto da questão 23/24"
assert opt_e_22['body_markdown'].endswith("conferir."), "Alternativa E da Q22 deve terminar em 'conferir.'"

# 3. F01: Questão 83 contém a planilha de Excel em tabela Markdown
q83 = next(q for q in ready if q['external_id'].endswith('083'))
assert "| | A | B | C | D |" in q83['statement_markdown'], "Questão 83 deve conter a tabela da planilha"
assert "Planejamento" in q83['statement_markdown'], "Tabela da Q83 deve conter dados da planilha"

# 4. F03: Taxonomia oficial correta
q80 = next(q for q in ready if q['external_id'].endswith('080'))
assert q80['topics'][0]['topic_id'] == "sistemas-operacionais-windows-e-linux", "Q80 deve ser Informática/Windows"
assert q83['topics'][0]['topic_id'] == "ferramentas-de-escritorio-office-e-libreoffice", "Q83 deve ser Informática/Office"

q47 = next(q for q in ready if q['external_id'].endswith('047'))
assert q47['topics'][0]['topic_id'] == "direitos-e-garantias-fundamentais", "Q47 deve ser Direitos Fundamentais/Sociais"

q48 = next(q for q in ready if q['external_id'].endswith('048'))
assert q48['topics'][0]['topic_id'] == "nacionalidade-e-direitos-politicos", "Q48 deve ser Nacionalidade"

q50 = next(q for q in ready if q['external_id'].endswith('050'))
assert q50['topics'][0]['topic_id'] == "administracao-publica", "Q50 deve ser Administração Pública/Servidores"

# 5. F05: Gabarito Oficial Definitivo com 4 questões anuladas
anuladas = [m for m in manifest if m['disposition'] == 'held']
assert len(anuladas) == 4, f"Esperadas 4 questões anuladas, obtidas {len(anuladas)}"
anuladas_ids = {m['origin']['item_number'] for m in anuladas}
assert anuladas_ids == {30, 78, 87, 97}, f"Números incorretos das questões anuladas: {anuladas_ids}"

# 6. F04: Comentários fundamentados
assert "CONCATENAR" in q83['explanation']['body_markdown'], "Comentário da Q83 deve explicar a função CONCATENAR"
assert "sacristão" in q22['explanation']['body_markdown'], "Comentário da Q22 deve justificar as regras gramaticais"
assert "lacunas" in q6['explanation']['body_markdown'], "Comentário da Q6 deve justificar as 4 lacunas"

print("SUCCESS")
`;

  const cwd = path.resolve(__dirname, "../scripts/questions-workflow");
  const res = spawnSync("python", ["-X", "utf8", "-c", script], { cwd, encoding: "utf-8" });
  if (res.status === 77 || (res.error?.code === "ENOENT" && !process.env.TJSP_EXAM_PDF)) {
    context.skip("Teste de integração local. Disponibilize Python, PyMuPDF e o PDF da prova em TJSP_EXAM_PDF para executá-lo.");
    return;
  }
  if (res.error) throw res.error;
  assert.equal(res.status, 0, `Script falhou com erro:\n${res.stderr}`);
  assert.ok(res.stdout.includes("SUCCESS"));
});
