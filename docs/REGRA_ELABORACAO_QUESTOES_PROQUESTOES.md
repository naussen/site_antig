# Regra de elaboração e importação de questões do PRO Questões

**Versão editorial:** 1.0 — 26/10/2026. **Aplicação:** toda questão nova, de prova ou autoral, preparada para o site. Este documento é a regra editorial e técnica. O contrato executável de publicação continua sendo `scripts/lib/question-import-contract.mjs` (`pro-questions/v1`); em caso de divergência técnica, corrigir documento e gerador antes de importar. Dados exemplificativos não autorizam publicação.

## 1. Dois registros, duas finalidades

1. **Ficha editorial mestre:** uma entrada por `external_id`, inclusive para questões retidas, anuladas, excluídas e com gabarito alterado. Conserva evidências, decisões, pendências e revisão. Pode ser JSON/JSONL versionado; **não** é enviada a `import_questions_batch`.
2. **Lote de publicação:** JSON `pro-questions/v1`, somente com questões aprovadas. O importador atual exige uma opção correta e comentário não vazio e publica tudo em uma transação. Não admite questão anulada ou pendente.

Nunca inferir aprovação a partir de JSON válido, de `status = published` no banco ou de `reviewed_at` preenchido automaticamente pelo importador. A ficha precisa conter decisão humana rastreável. Não inserir uma alternativa fictícia para representar anulação.

## 2. Modelo relacional vigente

| Entidade | Chave e função | Regra para a elaboração |
| --- | --- | --- |
| `disciplines` | `id` UUID; `slug` e `name` únicos; `status` | Usar slug/nome canônicos e ativos. Conferir no catálogo antes de gerar o lote. |
| `topics` + `topic_discipline_relations` | `topic_id` textual e vínculo com disciplina | Tópico deve existir, estar ativo e ter vínculo compatível com a disciplina. Nunca inventar `topic_id`. |
| `questions` | `id` UUID interno; `external_id` único; `source_content_hash` | Enunciado, tipo, assunto, banca, órgão, cargo, ano, dificuldade, referência, `source_metadata` e estado `draft/published/archived`. `external_id` é identidade permanente. |
| `question_discipline_relations` | `(question_id, discipline_id)` | Uma disciplina primária para o lote; o importador a cria/reativa por slug, portanto conferir antes para evitar reativação/renomeação involuntária. |
| `question_topic_relations` | `(question_id, topic_id)` | Exatamente um tópico `primary`; outros `related` ou `reference`, cada um com relevância e ordem. É a ligação que alimenta filtros. |
| `question_options` | UUID interno, `label` e `sort_order` únicos por questão | 2 a 10 alternativas. C/E usa exatamente `C` e `E`, nesta ordem. |
| `question_answer_keys` | uma linha por questão, FK para alternativa da mesma questão | Guarda **uma** alternativa correta; não representa anulação, provisoriedade ou histórico de retificação. |
| `question_explanations` | uma linha por questão | `body_markdown`, `source_reference`, estado editorial. É o **comentário explicativo oficial** exibido ao aluno. |
| `question_import_batches` + `question_import_items` | `batch_key`, SHA-256 da fonte, IDs e ação | Trilha técnica da importação, distinta da prova editorial de correção. |
| `question_comments` | comentários de usuários | Discussão/feedback dos alunos; não substitui `question_explanations`. |

Fontes: migrations `029_create_questions_module.sql` e `031_add_atomic_question_import.sql`; tipos em `src/types/database.ts`. O banco de produção não possui hoje tabela própria de pendências editoriais nem histórico de gabaritos. As fichas versionadas são o registro pré-publicação; eventual persistência em banco exige migration, revisão de `types/database.ts`, RLS e fluxo administrativo próprio. Não gravar esses estados em `question_answer_keys` por adaptação improvisada.

## 3. Ficha editorial mestre (modelo normativo)

Uma ficha por questão, preferencialmente em JSONL para auditoria por ID. `null` significa dado não obtido; nunca preencher com evidência inventada. Datas em ISO 8601, ano numérico, SHA-256 em hexadecimal minúsculo. O exemplo abaixo é **ilustrativo e bloqueado**:

