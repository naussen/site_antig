# Plano para tornar as questões de PDF prontas para importação

Data: 25/10/2026. Complementa `PLANO_IMPORTACAO_INTEGRAL_QUESTOES_PDF_2026-10-25.md`. Este documento termina no **preflight aprovado**; não aplica migration nem importa questões em produção.

## Resultado esperado

Entregar um conjunto final de lotes `pro-questions/v1` em que cada questão tenha identidade e fonte rastreáveis, gabarito definitivo comprovado, comentário coerente, disciplina/tópico canônicos, mídia utilizável, hashes válidos e decisão editorial honesta. A meta é recuperar as 1.187 candidatas atuais, mas a contagem pronta deve ser o resultado da evidência, nunca uma meta que force respostas. Questões sem confirmação possível devem permanecer `retida`, com motivo e próxima ação. As 75 publicadas, 60 excluídas e 38 anuladas ficam fora dos novos lotes.

## Diagnóstico que o executor deve reproduzir

| Item | Evidência atual | Ação necessária |
| --- | --- | --- |
| Quatro pastas em `C:\PRO\questoes\scratch` | 227 lotes, 1.187 `external_id` únicos; não coincidem com excluídas nem com as 75 publicadas | Congelar hashes e repetir a reconciliação antes de editar. |
| Status de resposta nos lotes | 911 `definitivo`, 4 `definitivo_alterado`, 209 `preliminar`, 24 `preliminar_com_ressalva`, 39 ausentes | Comprovar 272 respostas não definitivas e auditar as quatro alteradas. Status textual não prova a fonte da banca. |
| `C:\PRO\questoes\scratch\registro_decisoes_1251.json` | 1.187 marcadas `candidata_apta`; destas, 1.059 têm `taxonomy_decision.topic_id` vazio e 1.031 ainda têm `retention_category`; todas as 1.251 entradas atribuem revisão a `IA Antigravity - Pipeline de Saneamento` | O registro e os payloads divergem. Refazer decisão corrente por ID; conservar bloqueio inicial como histórico, sem rotular revisão de IA como humana. |
| Procedência do gabarito no registro | 620 candidatas não têm `gabarito_decision.official_url` | Verificar se há PDF oficial local com hash/página/item. URL vazia não é reprovação automática, mas evidência ausente deve bloquear a aprovação. |
| Relatório da outra IDE | Declara 25 PRF com ressalva e 5 gabaritos alterados; payloads mostram 24 e 4 | Localizar o quinto ID em cada grupo ou corrigir o relatório. |
| Migration 037 | Ainda não commitada; propõe 16 disciplinas/100 tópicos, mas o catálogo remoto observado contém 32/340. Dois `topic_id` já existem e o SQL usa `ON CONFLICT DO UPDATE` | Revisar como migração aditiva sem modificar registros existentes. Projeção bruta 48 disciplinas/438 tópicos, diferente dos 47/434 do relatório. |
| Imagens | 47 PNGs novos declarados no worktree, ainda não integrados/deployados | Vincular cada arquivo a questões finais, validar PNG e URL pública antes da importação. |

O executor deve preservar `C:\PRO\site` e o worktree, ambos com mudanças de outras tarefas. Começar por `git status`, `git diff`, branch, SHA de `origin/main` e inventário de arquivos não commitados. PDFs e JSONs em `C:\PRO\questoes\output_pdf_comentarios` são fontes imutáveis. Não ler ou registrar valores de `.env`, tokens ou chaves.

## Fase 1 — inventário único e registro confiável

