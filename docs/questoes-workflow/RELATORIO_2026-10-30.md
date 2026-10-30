# Diagnóstico e decisão sobre o fluxo de questões

Data: 30/10/2026. Consulta administrativa somente de leitura às 16h44, horário de Brasília. Código de referência: `origin/main` em `6013239`. Implementação isolada em `feat/questoes-fluxo-20261030`.

## Conclusão

Recomendo **fluxo local com contratos executáveis, Vertex/ADC como motor e Antigravity como orquestrador**, aproveitando o importador transacional do site. Outro aplicativo de extração ou um prompt gigante reproduziria a fragmentação atual. O QPYGEM existente produz material de lei seca e não é um importador genérico de provas; não deve ser confundido com esta ferramenta.

É possível reduzir muito o trabalho manual. Não é honesto prometer zero erro ou nunca mais precisar de revisão: o sistema precisa poder parar uma prova, preservar tudo e explicar a exceção. O usuário não precisa renomear os PDFs nem conferir cada questão. Ambiguidades que a busca oficial e a revisão independente não resolverem ficam retidas.

Esta entrega implementa ferramentas de diagnóstico, execução de etapas no Vertex e validação, além de um procedimento completo com prompts para o Antigravity. **Não implementa um serviço autônomo em produção, não altera o banco e não importa o novo lote.** A árvore taxonômica compartilhada e sua aplicação nos filtros dos três módulos continuam sendo uma evolução a implementar; há plano e critérios de aceite abaixo.

## 1. Evidência atual do banco

O snapshot foi obtido com o ambiente administrativo já usado pelo site, sem exibir credenciais, sem consultar tabelas de usuários e sem executar RPC de escrita. A leitura é paginada e observacional, não uma transação de snapshot PostgreSQL. Os números são da consulta, não do relatório antigo de 25/10.

| Item | Observado |
| --- | ---: |
| Questões totais | 1.349 |
| Publicadas | 1.314 |
| Arquivadas | 35 |
| Disciplinas cadastradas | 50 |
| Tópicos cadastrados | 524 |
| Relações tópico–disciplina | 524 |
| Alternativas | 3.762 |
| Gabaritos | 1.349 |
| Explicações editoriais | 1.349 |
| Leis | 15 |
| Fragmentos legais | 27.233 |
| Relações tópico–fragmento legal | **0** |

Todas as publicadas têm uma relação primária de disciplina e tópico e os campos banca/órgão/cargo/ano/hash preenchidos. Não houve incompatibilidade referencial tópico–disciplina no snapshot. Isso **não demonstra correção semântica**: o agrupamento quantitativo errado é perfeitamente válido nas constraints atuais.

Entre as publicadas, 1.202 têm procedência PDF e 112 são legadas. Das primeiras, 1.197 declaram gabarito definitivo e cinco, definitivo alterado. As 112 legadas não possuem `answer_status`. Os metadados variam entre origens; não representam uma ficha editorial uniforme. A ausência de status nas legadas é lacuna de evidência, não prova de gabarito errado.

### Modelo e contratos reais

| Entidade/campo | Função e limite |
| --- | --- |
| `disciplines` | UUID, slug, nome, estado; catálogo compartilhado. |
| `topics` | Unidade de conteúdo de Resumos; `topic_id` textual, título e disciplina legada em texto. **Não tem árvore pai/filho ou nível sub­tópico.** |
| `topic_discipline_relations` | Liga a unidade de conteúdo ao catálogo de disciplinas. |
| `questions` | UUID interno, `external_id` único, tipo, enunciado Markdown, `subject` livre, banca/órgão/cargo/ano, estado, hash e JSONB de procedência. |
| `question_discipline_relations` / `question_topic_relations` | Classificação relacional usada pelos filtros. Exatamente um vínculo primário por questão publicada. |
| `question_options` / `question_answer_keys` | Alternativas ordenadas e uma opção correta. O gabarito fica separado do enunciado; preservar as RPCs que controlam sua revelação. |
| `question_explanations` | Comentário editorial exibido ao aluno. `question_comments` é discussão de usuários e não substitui esse conteúdo. |
| `question_import_batches` / `question_import_items` | Auditoria técnica de importação. Não prova revisão factual. |
| `topic_legal_fragment_relations` | Ponte já existente entre Resumos e Legis, atualmente vazia. |

Referências verificadas: migrations 010, 022, 029, 031–033, 037, 039–041; `src/types/database.ts`; `scripts/lib/question-import-contract.mjs`; `scripts/questions-admin.mjs`; tipos do Legis. O formato de publicação continua `pro-questions/v1`; não criar outro importador com regras diferentes.

