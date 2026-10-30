# Operação do fluxo local de questões

## Entrada e responsabilidade

O usuário deposita provas inteiras e gabaritos numa pasta. Nomes e ordem temporal são pistas, não contratos. O orquestrador executa os agentes, usa as ferramentas abaixo e entrega um relatório de prontas/duplicadas/retidas/anuladas. Nenhuma ferramenta deste kit publica sozinha.

Não executar os prompts de `C:\PRO\questoes\PROMPTS.txt` em sequência: são histórico. Usar o prompt de entrada desta pasta, que define tarefas separadas e contratos. Para o ambiente atual, trabalhar em `C:\PRO\worktrees\questoes-fluxo-20261030`; em outro checkout, ajustar o diretório sem copiar `.env`.

## Etapas e arquivos de uma execução

| Ordem | Responsável | Saída | Condição de avanço |
| --- | --- | --- | --- |
| 1 | Inventariante | `intake.json`, texto por SHA | PDFs íntegros; falhas individualizadas. |
| 2 | Identificador | `documents/*.json`, `pairs.json` | Eventos/cargos/cadernos e blocos comprovados; busca oficial resolve provisórios. |
| 3 | Transcritor + conferente | `extracted/*.json` | Todos os números esperados, sem lacunas/repetições; texto-base e imagens completos. |
| 4 | Taxonomista | `taxonomy-proposals.json`, ficha por questão | Resolver catálogo e aliases; lacunas não viram aproximação. |
| 5 | Autor de comentário | `commented/*.json` | Resolver independentemente antes de consultar a chave; conflito fica retido. |
| 6 | Revisor independente | `reviews/*.json` | Conferência factual, textual, gabarito, fonte vigente, cálculos e mídia. |
| 7 | Integrador | `*_ATUALIZADO.json`, lotes v1, manifesto editorial | Hash final, evidências e classificação coerentes. |
| 8 | Gate + política editorial | `gates/*.json`, plano da prova | Gate técnico aprovado e governança vigente atendida. |
| 9 | Publicador | `receipts/*.json`, relatório pós-importação | Mesmo lote do gate; transação idempotente e verificação real. |

Falha de uma questão bloqueia a publicação da **prova**; outras provas independentes podem continuar. Anuladas e exclusões justificadas são destinos contabilizados, não falhas a esconder. Retomar apenas a partir de checkpoints cujos hashes/configurações ainda correspondem. O relatório sempre fecha `total = prontas + retidas + anuladas + excluídas + duplicadas`, com categorias mutuamente exclusivas. Não considerar como "novas" as duplicatas do acervo.

O importador atual é atômico por lote técnico, **não por pasta nem por prova dividida em lotes**. Para uma prova com mais de uma disciplina, validar tudo antes da primeira gravação. Uma falha entre lotes exige interrupção, recibos e retomada idempotente. Se for requisito não haver visibilidade parcial nem nessa janela de falha, implementar previamente staging por prova e promoção transacional; o kit não oferece essa garantia ainda.

## Comandos de diagnóstico

Executar na raiz do checkout. Cada execução usa um nome novo; os comandos recusam sobrescrita. `scratch/workflow-*` fica fora do Git por conter conteúdo editorial e snapshots locais.

```powershell
python scripts/questions-workflow/inventory.py `
  "C:\PRO\questoes\novas_pdf_30-10" `
  --output scratch/workflow-NOVO/intake

node --env-file=C:\PRO\site\.env.local `
  scripts/questions-workflow/snapshot.mjs `
  --output scratch/workflow-NOVO/catalog.json

node scripts/questions-workflow/audit.mjs `
  --catalog scratch/workflow-NOVO/catalog.json `
  --output scratch/workflow-NOVO/audit.json

python scripts/questions-workflow/compare.py `
  --before C:\PRO\questoes\output_pdf `
  --after C:\PRO\questoes\output_pdf_comentarios\arquivos_site `
  --output scratch/workflow-NOVO/comparison.json
