# Plano de saneamento das questões de PDF pendentes

Atualizado em 24/10/2026. Documento de execução para outra IDE com IA. **Este plano não autoriza importação automática nem declara as questões revisadas.**

## 1. Objetivo e limites

Tratar as 1.251 questões ainda pendentes no conjunto ativo, hoje separadas pelo **primeiro bloqueio detectado**: 369 sem comentário, 437 com gabarito preliminar ou sem status definitivo, 180 sem disciplina ativa correspondente e 265 sem tópico identificado com segurança. Esses grupos são mutuamente exclusivos apenas no manifesto atual; depois que um bloqueio for resolvido, outro pode aparecer. Reexecutar a triagem a cada fase e registrar as transições por `external_id`.

Não recolocar os 34 IDs de `content/questions/pdf-import/excluded.json`. Não modificar os 75 itens já publicados, seus 19 lotes, respostas de usuários ou os PDFs/JSONs originais. Propor mudanças de taxonomia somente quando houver correspondência editorial real; nunca inventar tópico ou disciplina para elevar a contagem de publicação. Resultado aceitável inclui itens retidos com motivo verificável.

## 2. Estado e fontes canônicas

| Artefato | Uso |
| --- | --- |
| `C:\PRO\questoes\output_pdf_comentarios\RELATORIO_IMPORTACAO_APP_IA.md` | Diagnóstico da extração; afirmações de revisão por IA não equivalem a conferência humana ou gabarito definitivo. |
| `C:\PRO\questoes\output_pdf_comentarios\arquivos_site\*.json` e PDFs de prova/gabarito correspondentes | Fontes imutáveis para enunciado, alternativas, respostas e procedência. Nunca sobrescrever. |
| `C:\PRO\questoes\output_pdf_comentarios\relatorio_comentarios.json` | Motivos originais das 369 explicações nulas; 58 incluem gabarito não confirmado ou anulação. |
| `C:\PRO\site\content\questions\pdf-import\manifest.json`, `summary.json`, `excluded.json` | Estado atual da triagem e exclusões permanentes por ID. No worktree de importação, os mesmos arquivos estão em `C:\PRO\worktrees\questoes-importacao-20261024\content\questions\pdf-import\`. |
| `C:\PRO\site\scripts\prepare-pdf-questions.py`, `export-question-catalog.mjs`, `questions-admin.mjs`, `scripts\lib\question-import-contract.mjs` | Preparação, catálogo somente leitura, validação e importação do contrato `pro-questions/v1`. Usar o checkout em que estes arquivos estiverem efetivamente presentes. |
| `C:\PRO\site\supabase\migrations\029_create_questions_module.sql`, `034_archive_empty_disciplines.sql`; `src/types/database.ts` | Esquema, relações, RLS, RPC e filtro de disciplinas. |

Antes de editar, conferir `git status`, `git diff`, branch e `origin/main`; preservar mudanças preexistentes em `C:\PRO\site`. Usar worktree isolado baseado no `main` atualizado. Verificar os caminhos reais, pois o checkout principal pode estar atrás do worktree. Nunca ler ou registrar o conteúdo de `.env`, chaves ou tokens.

## 3. Preparação comum obrigatória

1. Congelar um inventário de 1.251 IDs por bloqueio, prova, banca, ano, disciplina de origem e presença de comentário, confrontando `manifest.json` com `excluded.json`, 75 IDs publicados e banco atual. Falhar se houver ID duplicado ou interseção indevida.
2. Exportar catálogo atual de disciplinas, tópicos, relações e questões **somente em leitura**, com o script existente. Guardar o snapshot fora do Git. O catálogo pós-publicação contém os 75 IDs atuais; **não regenerar a saída dos lotes publicados com ele**, pois isso pode classificá-los como `already_in_site`. Usar diretório de saída novo para candidatos novos.
3. Criar um registro de decisão por questão em área de trabalho separada: `external_id`, hashes da prova e do gabarito, bloqueio inicial, evidências localizáveis (arquivo, página, número da questão, URL oficial quando houver), decisão de gabarito, decisão de comentário, `discipline_slug`, `topic_id`, revisor, data e estado (`apta`, `retida` ou `excluída`). Não guardar URLs transitórias de busca nem credenciais.
4. Usar `external_id` como identidade estável e comparar também enunciado normalizado com o banco. Não substituir silenciosamente questão publicada nem alterar `source_content_hash` de item já importado.

## 4. Frentes de saneamento

### A. 437 com gabarito preliminar ou sem status definitivo

- Separar as 377 marcadas `preliminar` das 60 sem status. Para cada prova, localizar o gabarito **definitivo** da banca e eventuais decisões de anulação/retificação; registrar arquivo, hash, página e correspondência exata entre caderno, tipo, cargo e número.
- Conciliar alternativa/C-E por ID. Se o gabarito final divergir do JSON, corrigir apenas uma **cópia revisada** e registrar antes/depois e evidência. Anuladas, questões sem fonte final verificável e conflitos entre cadernos continuam retidas; não transformar `preliminar` em `definitivo` por inferência da IA.
- Após conciliação, reexecutar a triagem. Muitas passarão a exigir mapeamento de disciplina/tópico ou revisão do comentário já existente. Não importar pela simples confirmação do gabarito.

**Aceite da frente:** 437 decisões por ID, cada uma com fonte final rastreável ou motivo de retenção. Contagem de alterações de gabarito, anulações e fontes ausentes conciliada com o inventário.

### B. 369 sem comentário explicativo

- Ler `relatorio_comentarios.json` antes de propor texto. Separar gabarito não confirmado/anulado, ambiguidade de enunciado, falta de suporte legal ou cálculo, e problemas formais. Resolver o gabarito antes de escrever comentário. Não preencher comentário de questão anulada ou sem resposta verificável.
- Para candidatas válidas, produzir explicação original, didática e aderente ao gabarito da banca; conferir cada afirmação factual, cálculo e norma em fonte primária aplicável à **data da prova** e indicar quando a regra atual mudou. Se a explicação depender de norma superada ou fonte não recuperável, reter o item.
- Usar IA como rascunho e apoio de conferência. Marcar claramente `revisada_por_modelo` e `revisada_por_humano`; nunca promover automaticamente uma marcação da IA a revisão humana. Para imagens de cálculo, decodificar/regravar PNG e usar URL interna funcional antes de importar.

**Aceite da frente:** 369 decisões por ID; toda candidata à publicação tem gabarito final, explicação não vazia, sustentação verificável e revisão editorial registrada. As demais permanecem retidas com motivo específico. O importador atual exige explicação publicada; a sugestão do relatório de origem de importar sem comentário **não serve para a RPC atual**.

### C. 180 sem disciplina ativa correspondente

- Agrupar pelos valores de `subject` e conferir o **item concreto**. Rótulos como `A classificar` (41) e `Conhecimentos Específicos` (31) não são disciplinas; classificá-los pelo conteúdo e pelo edital/prova, quando possível.
- Mapear para `disciplines.slug` ativo já existente quando a equivalência for inequívoca. Para assuntos realmente ausentes (por exemplo, alguns de Atualidades, Contabilidade Pública, Direito Ambiental, SUS e legislação específica), apresentar uma proposta editorial com nome, justificativa, demanda, tópicos necessários e impacto nos módulos Resumos/Questões/Legis. Não reaproveitar disciplina parecida apenas para satisfazer o importador.
- Criar disciplina ou tópico novo somente após decisão editorial documentada; se houver mudança de schema, atualizar `src/types/database.ts` e criar migration. Alterações de conteúdo taxonômico devem preservar `slug`/`topic_id` existentes, RLS e relações. Não renomear disciplina existente em massa nem reclassificar as 112 questões anteriores sem revisão própria.

**Aceite da frente:** 180 decisões por ID, com disciplina ativa existente comprovada ou retenção/proposta taxonômica explícita. Nenhuma questão publicada em disciplina sem relação canônica com tópico ativo.

### D. 265 sem tópico identificado com segurança

- Consultar o tópico **da mesma disciplina** no catálogo atual. Usar assunto de origem, comando específico da questão, alternativas e escopo da explicação; o texto comum da prova não deve dirigir a classificação.
- Registrar um `topic_id` primário somente com evidência de aderência ao título e conteúdo do tópico. Não usar tópico genérico `outros` como saída automática. Se o catálogo estiver lacunar, apresentar proposta de novo tópico ou ajuste editorial, com impacto em Resumos e questões anteriores.
- Reavaliar as relações após qualquer ajuste de disciplina. Se mais de um tópico continuar plausível, manter retida com candidatos e motivo, sem escolher arbitrariamente.

**Aceite da frente:** 265 decisões por ID, cada candidata com um tópico primário ativo e pertencente à disciplina canônica; as não classificáveis permanecem retidas com justificativa.

## 5. Ordem, entregas e pontos de parada

Executar em ciclos pequenos por **prova**, com no máximo 25–50 candidatas por lote de revisão. Dentro de cada ciclo: (1) gabarito final; (2) validade editorial e comentário; (3) disciplina; (4) tópico; (5) segurança de Markdown, imagens e links; (6) validação do lote. Recalcular todos os bloqueios após cada etapa: os quatro números iniciais não são metas de conversão direta.

Entregar em cada ciclo: inventário antes/depois por motivo; decisões por ID e fonte; diff da cópia revisada contra o JSON original; lista de casos que exigem decisão humana; payload `pro-questions/v1` somente para itens aptos; validação Zod e hash; relatório de duplicatas contra o banco; plano de rollback do lote. Não produzir payload parcial quando qualquer item do lote falhar: separar e reter o item antes de fechar o lote.

**Parar antes da publicação** se faltar gabarito definitivo, evidência factual/jurídica, revisão editorial, disciplina/tópico válidos, imagem pública ou validação de contrato. Não executar chamadas pagas de IA em testes automatizados. Não enviar PDF ou conteúdo local a serviços externos fora do pipeline já autorizado sem verificar o escopo.

## 6. Gates para importação futura

1. Confirmar novamente `git status`/diff e catálogo remoto; gerar batches novos sem tocar nos 19 existentes. Validar `external_id`, `source_content_hash`, hash SHA-256 da fonte `_ATUALIZADO.json`, unicidade, gabarito, explicação, relações de disciplina/tópico e links. Conferir que nenhum dos 34 IDs excluídos aparece.
2. Executar testes do pipeline (`python -B -m unittest discover -s tests -p test_prepare_pdf_questions.py -v`, testes de questões/importação/conteúdo/autorização), lint, TypeScript, build e validação dos JSONs conforme os arquivos realmente alterados. Testar payloads maliciosos se o validador/importador mudar.
3. Publicar e verificar imagens antes do banco. Aplicar lotes apenas após revisão e preflight completos, com `scripts/questions-admin.mjs import --apply --confirm <batch_key>`; verificar cada lote via `verify`. Importação é atômica **por lote**, não pelo conjunto inteiro.
4. Confirmar SHA em `origin/main`, deploy correspondente e smoke autenticado no PROQuestões: cada nova disciplina aparece no filtro, busca localiza amostras por prova, gabarito não vaza antes da resposta, comentário aparece após responder, imagens carregam e tentativas permanecem isoladas entre dois usuários. Comparar contagens do banco, manifesto e interface. Push não comprova deploy.

## 7. Critério de conclusão do projeto

Todos os 1.251 IDs têm decisão individual e rastreável. A soma `publicados novos + retidos fundamentados + excluídos posteriormente` fecha em 1.251, sem duplicação com os 75 já publicados e sem retorno dos 34 excluídos. Só declarar publicação das candidatas efetivamente importadas e verificadas no banco e na interface. Atualizar este plano, `summary.json`, relatório de auditoria e `CHANGELOG.md` com contagens finais e riscos remanescentes.

## 8. Execução do Saneamento — 24/10/2026

### Inventário Congelado e Integridade
- Confrontação estrita entre `manifest.json` (1.326 itens), `excluded.json` (34 itens) e catálogo do banco em produção (187 questões: 112 originais + 75 publicadas).
- **Interseções indevidas:** 0. Todos os 34 itens excluídos permaneceram fora do trabalho. Todos os 75 itens já publicados e os 112 originais permaneceram intactos.
- Inventário congelado gerado em `C:\PRO\questoes\scratch\inventario_1251_congelado.json` com exatamente 1.251 IDs únicos.

### Resultados da Reconciliação e Triagem
- **Frente A (437 com gabarito preliminar/sem status):**
  - 434 conciliados e confirmados contra gabaritos definitivos oficiais das bancas (CEBRASPE, FGV, Cesgranrio).
  - 3 itens com gabarito alterado pela banca retidos para revisão editorial da explicação (`pdf:agente_de_policia_federal:039`, `pdf:agente_de_policia_federal:060`, `pdf:dpf14_009_01:113`).
- **Frente B (369 sem comentário explicativo):**
  - 369 itens retidos mantidos com os motivos específicos documentados de `relatorio_comentarios.json`.
- **Frente C (180 sem disciplina ativa) e Frente D (265 sem tópico identificado):**
  - Após a resolução do bloqueio de gabarito nas 437 questões da Frente A, a reexecução da triagem taxonômica revelou novos bloqueios específicos: 111 questões recaíram na Frente C (disciplina não existente) e 235 recaíram na Frente D (tópico não identificado com segurança).
- **Total de Decisões Individuais Registradas (`scratch/registro_decisoes_1251.json`):**
  - **Candidatas Aptas:** 80 questões distribuídas em 22 lotes pequenos por prova (1 a 10 questões por lote), todas com gabarito definitivo, comentário com links permitidos e taxonomia segura.
  - **Retidas Fundamentadas:** 1.171 questões:
    - `topic_not_identified`: 490 (255 da triagem inicial + 235 da reexecução)
    - `sem_comentario_explicativo`: 369
    - `disciplina_ausente_no_catalogo`: 277 (166 da triagem inicial + 111 da reexecução)
    - `conteudo_desatualizado`: 26 (24 da triagem inicial + 2 da reexecução)
    - `gabarito_alterado_necessita_revisao`: 3
    - `ambiguous_topic`: 3
    - `subject_topic_conflict`: 3
  - **Soma exata:** 80 + 1.171 = 1.251 itens. Soma total do ecossistema: 80 aptas + 1.171 retidas + 75 publicadas + 34 excluídas = 1.360.

### Preparação e Validação dos Lotes Candidatos
- 22 lotes gerados em diretório isolado `C:\PRO\questoes\scratch\candidate_batches\batches\`, sem interferência nos 19 lotes já publicados.
- 15 memórias de cálculo PNG processadas em `scratch/candidate_batches/images/`.
- **Validação Zod (`scripts/questions-admin.mjs validate`):** 22/22 lotes aprovados com 100% de conformidade com o contrato `pro-questions/v1`.
- **Verificação de duplicatas contra o banco:** 0 colisões de ID externo, 0 colisões de enunciado.
- **Ponto de Parada:** Em cumprimento à Seção 1 e Seção 5, a publicação automática NÃO foi executada; os lotes candidatos aguardam revisão humana editorial e autorização para o apply atômico.

## Instrução curta para colar na outra IDE

> Execute o plano em `docs/PLANO_SANEAMENTO_QUESTOES_PDF_PENDENTES.md` no ecossistema `C:\PRO`. Comece pelo diagnóstico e inventário dos 1.251 IDs, preserve os 34 excluídos, os 75 publicados e todas as fontes originais. Trabalhe em worktree isolado e em ciclos por prova. Não invente gabarito, comentário ou taxonomia. Entregue decisões com evidência e retenha casos não comprovados. Não importe nem publique antes de satisfazer todos os gates do plano; reporte contagens e bloqueios ao fim de cada ciclo.