1. Produzir uma tabela por `external_id` com estado inicial, fase/lote, arquivo e hash da prova/gabarito, `source_content_hash`, tipo, banca, caderno, item, resposta, comentário, disciplina, tópico, imagem e referências. Conferir a partição `75 + 60 + 38 + 1.187 = 1.360`, sem IDs repetidos. Associar os 38 anulados a prova e ato de anulação; conferir as 26 exclusões adicionais contra as 34 anteriores.
2. Separar no registro `initial_block` (histórico), `current_block` (após revisão) e `final_status`. Não deixar `candidata_apta` coexistir com `current_block` impeditivo. Não preencher `taxonomy_decision.topic_id` copiando cegamente do lote: confirmar que o `topic_id` do payload corresponde ao assunto específico e à disciplina canônica. Resolver as 1.059 lacunas e as 1.031 contradições com diff por ID.
3. Localizar as diferenças 25×24 e 5×4. Contabilizar IDs ausentes, duplicados ou reclassificados; atualizar o relatório somente depois da reconciliação. Recriar o inventário a cada alteração de lote, com hashes novos.

**Saída/aceite:** relatório de reconciliação reproduzível, 1.360 IDs em uma única classe cada, zero contradições entre registro e lotes. A classe `pronta` ainda fica vazia até os gates seguintes.

## Fase 2 — gabarito definitivo de cada candidata

1. Processar primeiro 209 `preliminar`, 24 `preliminar_com_ressalva` e 39 sem status. Reconciliar cada uma com gabarito **definitivo da banca** do mesmo cargo, prova, caderno, tipo e número. Para PRF, construir mapa item a item entre Caderno 3 e gabarito consolidado; uma ressalva no enunciado não valida a resposta. Conferir os quatro `definitivo_alterado` e a quinta questão anunciada no relatório.
2. Auditar também as 911 marcadas `definitivo`: `answer_status` herdado do JSON não substitui evidência. Registrar URL oficial **ou** caminho local do PDF oficial, SHA-256, página, item, resposta e retificações/anulações. Comparar alternativa/C-E, opções do payload e comentário.
3. Se a banca anulou, se o caderno não puder ser identificado ou se houver duas respostas incompatíveis sem documento final, retirar o ID dos lotes e marcar `retida` ou `anulada` com prova. Não alterar o gabarito para adequá-lo à explicação gerada por IA.

**Saída/aceite:** para cada ID que avança, resposta final reproduzível a partir da fonte e metadados consistentes. Zero `preliminar`, `preliminar_com_ressalva` ou status ausente entre candidatas prontas.

## Fase 3 — revisão dos comentários e atualidade

1. Reavaliar os 336 comentários novos, além de todos os comentários ligados a gabarito corrigido. Para cada questão, confrontar conclusão, passos de cálculo, alternativas e fontes com o gabarito definitivo e a data da prova. Explicações jurídicas devem indicar norma pertinente à época; se a regra atual diferir, a apresentação ao aluno precisa ser clara **antes** de ele usar uma resposta obsoleta. Manter fora as 60 exclusões.
2. Fazer revisão independente de alto risco (legislação revogada, previdência, saúde, fiscal, matemática/estatística e imagens); registrar asserções conferidas e referências oficiais. Corrigir em cópia versionada e recalcular hashes. Um link HTTPS ou `review_status=revisada_por_modelo` não atesta correção factual nem revisão humana.
3. Revalidar Markdown/URLs, ausência de HTML executável, protocolos inseguros, instruções transitórias de IA e caminhos locais. Explicação deve ser não vazia, útil e coerente com a alternativa correta. Sem fonte ou explicação confiável, reter o ID.

**Saída/aceite:** comentário final revisado por ID, evidência de suporte e identidade real do revisor. Zero contradições gabarito–comentário e zero itens com alerta de desatualização oculto.

## Fase 4 — taxonomia e migration segura

