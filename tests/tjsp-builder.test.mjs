import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("tjsp_builder: gera 100 itens com textos-base, alternativas limpas, gabarito definitivo e taxonomia canônica", () => {
  const script = `
import json
from tjsp_builder import build_tjsp_questions, clean_pdf_text

# Validação da função clean_pdf_text (des-hifenização conservadora)
assert clean_pdf_text("aplica-\\nse") == "aplica-se", "Clítico com hífen deve ser preservado"
assert clean_pdf_text("pré-\\nescola") == "pré-escola", "Composto com hífen deve ser preservado"
assert clean_pdf_text("remune-\\nração") == "remuneração", "Quebra de palavra simples deve ser unida"
assert clean_pdf_text("constitu-\\ncional") == "constitucional", "Quebra de palavra simples deve ser unida"

ready, manifest = build_tjsp_questions()

# Validações estruturais
assert len(ready) == 96, f"Esperadas 96 questões prontas, obtidas {len(ready)}"
assert len(manifest) == 100, f"Esperados 100 registros no manifesto, obtidos {len(manifest)}"

# 1. R01 / F01: Contextos obrigatórios nos 23 itens dependentes (1-10, 11-17, 19-24)
dependent_items = list(range(1, 11)) + list(range(11, 18)) + list(range(19, 25))
assert len(dependent_items) == 23, f"Esperados 23 itens dependentes, obtidos {len(dependent_items)}"

for item_num in dependent_items:
    q = next(q for q in ready if q['external_id'].endswith(f"{item_num:03d}"))
    ctx = q.get('source_metadata', {}).get('statement_parts', {}).get('context')
    assert ctx is not None and len(ctx.strip()) > 20, f"Item {item_num} deve ter source_metadata.statement_parts.context preenchido"
    assert "Texto-base" in q['statement_markdown'], f"Item {item_num} deve ter 'Texto-base' no statement_markdown"

# Conferências específicas de textos-base
q6 = next(q for q in ready if q['external_id'].endswith('006'))
assert "Perto do apagão" in q6['statement_markdown'], "Texto-base da Q6 deve conter o editorial"
assert "______" in q6['statement_markdown'], "Texto-base da Q6 deve conter as lacunas"

q11 = next(q for q in ready if q['external_id'].endswith('011'))
assert "Vida ao natural" in q11['statement_markdown'], "Texto-base da Q11 deve conter o conto Vida ao natural"

q19 = next(q for q in ready if q['external_id'].endswith('019'))
assert "Dia Nacional de Combate ao Fumo" in q19['statement_markdown'], "Texto-base da Q19 deve conter o texto 1"
assert "Cringe" in q19['statement_markdown'], "Texto-base da Q19 deve conter o texto 2"

# 2. R09 / F02: Alternativa E da questão 22 sem contaminação das questões 23/24
q22 = next(q for q in ready if q['external_id'].endswith('022'))
opt_e_22 = next(o for o in q22['options'] if o['label'] == 'E')
assert "Leia o texto para responder" not in opt_e_22['body_markdown'], "Alternativa E da Q22 não pode conter texto de outras questões"
assert "Motivação" not in opt_e_22['body_markdown'], "Alternativa E da Q22 não pode conter texto da questão 23/24"
assert opt_e_22['body_markdown'].endswith("conferir."), "Alternativa E da Q22 deve terminar em 'conferir.'"

# 3. F01: Questão 83 contém a planilha de Excel em tabela Markdown
q83 = next(q for q in ready if q['external_id'].endswith('083'))
assert "| | A | B | C | D |" in q83['statement_markdown'], "Questão 83 deve conter a tabela da planilha"
assert "Planejamento" in q83['statement_markdown'], "Tabela da Q83 deve conter dados da planilha"

# 4. R03 / F03: Taxonomia oficial correta e sem desvios
q80 = next(q for q in ready if q['external_id'].endswith('080'))
assert q80['topics'][0]['topic_id'] == "sistemas-operacionais-windows-e-linux", "Q80 deve ser Informática/Windows"
assert q83['topics'][0]['topic_id'] == "ferramentas-de-escritorio-office-e-libreoffice", "Q83 deve ser Informática/Office"

q47 = next(q for q in ready if q['external_id'].endswith('047'))
assert q47['topics'][0]['topic_id'] == "direitos-e-garantias-fundamentais", "Q47 deve ser Direitos Fundamentais/Sociais"

q48 = next(q for q in ready if q['external_id'].endswith('048'))
assert q48['topics'][0]['topic_id'] == "nacionalidade-e-direitos-politicos", "Q48 deve ser Nacionalidade"

q49 = next(q for q in ready if q['external_id'].endswith('049'))
assert q49['topics'][0]['topic_id'] == "nacionalidade-e-direitos-politicos", "Q49 deve ser Nacionalidade (cargos privativos)"

q50 = next(q for q in ready if q['external_id'].endswith('050'))
assert q50['topics'][0]['topic_id'] == "administracao-publica", "Q50 deve ser Administração Pública/Servidores"

# 5. R02 / F05: Gabarito Oficial Definitivo com 4 questões anuladas
anuladas = [m for m in manifest if m['disposition'] == 'held']
assert len(anuladas) == 4, f"Esperadas 4 questões anuladas, obtidas {len(anuladas)}"
anuladas_ids = {m['origin']['item_number'] for m in anuladas}
assert anuladas_ids == {30, 78, 87, 97}, f"Números incorretos das questões anuladas: {anuladas_ids}"

# 6. R11: Rastreabilidade e páginas físicas reais
m83 = next(m for m in manifest if m['origin']['item_number'] == 83)
assert m83['origin']['page'] == 22, f"Q83 está na página 22 do caderno, obtido: {m83['origin']['page']}"
assert m83['answer']['page'] == 1, f"Gabarito versão 2 está na página 1, obtido: {m83['answer']['page']}"

# 7. R04 / F04: Comentários 100% fundamentados e sem template genérico
for q in ready:
    exp = q['explanation']['body_markdown']
    assert "em estrita conformidade com o edital" not in exp, f"Item {q['external_id']} contém template genérico"
    assert len(exp.strip()) > 100, f"Item {q['external_id']} tem explicação muito curta"

# Conferências pontuais de fundamentação (Q47, Q48, Q49)
assert "art. 7º, XXV" in q47['explanation']['body_markdown'] or "artigo 7º, XXV" in q47['explanation']['body_markdown'], "Q47 deve citar art. 7º, XXV da CF"
assert "art. 12" in q48['explanation']['body_markdown'] and "alínea 'a'" in q48['explanation']['body_markdown'], "Q48 deve citar art. 12, II, alínea 'a' da CF"
assert "art. 12" in q49['explanation']['body_markdown'] and "VI" in q49['explanation']['body_markdown'] and "Forças Armadas" in q49['explanation']['body_markdown'], "Q49 deve citar art. 12, § 3º, VI da CF"

print("SUCCESS")
`;

  const cwd = path.resolve(__dirname, "../scripts/questions-workflow");
  const res = spawnSync("python", ["-c", script], { cwd, encoding: "utf-8" });
  assert.equal(res.status, 0, `Script falhou com erro:\n${res.stderr}`);
  assert.ok(res.stdout.includes("SUCCESS"));
});