```

O snapshot só lê conteúdo editorial: disciplinas, tópicos, questões, opções, gabaritos, explicações e referências legais. Não anexar o arquivo inteiro a serviços externos nem commitar. Os agentes recebem somente os registros necessários à etapa, sem dados de alunos ou segredos.

## Vertex com o acesso existente

Dependências Python já presentes no ambiente verificado: `pdfplumber` e `google-genai`; o executor de testes usa biblioteca padrão. Node usa Supabase e Zod já presentes no site. Não foi adicionada biblioteca ao site. Para reinstalação em ambiente novo: `python -m pip install "pdfplumber>=0.11,<1" "google-genai>=1.52,<2"`.

Carregar o ambiente existente do PYGEM em runtime, sem abrir/copiar/exibir o `.env`. Este exemplo passa apenas o nome do modelo aos argumentos; projeto e região seguem pelo ambiente. Nenhuma API key, fallback de provedor ou conta de serviço nova é necessária.

```powershell
node --env-file=C:\PRO\pygem\.env -e "const {spawnSync}=require('node:child_process');const r=spawnSync('python',['scripts/questions-workflow/vertex.py','doctor','--model',process.env.GEMINI_MODEL || 'gemini-3.5-flash'],{stdio:'inherit',windowsHide:true});process.exitCode=r.status ?? 1"
```

`doctor` chama contagem de tokens, sem gerar comentário. Não confirma saldo de avaliação gratuita, teto financeiro ou todas as permissões de administração. O smoke real desta entrega confirmou geração separadamente.

Para uma etapa, o orquestrador fornece prompt, JSON Schema, entradas e saída. O executor oferece `run --prompt ... --schema ... --input ... --output ... --project ... --model ...`; `--input` é repetível. O schema de identificação de documentos e seu prompt estão em `scripts/questions-workflow/document.schema.json` e `document-prompt.md`. Para usar credenciais/configuração do PYGEM, o agente pode usar o mesmo `spawnSync` do exemplo, substituindo os argumentos de `doctor` pelos de `run`.

Limites: uma geração por invocação, sem retry pago nem troca silenciosa de modelo; máximo de 20 MiB por entrada, teto padrão de 60.000 tokens de entrada e 8.192 de saída. Não existe teto financeiro acumulado de uma campanha. O orquestrador deve limitar o número de chamadas por prova e registrar uso; o teto deve ser definido antes de iniciar um lote grande. Dividir PDFs em cópias temporárias por páginas/questões, preservando originais. Em 429/503, reagendar com espera e orçamento limitado, não criar loop sem fim. Erro de autenticação interrompe a campanha, sem reconfigurar conta automaticamente.

O checkpoint depende dos bytes de cada entrada, prompt, schema, projeto, região, modelo e teto de saída; o resultado tem hash próprio. Reutilização não chama geração. Trocar esses elementos exige outra saída; resposta truncada ou bloqueada não vira checkpoint aprovado. O resultado `editorial_approval: false` é intencional. A resposta estruturada da API e JSON parseável não substituem validação local nem conferência de fontes.

Documentação consultada: [PDF no Vertex com ADC](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/samples/googlegenaisdk-textgen-with-pdf) e [saída estruturada](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output). Não usar a Files API do Gemini Developer como fallback.

## Identidade, campos e formatação

- Registrar um `exam_id` permanente em um catálogo de provas, resolvido por instituição, banca, aplicação, edição, cargo e caderno; não pelo nome do arquivo. Hash do PDF é evidência, não identidade semântica. Sem identidade comprovada, manter provisório e reter publicação.
- Para novas questões, derivar `external_id` dessa identidade e do número original, sem disciplina, tópico, comentário ou nome do arquivo. Exemplo de forma: `exam:<uuid-da-prova>:booklet:<codigo>:item:<numero>`. Conservar IDs legados exatamente como estão. ID de cinco caracteres pode ser rótulo de exibição, nunca a única identidade global.
- Ano da prova é o de aplicação; ano do edital é outro campo. Conservar órgão, cargo, especialidade, banca, UF, edital, sessão, caderno/versão, faixas de numeração, páginas físicas e URLs/hashes da fonte. Dados desconhecidos ficam `null`; não copiar o ano do primeiro número encontrado no PDF.
- Separar texto-base, sua fonte, introdução/situação, comando e assertiva. Partes opcionais ficam `null`, sem inventar frases. C/E conserva a assertiva; A–E mantém as alternativas em `options`. Questões com itens I/II/III também conservam esses itens, além das opções de resposta.
- `source_metadata.statement_parts` usa as chaves `title`, `context`, `source`, `introduction`, `command`, `assertion`, todas texto ou `null`. `composeStatement` no gate gera o Markdown uniforme aceito pelo leitor atual. Não concatenar gabarito ou justificativa oficial no enunciado.
- Gráficos, tabelas, fórmulas, diagramas, textos compartilhados, notas e referências à linha do texto são conteúdo. Não substituir imagem necessária por descrição inventada. Usar assets controlados com hash, recorte/página e verificação de entrega; sem base64 no banco ou caminho local no comentário.
- Comentário: resposta fundamentada; explicação didática; análise das demais opções quando pertinente; fonte oficial específica e data de conferência; diferença entre resposta histórica e regra vigente. Não alterar a assertiva para fazer a resposta coincidir. Se houver adaptação autorizada, preservar original e criar versão derivada com motivo e revisão próprios.
- Estado da chave: `sem_status`, `preliminar`, `definitivo`, `definitivo_alterado`, `anulada`, `conflitante`. Só os dois definitivos podem seguir ao gate. Anulada não recebe resposta artificial. Conflito entre resolução independente e banca gera retenção e consulta à fundamentação oficial.

## Manifesto que acompanha o lote

O envelope de publicação permanece v1. O manifesto abaixo é separado e tem `schema_version: pro-questions/editorial-manifest/v1`, com `questions` contendo um registro por `external_id`. Exemplo intencionalmente **retido**, com valores ilustrativos:

Para o gate deste kit, a fonte `*_ATUALIZADO.json` deve conter um array de itens canônicos finais ou um objeto com `questions` contendo esses itens. O gate compara cada item do lote com sua ocorrência única nessa fonte. Fontes legadas com campos em português precisam primeiro de adaptação preservando a origem; não renomear um arquivo bruto para fazê-lo passar.

```json
{
  "schema_version": "pro-questions/editorial-manifest/v1",
  "questions": [{
    "external_id": "exam:exemplo:001",
    "artifact_sha256": null,
    "disposition": "held",
    "origin": {
      "exam_id": null, "exam_code": null, "booklet": null,
      "item_number": 1, "exam_sha256": null, "page": null
    },
    "answer": {
      "exam_id": null, "exam_code": null, "booklet": null,
      "item_number": 1, "answer_sha256": null, "page": null,
      "status": "sem_status", "label": null,
      "previous_label": null, "change_evidence": null
    },
    "taxonomy": {
      "concept_key": null, "subtopic_key": null,
      "discipline_slug": null, "topic_id": null
    },
    "explanation_author": null,
    "reviews": [],
    "reasons": ["identidade_e_gabarito_pendentes"]
  }]
}
```

Para avançar, cada revisão contém `stage` (`extraction`, `answer_pairing`, `taxonomy`, `explanation`), `verdict: pass`, `artifact_sha256` igual ao item final, `reviewer: {kind: ai|human, id: identidade-real-da-execucao-ou-pessoa}` e `evidence` não vazio. O revisor do comentário deve ser execução independente do autor; usar outro ID para a mesma execução não é independência. Conservar entradas/saídas e configurações para conferir isso. Essas declarações não são assinatura criptográfica ou prova de verdade.

`origin` e `answer` devem usar a mesma identidade canônica comprovada, não apenas repetir o número da questão. Guardar também as transcrições literais dos identificadores e a prova da equivalência se os nomes variarem. Chave alterada exige rótulo anterior e evidência da alteração. A ficha editorial completa mantém histórico, fontes, datas, assets e todos os estados; o manifesto é um índice mínimo para o gate, não substitui essa ficha.

No lote, `source_metadata.editorial_record_id = external_id` e `answer_status` refletem a ficha. O hash do item é `sha256(stableStringify(item_sem_source_content_hash))`, usando o helper do contrato oficial. O hash da fonte é dos bytes exatos de `*_ATUALIZADO.json`, não de um JSON reserializado de outro modo. O gate registra também hash do lote verificado.

## Gate e publicação

```powershell
node scripts/questions-workflow/gate.mjs `
  --batch lote.json --catalog catalog.json --ledger editorial-manifest.json `
  --intake intake.json --source PROVA_ATUALIZADO.json --output gate.json