1. Exportar catálogo remoto em modo somente leitura e comparar todos os slugs/tópicos dos 1.187 payloads. Produzir matriz `ID → assunto original → disciplina proposta → tópico primário → evidência`. Conferir pertença do tópico à disciplina e compatibilidade com questões já publicadas.
2. Corrigir a migration 037 antes de integrá-la. Preservar os dois tópicos existentes `direitos-e-garantias-fundamentais` e `funcoes-essenciais-a-justica` sem alterar título, disciplina ou `archived_at`. Remover `ON CONFLICT DO UPDATE` que reativa ou sobrescreve conteúdo preexistente. Novos `topic_id` devem ser globalmente únicos. Testar repetição idempotente e RLS em banco descartável.
3. Confrontar a lista real de 16 disciplinas/100 tópicos com o relatório e com o catálogo do site. Disciplinas específicas sem conteúdo de Resumos podem existir para Questões, mas a decisão precisa ser editorialmente explícita; não criar tópico genérico para fechar a importação. Atualizar `src/types/database.ts` se houver alteração estrutural de schema.
4. Regenerar payloads afetados pela taxonomia e conferir o registro mestre novamente. A migration só será aplicada na fase de importação, depois de aprovada; esta fase termina com SQL testado e matriz sem pendências.

**Saída/aceite:** cada ID pronto tem disciplina ativa e um tópico primário válido da mesma disciplina; migration aditiva revisada, zero alterações implícitas nos 340 tópicos existentes.

## Fase 5 — fontes, imagens e lote final

1. Preservar os 19 lotes e 75 itens já publicados. Reempacotar somente novas candidatas aprovadas, em lotes pequenos por disciplina/fonte. Toda mudança de resposta, comentário ou taxonomia exige `source_content_hash`, hash de snapshot `_ATUALIZADO.json` e `batch_key` coerentes. Validar `external_id` contra banco e 60 excluídas.
2. Para cada PNG efetivamente usado, conferir arquivo de origem, assinatura/decodificação, dimensões, nome seguro e URL `/resumos/questions/calculations/<arquivo>.png` no Markdown. Distinguir arquivo apenas preparado de asset já no deploy. Não incluir imagem órfã ou caminho `C:\...` no payload.
3. Executar Zod nos lotes finais, conferência de SHA, relações e referências; rodar testes de importação, conteúdo/autorização, lint, typecheck e build quando arquivos desses fluxos mudarem. Testar lote malicioso se validador, Markdown ou rota forem alterados. `import --file` sem `--apply` é dry-run estrutural, não importação.
4. Fazer inspeção editorial por amostra estratificada de cada prova/tipo/disciplina e revisão integral dos itens de alto risco. Emitir `readiness.json` ou relatório equivalente com IDs `pronta`, `retida`, `anulada` e motivo, sem misturar bloqueios históricos com atuais.

**Saída/aceite:** todo lote final valida, todos os hashes batem, nenhuma mídia falta e não há colisões com banco. O número de questões prontas é a soma real dos IDs que passaram pelas Fases 1–5; pode ser menor que 1.187.

## Ordem de execução e marco de encerramento

Trabalhar por prova em ciclos de 25–50 questões, mantendo checkpoints atômicos. Concluir Fases 1 e 2 antes de ampliar geração de comentários; a Fase 4 pode preparar a migration em paralelo, mas só fecha após reconciliação do registro e do catálogo. Em cada ciclo, entregar IDs aprovados, retidos e alterados, com evidência e hashes. Parar na primeira divergência de contagem, fonte ou contrato; corrigir e repetir o preflight afetado.

O projeto de prontidão termina quando todos os 1.187 IDs tiverem decisão atual, os lotes aprovados estiverem congelados e `PLANO_IMPORTACAO_INTEGRAL_QUESTOES_PDF_2026-10-25.md` puder iniciar sem bloqueio de dados, comentário, taxonomia, mídia ou migration. A execução de deploy, migration e `import --apply` pertence ao plano de importação e será relatada separadamente.

## Instrução curta para outra IDE

> Execute `docs/PLANO_PRONTIDAO_QUESTOES_PDF_2026-10-25.md` até fechar um conjunto final de lotes prontos. Comece reparando a divergência entre `registro_decisoes_1251.json` e os payloads. Comprove gabaritos em documentos definitivos da banca, revise comentários e taxonomia, corrija e teste a migration 037, reconstrua hashes/lotes e entregue contagem por ID. Preserve PDFs/JSONs originais, 75 publicadas, 60 excluídas e 38 anuladas. Não aplique migration nem importe no banco durante esta etapa.