```json
{
  "schema_version": "pro-questions/editorial-v1",
  "external_id": "pdf:prova-exemplo:001",
  "source_id": "001",
  "origin": {
    "kind": "official_exam",
    "exam_board": "Banca Exemplo",
    "institution": "Órgão Exemplo",
    "position_name": "Cargo Exemplo",
    "exam_year": 2026,
    "exam_edition": "2026-1",
    "booklet": "caderno-1",
    "item_number": "001",
    "exam_file": "prova.pdf",
    "exam_sha256": null,
    "exam_page": 1,
    "exam_url": null
  },
  "content": {
    "question_type": "true_false",
    "statement_markdown": "Enunciado fiel à fonte, incluindo ressalvas.",
    "options": [
      { "label": "C", "body_markdown": "Certo", "sort_order": 0 },
      { "label": "E", "body_markdown": "Errado", "sort_order": 1 }
    ],
    "assets": []
  },
  "taxonomy": {
    "discipline_slug": "disciplina-canonica",
    "discipline_name": "Disciplina Canônica",
    "subject": "Assunto específico",
    "topics": [
      { "topic_id": "topico-existente", "relation_type": "primary", "relevance": 100, "sort_order": 0 }
    ],
    "checked_against_catalog_at": null
  },
  "answer": {
    "status": "preliminar",
    "current_label": "C",
    "preliminary_label": "C",
    "definitive_label": null,
    "history": [],
    "evidence": {
      "official_url": null,
      "file_name": "gabarito-preliminar.pdf",
      "sha256": null,
      "page": 1,
      "booklet": "caderno-1",
      "item_number": "001",
      "publication_date": null
    }
  },
  "explanation": {
    "body_markdown": "Comentário provisório, ainda sujeito a revisão.",
    "source_references": [],
    "law_as_of": null,
    "current_law_checked_at": null,
    "review_status": "pending",
    "reviewed_by": null,
    "reviewed_at": null
  },
  "editorial": {
    "decision": "retida",
    "reasons": ["gabarito_definitivo_nao_comprovado"],
    "next_action": "Conferir gabarito definitivo do mesmo caderno e item.",
    "approved_by": null,
    "approved_at": null
  }
}
```

Identidades de prova devem incorporar a edição/caderno quando necessários para evitar colisão. `source_id` é o identificador original, não um número regenerado. Para questão autoral, usar `origin.kind = "authorial"`, autoria e versão da elaboração; gabarito e comentário precisam de revisão independente, sem fingir documento de banca. Conservar o PDF/JSON original sem sobrescrever e ligar a ficha aos hashes reais.

### Estados obrigatórios

| `answer.status` | Conduta | `editorial.decision` |
| --- | --- | --- |
| `definitivo` | Resposta final comprovada para o mesmo cargo/prova/caderno/item. | `pronta` somente após os demais gates. |
| `definitivo_alterado` | Registrar rótulos antes/depois, ato da banca, data, razão e evidência final; comentário deve explicar a retificação. | `pronta` somente após os demais gates. |
| `preliminar` | Guardar resposta provisória sem tratá-la como final. | `retida`. |
| `sem_status` | Investigar fonte; ausência de status não equivale a definitivo. | `retida`. |
| `anulada` | Guardar ato de anulação e histórico; `definitive_label` e `current_label` devem ser `null`. | `anulada`, fora do lote. |
| `conflitante` | Registrar todas as fontes e divergência por caderno/item. | `retida`. |

`editorial.decision` usa `pronta`, `retida`, `anulada` ou `excluida`. Toda decisão não pronta exige `reasons` e `next_action` (ou motivo de exclusão definitiva). Uma decisão `pronta` exige `approved_by` identificável e `approved_at`. Cada mudança de gabarito entra em `answer.history` com `from_label`, `to_label`, `event`, `decided_at`, `evidence` e responsável. Nunca substituir a resposta antiga sem histórico. Se o gabarito definitivo vier de caderno diferente, exige pareamento item a item documentado; similaridade textual isolada não basta.

## 4. Comentário explicativo

`explanation.body_markdown` é obrigatório para publicação, com resposta fundamentada, justificativa das alternativas quando pertinente e fontes específicas. Ele deve concordar com o gabarito **definitivo**, distinguir regra vigente na data da prova de regra atual e apontar desatualização relevante de modo visível ao estudante. Gabarito antigo definitivo comprova a resposta histórica; **não comprova a atualidade jurídica, clínica ou técnica do comentário**. `source_references`, `law_as_of` e `current_law_checked_at` registram essa conferência na ficha. Conteúdo de IA é rascunho até revisão de conteúdo e autoria/identidade real do revisor.

Para `definitivo_alterado`, o comentário declara a alteração e o fundamento oficial, sem depender só de um aviso no enunciado. Para `anulada`, registrar o motivo e a fonte na ficha, mas não publicar como questão respondível pelo importador atual. Comentário ausente, contraditório, genérico ou desatualizado mantém a questão `retida`.

