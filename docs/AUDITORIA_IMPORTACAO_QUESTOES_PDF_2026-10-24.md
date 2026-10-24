# Preparação das questões extraídas de PDF — 24/10/2026

## Estado observado

- `origin/main` analisada: `841073e29bfd9aee6fefbe023a350753294011e4`.
- Produção pública: `/resumos` retornou HTTP 200; `/resumos/dashboard/questoes` redirecionou visitante para `/resumos/login`; `/resumos/api/health` retornou `database=ok` e `payment_reconciliation=ok` em 24/10/2026. Isso não comprova o SHA implantado nem o funcionamento autenticado do módulo.
- Snapshot administrativo somente leitura do Supabase em `2026-10-24T23:04:40.771Z`: 32 disciplinas (31 ativas), 340 tópicos e 112 questões publicadas. As 112 questões existentes têm IDs externos `qpygem:*`, pertencem a Direito Administrativo e foram preservadas.
- A correspondência exata de enunciados com as 112 questões existentes não encontrou colisões. Identidade externa e enunciado devem ser comparados novamente antes de importar, pois o banco pode mudar.

## Modelo do banco e contrato de importação

| Área | Tabelas e restrições relevantes |
| --- | --- |
| Taxonomia | `disciplines` contém `slug` único, nome único e estado ativo/arquivado. `topics` contém o `topic_id` estável, título, disciplina legada e `archived_at`. `topic_discipline_relations` vincula tópico à disciplina canônica; há no máximo uma relação primária por tópico. |
| Conteúdo | `questions.external_id` é único. `question_discipline_relations` exige uma disciplina primária. `question_topic_relations` referencia `topics.topic_id` e admite um único tópico primário. Tópicos associados a uma questão publicada devem compartilhar disciplina com ela. |
| Resposta | `question_options` guarda alternativas ordenadas; `question_answer_keys` aponta para uma alternativa da própria questão. `question_explanations` tem estado editorial e exige `reviewed_at` quando publicada. O gatilho de publicação exige disciplina, alternativas, gabarito e explicação. |
| Auditoria | `question_import_batches` e `question_import_items` registram a origem, hash, IDs e ação inserida/reutilizada. `source_content_hash` impede substituir silenciosamente uma questão com o mesmo `external_id` e conteúdo diferente. |
| Dados pessoais | `user_question_attempts`, `user_question_preferences` e tabelas de comentários são separadas do conteúdo editorial e protegidas por RLS. Nenhuma dessas tabelas foi alterada. |
| Acesso | `list_questions`, `submit_question_answer`, `get_question_stats` e `list_question_disciplines` exigem acesso de conteúdo. A RPC administrativa `import_questions_batch` aceita apenas `service_role`, valida o lote e o importa atomicamente; cada questão aprovada pelo importador atual termina **publicada**. |

O contrato `pro-questions/v1` exige lote de até 1.000 questões, uma disciplina canônica por lote, pelo menos um tópico por questão, uma relação primária, alternativas válidas, gabarito correspondente e comentário não vazio. O nome de fonte deve terminar em `_ATUALIZADO.json`. Para preservar essa exigência sem alterar a migration, a preparação cria um snapshot filtrado de cada prova com esse sufixo em `content/questions/pdf-import/sources/`. O snapshot contém somente os itens incluídos nos lotes e omite `batch_grounding_urls` transitórios antes de versionar. O SHA-256 no lote corresponde exatamente aos bytes desse snapshot; `source.metadata.original_file_name` e `original_source_sha256` identificam o arquivo original intacto em `C:\PRO\questoes`. A chave do lote também inclui hash da transformação, para que uma nova classificação não seja tratada como repetição idempotente da antiga. O snapshot **não** significa revisão humana adicional.

## Conferência do relatório de origem

O arquivo `C:\PRO\questoes\output_pdf_comentarios\RELATORIO_IMPORTACAO_APP_IA.md` descreve 16 provas, 1.360 questões, 991 explicações e 369 retenções. As contagens foram confirmadas nos JSONs. Todas as questões tinham `topics=[]` e `import_ready=false`. Foram encontrados 81 comentários com referência de imagem, 99 PNGs na pasta de imagens e grupos de enunciados repetidos entre provas. Caminhos locais de imagem não são utilizáveis no navegador.

Há uma divergência material entre a prontidão declarada e a procedência do gabarito: das 991 questões comentadas, somente 554 trazem `source_metadata.answer_status=definitivo`; 377 trazem `preliminar` e 60 não registram status. Isso não prova que os 437 gabaritos sejam incorretos, mas impede tratá-los como definitivos sem conferência da fonte. Eles foram retidos, mesmo quando a taxonomia seria classificável.

## Preparação realizada

