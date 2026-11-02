import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("continuidade de navegação e preservação do conjunto ao recarregar (Prioridade 4)", async () => {
  const pageSource = await readFile(path.join(ROOT, "src/app/dashboard/questoes/page.tsx"), "utf8");
  const clientSource = await readFile(path.join(ROOT, "src/app/dashboard/questoes/questions-client.tsx"), "utf8");

  // 1. page.tsx lê parâmetro 'pos' e 'id' de forma independente
  assert.match(pageSource, /const parsedPos = Number\(paramVal\("pos"\)\)/, "page.tsx deve ler o parâmetro pos");
  assert.match(pageSource, /requestedPos/, "page.tsx deve validar requestedPos");

  // 2. Não confunde posição de navegação com filtro explícito por ID
  assert.match(pageSource, /if \(!initialIdentifier && initialMode === 1 && rawData && rawData\.items\.length > 1\)/,
    "page.tsx deve reconstruir o histórico e manter o conjunto apenas na ausência de filtro explícito por ID");

  // 3. Reconstrução de histórico para permitir 'Anterior' e 'Próxima' após recarga
  assert.match(pageSource, /reconstructedHistory\.push/, "page.tsx deve popular reconstructedHistory com os itens anteriores");
  assert.match(pageSource, /initialHistory=\{reconstructedHistory\}/, "page.tsx deve repassar o histórico reconstruído ao cliente");
  assert.match(pageSource, /initialPageStart=\{finalPageStart\}/, "page.tsx deve repassar a posição inicial calculada");

  // 4. Fallback claro caso o filtro por ID não encontre a questão
  assert.match(pageSource, /A questão solicitada.*não foi encontrada ou não está disponível com os filtros atuais/,
    "page.tsx deve apresentar fallback limpo caso ID deliberado seja inexistente");

  // 5. questions-client.tsx sincroniza 'pos' sem poluir filtros com 'id' falso durante navegação
  assert.match(clientSource, /if \(currentPos > 1\) params\.set\("pos", String\(currentPos\)\)/,
    "syncUrlWithFilters deve gravar pos na URL");
  assert.match(clientSource, /syncUrlWithFilters\(activeFilters, mode, nextStart \+ 1, "push"\)/,
    "showNext deve registrar nova posição com push no histórico do navegador");
  assert.match(clientSource, /syncUrlWithFilters\(activeFilters, mode, previous\.start \+ 1, "replace"\)/,
    "showPrevious deve atualizar a URL com a posição anterior");
  assert.match(clientSource, /window\.addEventListener\("popstate", handlePopState\)/,
    "questions-client.tsx deve tratar popstate para suportar botões voltar/avançar do navegador");
});