## 5. Taxonomia, mídia e formatação

### Estrutura visual do enunciado

Para questões novas, organize `statement_markdown` com parágrafos separados por linha em branco. Quando houver texto de apoio, use cabeçalhos Markdown simples, nesta ordem: `## Texto-base`, o texto fiel à fonte; `## Fonte`, a atribuição tal como comprovada na prova (autor, obra, artigo, revista, jornal, URL e indicação de adaptação, se existirem); `## Enunciado`, a chamada/comando; e, para C/E, `## Assertiva`, o item a julgar. Se o texto tiver nome próprio, como `Texto 2` ou `Texto CB1A1-I`, coloque-o em linha isolada antes do corpo do texto. Não invente autor ou publicação quando a fonte não os trouxer.

Exemplo de `statement_markdown` (o conteúdo é apenas ilustrativo):

```markdown
Texto 2

## Texto-base

Trecho fiel ao caderno de prova.

## Fonte

Autora Exemplo. Obra Exemplo, 2020 (com adaptações).

## Enunciado

Com base no texto, julgue o item abaixo.

## Assertiva

O item a ser julgado aparece aqui.
```

Em múltipla escolha, não use `## Assertiva`: as alternativas A–E continuam no array `options`, sem duplicação no enunciado. Em questão sem texto de apoio, omita `## Texto-base`, `## Fonte` e título. A formatação não altera o contrato `pro-questions/v1`, o gabarito, os hashes ou os registros já importados. Confira o texto exibido após validar/importar, sobretudo quebras de parágrafo de PDF e fontes bibliográficas.

- Consultar o catálogo real do site. Disciplina ativa, tópico ativo e relação tópico–disciplina compatível são pré-condições. `subject` é rótulo curto do assunto, coerente com o tópico primário; guardar o assunto literal da fonte separadamente em `source_metadata.source_subject` quando divergir. Relações secundárias só quando semanticamente justificadas. Não criar tópicos artificiais apenas para passar o validador.
- Usar Markdown UTF-8 sem HTML bruto, scripts, `data:`, `javascript:` ou Base64. Preservar a redação original do enunciado; identificar claramente qualquer adaptação. Campos textuais não admitem byte nulo nem U+FFFD. Fórmulas devem seguir o renderizador atual.
- Imagens devem estar no diretório público servido pelo site e usar URL interna no padrão efetivamente aceito pela interface, hoje `/resumos/questions/calculations/pdf_<identificador>.png`. Conferir arquivo, bytes, dimensões, legibilidade e HTTP 200 no site antes de aprovar. Na ficha, `assets` registra URL, arquivo, SHA-256, origem e estado de entrega. Nunca usar caminho `C:\...`/`file://` no enunciado ou comentário.
- Não incluir dados pessoais, credenciais, chaves ou caminho privado de serviço nos JSONs. `source_metadata` não substitui colunas relacionais usadas pelos filtros. Evitar metadados soltos sem definição na ficha.

## 6. Lote JSON que o site aceita hoje

O arquivo `content/questions/samples/direito-administrativo-amostra.json` é exemplo concreto de envelope. Estrutura resumida (hashes abaixo são marcadores; gerar os valores reais):

```json
{
  "schema_version": "pro-questions/v1",
  "batch_key": "edicao-2026-disciplina-001",
  "source": {
    "file_name": "DISCIPLINA_ATUALIZADO.json",
    "sha256": "<sha256-dos-bytes-exatos-da-fonte>",
    "metadata": { "editorial_rule": "1.0", "approved_at": "2026-10-26T12:00:00Z" }
  },
  "discipline": { "slug": "disciplina-canonica", "name": "Disciplina Canônica" },
  "questions": [
    {
      "external_id": "pdf:prova-exemplo:001",
      "source_id": "001",
      "source_content_hash": "<sha256-do-item-sem-este-campo>",
      "question_type": "true_false",
      "statement_markdown": "Enunciado final conferido.",
      "subject": "Assunto específico",
      "exam_board": "Banca Exemplo",
      "institution": "Órgão Exemplo",
      "position_name": "Cargo Exemplo",
      "exam_year": 2026,
      "difficulty": null,
      "source_reference": "Prova, caderno 1, item 001",
      "source_metadata": {
        "answer_status": "definitivo_alterado",
        "answer_evidence": { "official_url": "https://exemplo.invalid/gabarito", "page": 1, "item": "001" },
        "editorial_record_id": "pdf:prova-exemplo:001"
      },
      "topics": [
        { "topic_id": "topico-existente", "relation_type": "primary", "relevance": 100, "sort_order": 0 }
      ],
      "options": [
        { "label": "C", "body_markdown": "Certo", "sort_order": 0 },
        { "label": "E", "body_markdown": "Errado", "sort_order": 1 }
      ],
      "correct_option_label": "E",
      "explanation": {
        "body_markdown": "A banca alterou o gabarito de C para E. Fundamentação revisada e contextualizada.",
        "source_reference": "Gabarito definitivo, caderno 1, item 001"
      }
    }
  ]
}
```