- `scripts/export-question-catalog.mjs` exporta localmente, em modo somente leitura, disciplinas, tópicos, relações e IDs/enunciados existentes para comparação. O snapshot fica fora do Git porque inclui conteúdo editorial do banco.
- `scripts/prepare-pdf-questions.py` preserva os 16 arquivos originais. Só propõe uma disciplina quando o assunto de origem tem correspondência explícita; só propõe tópico existente e ativo da **mesma** disciplina quando o assunto é específico ou o item final do enunciado contém um sinal inequívoco. O trecho comum da prova é ignorado para não contaminar a classificação.
- Foram gerados `manifest.json` para as 1.360 questões, 20 lotes `pro-questions/v1` com 77 questões de gabarito marcado como definitivo e tópico classificado, e cópias rastreáveis de 7 fontes. O assunto do lote usa o título canônico do tópico; o assunto original permanece em `source_metadata.source_subject`.
- Foram incluídos 11 PNGs usados pelas 77 questões, decodificados e regravados sem metadados, em `public/questions/calculations/`. Os comentários preparados usam URLs internas com o `basePath` `/resumos`; quatro links HTTP do Planalto foram convertidos para HTTPS, e os demais links externos passaram pela allowlist oficial.
- Alertas `DESATUALIZADO`, quando presentes nos comentários preparados, permanecem no texto.

### Resultado da triagem

| Situação | Questões |
| --- | ---: |
| Lotes tecnicamente prontos para a etapa de importação | 77 |
| Comentário presente, mas gabarito preliminar ou sem status | 437 |
| Disciplina sem correspondência ativa no catálogo | 185 |
| Tópico não identificado com segurança | 277 |
| Mais de um tópico plausível | 5 |
| Assunto de origem contradiz o tópico específico | 5 |
| Mesmo item encontrado em outra prova | 5 |
| Sem explicação revisada | 369 |
| **Total** | **1.360** |

As 914 questões comentadas fora dos lotes permanecem no manifesto, com motivo e candidato de disciplina quando houver. Entre elas há matérias sem disciplina correspondente, como Direito Ambiental, legislação de trânsito, SUS e conteúdos bancários. Não foram criadas disciplinas ou tópicos artificiais. As questões existentes no banco também não foram reclassificadas, pois não houve colisão que justificasse alteração.

## Repetição e verificações

Executar em um checkout do site com as dependências já instaladas. O exportador recebe o ambiente administrativo somente em runtime e não registra credenciais. O arquivo de catálogo deve ficar fora do repositório.

```powershell
node --env-file=C:\PRO\site\.env.local scripts\export-question-catalog.mjs --output C:\PRO\questoes\scratch\catalog-local.json
python -B -X utf8 scripts\prepare-pdf-questions.py --source-dir C:\PRO\questoes\output_pdf_comentarios\arquivos_site --catalog C:\PRO\questoes\scratch\catalog-local.json --images-dir C:\PRO\questoes\output_pdf_comentarios\imagens --output-dir content\questions\pdf-import --public-dir public\questions\calculations
python -B -m unittest discover -s tests -p test_prepare_pdf_questions.py -v
```

O script Python usa Pillow, já utilizado pelo renderizador das imagens do pipeline de questões. Validar todos os arquivos em `content/questions/pdf-import/batches/` com `questionImportBatchSchema` ou `npm run questions:admin -- validate --file <lote>`. Os testes também devem conferir SHA-256 das fontes copiadas, unicidade de IDs e links internos de imagem.

Verificações executadas nesta preparação: 20 lotes/77 questões aprovados pelo schema Zod; 77 relações tópico–disciplina conferidas no snapshot; 7 hashes de fontes conferidos; 11 imagens decodificadas e regravadas; testes Python 6/6, `test:questions` 14/14, `test:questions-import` 5/5, `test:content` 49/49 e `test:api-auth` 3/3; lint e build webpack aprovados. Um asset foi servido em `http://localhost:31467/resumos/questions/calculations/` com HTTP 200 e `image/png`.

Antes de qualquer `--apply`: atualizar o snapshot, repetir a classificação e revisar os 77 itens no aspecto editorial e jurídico. Depois, integrar e publicar os 11 assets de imagem, confirmar o SHA efetivo de produção e fazer smoke autenticado. O `--apply` publica imediatamente o conteúdo; por isso os lotes nesta branch **não foram enviados ao banco**. A revisão das 914 questões comentadas restantes requer confirmação do gabarito quando o status não for definitivo, complementação da taxonomia ou decisão editorial item a item. Não publicar questões com explicação nula pela RPC atual, que exige comentário publicado.

## Riscos remanescentes

- Os comentários foram revisados por modelos conforme a fonte. A preparação não equivale a revisão jurídica humana; alertas de desatualização e referências oficiais precisam de conferência antes da publicação. O relatório de origem não separa adequadamente os 437 comentários sem status de gabarito definitivo.
- O classificador é propositalmente restrito, mas classificação por termos específicos ainda pode errar. O manifesto e os lotes devem passar por revisão editorial por amostragem e, para casos legais sensíveis, por revisão integral.
- O catálogo e as 112 questões existentes podem mudar após o snapshot. Repetir preflight imediatamente antes da importação.
- Não houve deploy desta branch, smoke autenticado, teste de dois usuários ou `import --apply`. Os caminhos das 11 imagens só existirão em produção após o deploy correspondente.
- `npm audit --omit=dev` apontou oito avisos nas dependências travadas de `origin/main` (dois críticos, um alto e cinco baixos), incluindo Next.js, DOMPurify e Zod. São independentes desta preparação e exigem atualização e teste próprios antes de tratá-los como corrigidos.