A RPC importa um lote numa transação, recusa alteração de identidade existente com hash diferente e protege dados respondidos. Entretanto, **cria/renomeia/reativa a disciplina recebida**. O `import` sem `--apply` do CLI apenas valida o JSON localmente; **não consulta a existência dos tópicos no banco**. É por isso que o novo gate confronta o lote com snapshot recente antes de qualquer publicação.

## 2. Erro quantitativo: confirmado e localizado

A disciplina `raciocinio-logico-matematica-estatistica-e-matematica-financeira` reúne **82 publicadas**:

| Tópico atual | Questões | Disciplina proposta |
| --- | ---: | --- |
| `matematica` | 39 | Matemática |
| `raciocinio-logico` | 20 | Raciocínio Lógico |
| `estatistica` | 10 | Estatística |
| `matematica-financeira` | 13 | Matemática Financeira |

Recomendo quatro disciplinas. Matemática Financeira também tem conteúdo próprio. A proposta individual está em `separacao-quantitativas-20261030.json`; preserva a classificação primária existente como hipótese inicial e exige conferência semântica antes de executar a mudança.

Há uma causa concreta no código: `scripts/prepare-pdf-questions.py`, linhas 37 e 51–55, mapeia os diferentes nomes para o mesmo slug composto. A migration 039 corrigiu alguns **tópicos**, mas conservou a disciplina agrupada. Só corrigir dados, sem impedir o gerador de repetir o agrupamento, produziria retrabalho.

Não recriar questões nem trocar `external_id` para corrigir classificação. Preservar UUID, alternativas, gabaritos, tentativas e preferências. A reclassificação precisa de migration própria com pré-condições e auditoria, não de reimportação. Os hashes históricos devem continuar rastreáveis: não recomputar como se o aluno tivesse respondido outra questão.

## 3. Os novos PDFs

Foram lidos os 14 PDFs, extraídas suas 147 páginas e inspecionadas visualmente as capas e páginas-chave dos gabaritos. Não foi realizada auditoria visual de cada uma das 147 páginas nem transcrição validada de cada questão. `pareamentos-20261030.json` contém hashes e propostas, sem aprovação editorial.

| Prova | Gabarito candidato | Constatação |
| --- | --- | --- |
| Soldado PM/SP, tipo 1, 2024 | `gabarito (4).pdf` | Declara **preliminar**; reúne tipos 1–4. Definitivo oficial recuperado separadamente. |
| BB, Escriturário/Agente Comercial, seleção 2021/001 | `gabrito.pdf` | Prova A/gabarito 1; o PDF reúne outros gabaritos. Não presumir definitivo. A nova prova difere da anterior cadastrada como 2022. |
| CONAB, cargo 201, tipo A, 2014 | `gab_definitivo.pdf` | Tipo A na página 1, junto a outros tipos; `#` é anulação. |
| STM, código `STM10_003_11` | `gabaritos (1).pdf` | Arquivo de 32 páginas; específicos 61–120 na página 3. Os básicos 1–60 precisam do bloco comum compatível. Edital 2010 e aplicação 2011 não são a mesma data. |
| TJSP, Escrevente, 2021 | `gabarito (5).pdf` | Somente imagem útil; quatro versões. O Vertex reconheceu versões/faixas, mas o documento não declara definitivo. |
| ICMBio, Analista Administrativo, específicos, 2014 | `gab_defini_conheci_especi (1).pdf` | Cargo 1/código `ICMBio14_001_01`, itens 51–120 na página 1. |
| ICMBio, conhecimentos básicos superior, 2014 | `gab_defini_conheci_basicos (1).pdf` | Usar **página 2**, código `ICMBio14_CBNS01_01`; página 1 é nível médio. |

**Duplicata confirmada por texto normalizado:** a nova prova básica superior ICMBio tem exatamente o texto da versão anterior após remover a marca d'água e normalizar espaços. Os PDFs têm hashes diferentes. Portanto, hash de arquivo e renomeação não resolvem deduplicação de conteúdo. Conferir eventuais retificações de gabarito, sem duplicar as questões. Evidência em `duplicatas-20261030.json`.

A ordem dos downloads não equivale à ordem alfabética. Mesmo a ordem temporal não é evidência suficiente: o gabarito do STM aparece mais tarde, entre arquivos do ICMBio. Manter nomes originais, dar nomes lógicos no manifesto e relacionar por evento/cargo/caderno/bloco/número. Um gabarito pode servir a diversas provas e uma prova pode depender de vários blocos.