Marcadores `<...>` e `exemplo.invalid` **não** são valores publicáveis. O envelope aceita 1–1.000 itens. `batch_key` só tem letras minúsculas, números, ponto, `_` e `-`; `source.file_name` é basename terminado em `_ATUALIZADO.json`; `source.sha256` e `source_content_hash` são SHA-256 hexadecimais minúsculos. `question_type` é `multiple_choice` ou `true_false`; `difficulty` é `easy`, `medium`, `hard` ou `null`. Campos opcionais de prova no item são explicitamente `null` quando desconhecidos. `topics` tem 1–20 relações e exatamente um `primary`, `relevance` inteiro 1–100. `options` tem 2–10 alternativas com `label` único de 1–3 caracteres `[A-Z0-9]` e `sort_order` único 0–20; `correct_option_label` deve existir. O validador limita enunciado e comentário a 20.000 caracteres, alternativa a 5.000, assunto a 200, `external_id`/`source_id` a 160. Conferir limites completos no Zod antes de gerar.

Calcular `source_content_hash = sha256(stableStringify(item_sem_source_content_hash))` com a função de `scripts/lib/question-import-contract.mjs`; recalcular após qualquer mudança de texto **ou** metadado. Calcular `source.sha256` sobre os bytes exatos da fonte `_ATUALIZADO.json`. Não copiar hashes de exemplos. Campos editoriais adicionais no topo do item podem ser descartados pelo Zod: manter a ficha separada e projetar somente procedência necessária em `source_metadata`. O lote usa `correct_option_label`, não `is_correct` nas alternativas.

## 7. Gates e fluxo obrigatório

1. **Fonte e identidade:** preservar original, conferir prova/caderno/item, hashes e unicidade de IDs; detectar duplicata entre provas sem fundir itens distintos.
2. **Gabarito:** confirmar ato final oficial para o mesmo item; registrar anulação, alteração e divergências. Questão autoral exige validação independente.
3. **Comentário:** revisar raciocínio, alternativas e atualidade da matéria; registrar fontes, data de conferência e revisor real.
4. **Classificação:** confirmar disciplina/tópico ativos e assunto coerente no catálogo. Verificar como aparecerá nos filtros por disciplina, tópico, banca e ano.
5. **Mídia:** garantir URL interna renderizável e arquivo entregue, inclusive no comentário.
6. **Decisão:** marcar `pronta` por ID somente depois dos gates, com aprovação rastreável. Exportar apenas `pronta` para lote; `retida`, `anulada` e `excluida` ficam na ficha/registro de decisões.
7. **Validação e publicação:** gerar hashes, validar lote, executar importação em dry run e só então aplicar com `batch_key` confirmado; verificar registros, imagens e filtros no site autenticado. Publicação em banco, deploy e aparição em produção são evidências distintas.

```powershell
npm run questions:admin -- validate --file <lote.json>
npm run questions:admin -- import --file <lote.json>
npm run questions:admin -- import --file <lote.json> --apply --confirm <batch_key>
npm run questions:admin -- verify --file <lote.json>
```

`prepare` do CLI atual aceita apenas fonte `*_ATUALIZADO.json` do QPYGEM com `status_revisao = VALIDA` e mapa explícito; para outros geradores, produzir o mesmo contrato sem afrouxar o gate editorial. O RPC pode reativar/renomear disciplina com mesmo slug; inspecionar o catálogo antes de `--apply`. Reimportar um `external_id` com hash diferente falha; correção de item já publicado requer processo administrativo separado, histórico e análise das tentativas dos usuários, nunca troca silenciosa do gabarito. Se o item foi anulado após publicação, arquivar e registrar a decisão antes de considerar efeito em estatísticas/tentativas; o importador atual não resolve isso.

## 8. Critério de aceite

Um ID só está pronto quando fonte e gabarito são reproduzíveis, comentário foi revisado quanto à correção **e atualidade**, classificação corresponde aos filtros reais, mídia abre no site, hashes são íntegros e a decisão editorial tem responsável e data. JSON válido, isoladamente, não satisfaz o critério.