```

O `intake.json` precisa incluir todas as fontes comprovadas, inclusive gabaritos definitivos obtidos depois. Inventariar também a pasta de fontes recuperadas e consolidar os manifestos de forma explícita, sem modificar o inventário original. Não fabricar um hash para encaixar uma chave.

Gate falha em catálogo com mais de 24h, disciplina inexistente/inativa/renomeada, disciplina quantitativa composta, tópico ausente/arquivado/incompatível, hash alterado, identidade conflitante, duplicata textual, falta de ficha, origem/página inválida, chave não definitiva, pareamento divergente, revisão ausente/obsoleta, HTML ativo, recurso local e transcrição incompleta. Ele não resolve taxonomia semântica nem autentica as evidências por conta própria.

Antes de publicar: atualizar catálogo, resolver propostas taxonômicas, conferir a prova inteira e atender à política editorial vigente. Depois usar **o importador existente**, sem escrever diretamente em tabelas:

```powershell
node scripts/questions-admin.mjs validate --file lote.json
node scripts/questions-admin.mjs import --file lote.json
# Só na etapa de publicação autorizada e após todos os gates da prova:
node --env-file=C:\PRO\site\.env.local scripts/questions-admin.mjs import --file lote.json --apply --confirm CHAVE_EXATA_DO_LOTE
node --env-file=C:\PRO\site\.env.local scripts/questions-admin.mjs verify --file lote.json
```

Confirmar que o hash do lote ainda é o aprovado. `validate`, `import` sem `--apply`, importação, verificação de banco, deploy dos assets e smoke autenticado são evidências diferentes. `verify` atual confere contagens/hashes/estado, não compara integralmente a redação de todos os comentários: o publicador deve conferir também os dados editoriais lidos de volta. Os agentes de preparação não recebem service role; só o publicador usa a configuração administrativa local, sem incluí-la nos documentos de contexto.

## Verificação do kit

```powershell
node --test tests/questions-workflow.test.mjs tests/questions-import.test.mjs tests/question-statement-sections.test.mjs
python -m unittest discover -s tests -p test_questions_workflow.py -v
python -m compileall -q scripts/questions-workflow tests/test_questions_workflow.py
npm run lint
```

Os testes são offline. Chamada real ao Vertex é smoke separado, com uso registrado. Build e teste visual passam a ser necessários na implementação dos adaptadores e filtros dos módulos; este kit não modifica frontend, rotas ou renderizadores.