**Recuperação oficial executada:** a [página do concurso FGV](https://conhecimento.fgv.br/concursos/pmespsoldado24) disponibiliza o definitivo em 27/08/2024. No [PDF definitivo](https://conhecimento.fgv.br/sites/default/files/concursos/pmesp2024_gabarito_definitivo-1.pdf), para o tipo 1, a questão **19 está anulada** e a **53 tem resposta D**, enquanto o preliminar fornecido traz A e E, respectivamente. A fonte foi baixada para pasta de trabalho separada e seu hash registrado em `fonte-oficial-pmsp-20261030.json`. O original do usuário permanece intacto. Essa recuperação resolve a falta do definitivo da PM/SP, mas não equivale a aprovação da transcrição/comentários da prova.

O inventário desconsidera marcas d'água ao estimar texto útil: caso contrário, um PDF digitalizado com apenas a marca do PCI seria erroneamente tratado como extraível. Marcação `pages_requiring_vision` é heurística; a decisão de qualidade também precisa da inspeção de layout e imagens.

## 4. Comparação dos estágios anteriores

O arquivo `PROMPTS.txt` foi tratado como histórico de pedidos, não como instruções para executar exclusões ou publicações agora.

| Estágio | Forma encontrada | Risco |
| --- | --- | --- |
| Extrator do livro | Campos em português: `disciplina`, `topico`, `assunto`, `enunciado`, `alternativas`, `comentario` etc. | Feito para uma obra estruturada, não para todo PDF bruto. |
| `output_revisado/*_ATUALIZADO.json` | 21 arquivos, **10.974 questões**; estados `VALIDA` e `ADAPTADA`. | Catálogo maior que o importado; status de revisão não significa que exista no site. |
| `output_pdf` | 16 provas, **1.360 questões**, envelope `pro-questions/extracted-pdf/v1`. | Sem tópico canônico definitivo; mistura de estados de gabarito. |
| `output_pdf_comentarios/arquivos_site` | Mesmos 1.360 IDs; **1.322 com explicação**. `explanation` é texto, não o objeto exigido no lote final. | Não é payload pronto de publicação; campos `import_ready` continuam distintos da aprovação. |
| Lote publicado | Envelope `pro-questions/v1`, uma disciplina, opções e relações com tópicos, `explanation.body_markdown`. | Validação estrutural não cobre fidelidade à fonte ou atualidade do comentário. |

Entre a extração PDF e a cópia comentada houve mudanças em **147 enunciados, 124 gabaritos, cinco conjuntos de alternativas e 235 hashes**. Nenhum ID foi acrescentado/removido nessa comparação. Essas mudanças podem incluir reconciliação legítima, separação de justificativa oficial ou ressalva; não foram classificadas automaticamente como erros. Demonstram que a etapa chamada "comentários" também mudou dados essenciais: futuras mudanças precisam de delta e revisão vinculados ao hash final.

Os prompts históricos acumulam separação de disciplinas, reescrita de comentários, IDs curtos, atualização jurídica, adaptações/exclusões, novas revisões, comentários didáticos, migrações taxonômicas e importação. Eles descrevem intenções, mas não fixam schema, identidade de prova, cobertura, estados de gabarito, catálogo ou testes. Reescrever todo comentário para diferir do original não é controle de qualidade nem comprovação de direitos sobre material de terceiros. Gerar comentário original, com fonte verificável, preservando enunciado e alternativa da banca.

## 5. Arquitetura para os três módulos

**Não transformar todo novo assunto em um resumo vazio.** Hoje `topics` acumula conteúdo editorial e classificação. Para crescimento contínuo, separar a taxonomia do conteúdo que a utiliza:

1. Cadastro canônico versionado de conceitos: UUID permanente, chave semântica, rótulo, tipo (`discipline`, `topic`, `subtopic`), pai e estado. Pai e disciplina devem ser coerentes e ciclos proibidos. Alias tem escopo por disciplina; rótulos iguais em áreas distintas não são o mesmo conceito.
2. Relações conceito–questão, conceito–unidade estável de Resumos e conceito–fragmento legal. Para Resumos, conservar `content_unit_id`/`stable_key`; para Legis, `law.slug` + `legal_fragment.stable_key` e versão/hash. Não ligar somente ao UUID de fragmento de uma versão que pode ser substituída.
3. `topics` e o contrato v1 permanecem como compatibilidade durante a transição; adaptadores resolvem conceitos para IDs existentes. O mesmo conceito alimenta os três módulos, não três classificadores independentes.
4. Novo conceito é proposta rastreável. Resolver alias/duplicata/parentesco antes de criar. O fluxo prepara migration e atualização de tipos/queries, testa em ambiente isolado, aplica uma vez e atualiza o catálogo. Nunca mascarar falta de tópico com "Outros" ou com uma disciplina parecida.
5. Um conceito pode ter várias relações legais ou nenhuma; temas doutrinários não precisam corresponder a um artigo com o mesmo nome. Exemplo pedido: Direito Penal → Parte Geral → Culpabilidade. O catálogo consultado não contém tópico com esse título. `codigo-penal` existe, mas não há vínculos cadastrados; referências específicas precisam de revisão, sem inventar artigos.

Essas são propostas arquiteturais, não tabelas já existentes. A migration canônica continua em `C:\PRO\site\supabase\migrations`. Implementar junto aos tipos, RLS, resoluções de versão e consultas dos três módulos. JSONB sozinho não torna um sub­tópico pesquisável nem cria integração visual.

## 6. Plano de evolução com critérios de aceite

| Etapa | Entrega | Aceite |
| --- | --- | --- |
| A — entregue | Inventário, snapshot, comparação, executor Vertex, gate e prompts. | PDFs preservados; diagnóstico reproduzível; testes offline; smoke real declarado separadamente. |
| B — pendente | Separação quantitativa e retirada do mapeamento composto do gerador. | 82 IDs reconciliados individualmente; quatro disciplinas; nenhum progresso/tentativa perdido; rollback testado. |
| C — pendente | Taxonomia compartilhada e adaptadores dos módulos. | Exemplo Culpabilidade acessível pelos mesmos IDs conceituais; filtro disciplina/tópico/sub­tópico coerente; RLS, dois usuários e três temas/mobile validados. |
| D — procedimento entregue, execução pendente | Novo lote completo processado pelo orquestrador Antigravity/Vertex. | Cada prova fecha números/contagem e gabaritos; duplicatas reconciliadas; pendências isoladas; comentários e fontes auditados. |
| E — pendente | Publicação das provas aprovadas. | Gates completos, backup verificável, importação transacional e verificação pós-gravação; nenhum lote de prova incompleto publicado. |

A política editorial vigente de 26/10 exige decisão humana rastreável. A revisão automática deve ser identificada como IA; não preencher nomes humanos, `approved_by` ou datas fictícios para satisfazer essa regra. O pedido de autonomia orienta a evolução dessa política, mas o kit não altera silenciosamente a governança de produção. Um modelo independente pode revisar o lote inteiro e reduzir o esforço humano a exceções e a uma aprovação consolidada, conforme a política que vier a ser adotada.

## 7. Verificação e limites

ADC de usuário renovou com sucesso; nenhuma variável de credencial de conta de serviço estava sobrepondo o ADC no processo verificado. `count_tokens` funcionou no Vertex usando o ambiente do PYGEM. Houve uma chamada real de leitura do gabarito TJSP com `gemini-3.5-flash`, com JSON estruturado, quatro versões identificadas, status não inventado e uso reportado de 5.164 tokens totais. Saldo e elegibilidade dos créditos não foram consultados.

As ferramentas não garantem correção semântica nem autenticidade de atestados de revisão preenchidos por outro agente. O gate verifica hashes, evidências declaradas, páginas, relações, revisão e duplicatas simples; fontes oficiais, diferenças de cadernos, imagens, atualidade e similaridade semântica ainda exigem os agentes revisores. Não houve importação, execução de migration ou teste autenticado de tela nesta entrega.

Verificações finais executadas no checkout com dependências do lockfile instalado: **100 testes Node e cinco Python aprovados**, compilação Python, TypeScript e build Next.js 16.4.3 com webpack aprovados. Lint geral: zero erros e cinco avisos preexistentes em `apply-migration-037.mjs` e `question-card.tsx`; os novos scripts passam no lint sem avisos. `npm audit --omit=dev`: zero vulnerabilidades. JSONs e links locais Markdown validados. A pasta principal do site e seus arquivos preexistentes não foram alterados.

O prompt único para iniciar o processo está em [INICIAR_NO_ANTIGRAVITY.md](INICIAR_NO_ANTIGRAVITY.md). O contrato operacional e os comandos estão em [FLUXO.md](FLUXO.md). Evidências detalhadas: [evidencias-20261030.json](evidencias-20261030.json).
