# 47 — Macroeconomia

Atualização: 24/11/2026 (data local). **Parcial: 10/20 seções revisadas, publicadas e reconciliadas; um tópico parcialmente revisado, zero tópicos encerrados.**

## Lote vigente — somente 06–10

Lidos integralmente texto, seis callouts e quatro diagramas de `macroeconomia-sec-06` a `10`: Métodos para Se Calcular o Índice de Inflação; Identidades Macroeconômicas Fundamentais; Balanço de Pagamentos; O Papel do Governo e a Rigidez de Salários; A Lei da Demanda Efetiva. Não havia cartões ou mnemônicos; ausência mantida. Duas tabelas didáticas incluídas: exemplo de índices (06) e estrutura do BP (08). Mantida a ausência de mapa em 08; não criada seção nova.

### Diagnóstico, escopo e preservação

Entrada Git: editorial `8ebc1b4`, sem remote; worktree documental do site `9c6b4cf`, limpa e alinhada a origin/main. Conferidos status/diff, relatório e checkpoint anteriores, inclusive propostas não rastreadas; nenhuma proposta ampla foi aplicada. Alterações preexistentes do checkout principal, `workflow_onda.py`, demais frentes e evidências anteriores foram preservadas.

Leitura atual do banco comparada à pré-imagem de 01–05 mais a publicação v3: um tópico/20 seções, conteúdo esperado e revisões 01–05 idênticas ao recibo publicado. Demais revisões também conferidas. A revisão editorial limita-se a 06–10; comparação técnica com vinte seções não certifica leitura das dez seguintes.

Riscos tratados: mistura de convenções BPM5/BPM6; identificação de índices, fatores e taxas; identidades realizadas versus modelos de comportamento; condições de financiamento e emprego. Mantidos IDs, content_unit_ids, stable keys, títulos, ordem e contratos, sem alterações de aplicação, segurança, schema, credencial ou dado pessoal.

### Achados e tratamento

| Seção | Correções e omissões tratadas |
| --- | --- |
| 06 | Corrigida equiparação de Laspeyres ao deflator, escrita Fisher e marcação matemática danificada. Explicitadas quantidades-base/atuais, fator 100, base comum da média geométrica e taxa de variação do índice. Deflator ligado a Paasche apenas no exemplo de preços fixos compatíveis, sem generalizar séries encadeadas. Exemplo fictício diferencia L = 115, P = 114 e F ≈ 114,50; índice 120 → 126 significa 5%, não 6%. Callout/mapa alinhados. |
| 07 | Qualificada igualdade produto/renda/despesa realizada e retirada identificação automática com demanda planejada. Comparação S/I explicitada como simplificação; conta completa inclui transferências de capital e ativos não produzidos. Identidade de saldos setoriais preservada com hipóteses declaradas, sem confundir necessidade de financiamento com todo indicador fiscal ou atribuir instrumento/credor obrigatório. Exemplo 50 = 20 + 30 conferido. Rótulo Mermaid com aspas/colchetes aninhados corrigido e mapa validado. |
| 08 | Separados BP/PII/reservas e residência econômica/nacionalidade; removidos “sempre em US$” e crédito/débito como fluxo cambial necessário. Estrutura BPM6, rendas primária/secundária e sinais explícitos: CF = A − L; CC + CK + EO = CF. Corrigidos X − M = CC, tratamento de migrantes, patentes, lucros reinvestidos, reservas como outros investimentos, atrasados e estoque de reservas como saldo total. Principal/renda e valoração FOB qualificados. Trecho Clássicos/Keynes mantido com contexto enxuto, sem cadeia causal única da crise de 1929 nem alegação de ausência de intervenção; preservadas distinções teóricas com limites. Dois callouts alinhados; nenhum mapa adicionado. |
| 09 | Corrigidos salário nominal como valor líquido creditado e salário real como divisão por preço de um bem isolado. Diferenciadas bases 1/100 do índice, com exemplo 3.000 → 3.300 e índice 100 → 110 sem ganho real. Retiradas garantia de pleno emprego por salário mínimo e exclusividade universal da rigidez nominal; flexibilização salarial não assegura demanda suficiente por si só. Corrigido rótulo Mermaid aninhado; callout/mapa coerentes. |
| 10 | Princípio da demanda efetiva apresentado com receitas esperadas/custos e possibilidade de equilíbrio com desemprego. Retiradas “demanda cria oferta” como lei mecânica, expansão até pleno emprego como resultado obrigatório e alegação de consenso universal. Políticas fiscal/monetária qualificadas por condições e limites; callout/mapa alinhados. |

Nenhuma seção excluída, fundida ou renomeada. Redundância histórica sem sustentação causal foi reduzida dentro de 08; não movida para outro tópico nem usada para ampliar o lote. Não houve revisão semântica de 11–20.

### Fontes primárias — conferidas em 24/11/2026

URLs e vínculo por seção também em `fontes.json`. Consultados trechos pertinentes, não manuais inteiros. Edições históricas identificadas e complementadas por documentação de 2026 quando o estado atual importava.

- [ABS — teoria de índices de preços](https://www.abs.gov.au/statistics/detailed-methodology-information/concepts-sources-methods/producer-and-international-trade-price-indexes-concepts-sources-and-methods/2022/chapter-3-technical-methodology/price-index-theory): fórmulas de Laspeyres, Paasche e Fisher (06).
- [Eurostat — medidas de volume](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Building_the_System_of_National_Accounts_-_volume_measures): pares de índices preço/volume e encadeamento (06).
- [Eurostat — contas setoriais anuais](https://ec.europa.eu/eurostat/cache/metadata/en/tipsnf_esms.htm), conceitos 3.4: poupança, transferências de capital, investimento e ativos não produzidos na capacidade/necessidade de financiamento (07). Identidade setorial e números fictícios são derivações com convenções declaradas.
- [BCB — nota explicativa de fevereiro de 2026](https://www.bcb.gov.br/content/estatisticas/notas_metodologicas/balanco_pagamentos/bpm6/Nota%20Explicativa%20-%20Indicadores%20do%20Setor%20Externo.pdf): confirma BPM6 como referência da compilação brasileira; não presumida adoção de BPM7 (08).
- [BCB — nota 1, novembro/2014](https://www.bcb.gov.br/content/estatisticas/notas_metodologicas/balanco_pagamentos/bpm6/nm1bpm6p.pdf), seções 3.1–3.3: estrutura, migrantes, PII e convenção de sinais; [nota 2, abril/2015](https://www.bcb.gov.br/content/estatisticas/notas_metodologicas/balanco_pagamentos/bpm6/nm2bpm6p.pdf): bens, serviços, propriedade intelectual e rendas; [nota 3, abril/2015](https://www.bcb.gov.br/content/estatisticas/notas_metodologicas/balanco_pagamentos/bpm6/nm3bpm6p.pdf): investimento direto, dívida intercompanhia e lucros reinvestidos (08).
- [BEA — conceitos e métodos, setembro/2026](https://bea.gov/sites/default/files/2026-09/BEA-International-Economic-Accounts-Concepts-and-Methods.pdf), capítulo 6, §§6.6–6.17: residência econômica, referência de um ano e exceções. Não transpostas regras nacionais americanas para o Brasil (08).
- [FMI — FAQ BPM5/BPM6](https://www.imf.org/external/pubs/ft/bop/2007/bpm6faq.pdf), Q5 sobre erros e omissões: EO = CF − CC − CK; [reservas internacionais, capítulo 2](https://www.imf.org/external/np/sta/ir/IRProcessWeb/pdf/chapter2.pdf), §§64–76 e 96: controle/disponibilidade, composição e posição no FMI (08).
- [Federal Reserve — Grande Depressão](https://www.federalreservehistory.org/essays/great-depression): crises bancárias/monetárias e reformas/respostas de 1932–1933, afastando a narrativa de inexistência de intervenção (08).
- [BLS — cálculo de remuneração real](https://www.bls.gov/opub/hom/ces/calculation.htm), equação 15: deflação pela razão de índice-base 100 e fator 100 (09). Não importados valores ou índices norte-americanos para o exemplo fictício.
- Keynes, *The General Theory*, 1936, texto original reproduzido no acervo HET: [capítulo 3](https://www.hetwebsite.net/het/texts/keynes/gt/chap03.htm), demanda efetiva e emprego; [capítulo 18](https://www.hetwebsite.net/het/texts/keynes/gt/chap18.htm), expectativas, investimento/juros/moeda e limites; [capítulo 19](https://www.hetwebsite.net/het/texts/keynes/gt/chap19.htm), crítica à garantia de pleno emprego por salários flexíveis (08–10). Fonte primária histórica, não alegação de consenso contemporâneo.

Limites de acesso: manual CPI/FMI e capítulos BPM6/FMI tentados retornaram 403/404; fórmulas foram conferidas em ABS/Eurostat acessíveis, residência/classificações em BCB e BEA 2026. Material inacessível não foi tratado como lido.

### Preparação, validação, aplicação e reconciliação

Evidência final: `orquestracao-03-54/saneamento-onda-7/47-macroeconomia/indices-bp-keynes-06-10-20261124-v2/`. Executor: `../indices-bp-keynes-06-10-lote.mjs`.

1. Pré-imagem integral de um tópico/20 seções, com IDs e revisões. Payload muda apenas texto, callouts e mapas de 06–10; títulos, ordem, identidades, cartões e mnemônicos preservados. A proposta ampla não rastreada permanece separada.
2. Primeira proposta validada recebeu ajuste de Markdown para frações em blocos de exibição. **Somente v2 publicada.** Versão inicial é preparação, não lote aplicado.
3. Dry-run final do CLI aprovado. O arquivo contém vinte seções por exigência do contrato de preservação; SQL contém somente cinco updates e zero inserts/deletes. Quinze seções incluídas intactas no dry-run não foram republicadas.
4. Ensaio final com BEGIN/ROLLBACK aprovado. Controle negativo na primeira versão colocou revisão divergente na **última** seção (10): rejeição esperada, seguida de confirmação de que todas as revisões continuavam intactas, incluindo as quatro anteriores tentadas. Guardas, IDs e revisões esperadas são idênticos na v2; só a marcação matemática de 06–09 mudou. Três controles Mermaid maliciosos rejeitados; quatro mapas finais aceitos pelo validador compartilhado e pelo renderizador.
5. Releitura imediatamente anterior à publicação confirmou conteúdo e todas as vinte revisões intactos. Escrita atômica com comparação de current_revision_id/content_unit_id/tópico ativo e bloqueio compartilhado/comparação dos metadados do tópico; timeout de 5 s. Mecanismo existente; nenhuma migration ou alteração de controle de acesso.
6. Aplicação confirmada pelo recibo e reconciliação posterior integral: um tópico/20 seções, sem ausentes/extras/divergências; cinco revisões novas e quinze revisões intactas, **incluindo 01–05 publicadas**. Rótulo `target: preimagem` é o comparador genérico com esperado corrigido. Publicação de conteúdo confirmada no banco; não é deploy de aplicação.

SHA-256 das cinco seções publicadas: `2798ff34f6c9d4e554b49625f15d20ef4dd383a4c0262ad55ca6d2eb292e529f`.

### Verificações e limitações

- 14 cálculos independentes aprovados: cestas/índices, inflação, saldos setoriais, conta financeira e salário real. Resultados em `verificacao-numerica.json`; exemplos fictícios, sem dados econômicos correntes ou orientação financeira.
- 30 combinações finais: cinco seções × Light/Dark/Sepia × 375/1200 px. Seis de 10 reaproveitadas após igualdade estrita do conteúdo/componentes; 24 de 06–09 refeitas após correção de exibição. Seis checagens de tabela no celular e 24 interações de zoom/overlay aprovadas, sem erros KaTeX ou overflow do artigo. Rolagem interna de tabelas testada.
- Capturas inspecionadas para frações de 06, identidade de 07, tabela/texto extenso de 08, salário real de 09 e mapa/argumento de 10. Harness com componentes reais e CSS compilado da worktree `questoes-experiencia-20261122`; não é navegação autenticada de produção. Conta de aluno dispensada.
- 49 testes de conteúdo anteriormente aprovados **reaproveitados**, não reexecutados: ausência de delta em src/scripts/tests/package.json/package-lock.json entre o commit testado `d65584a` e HEAD documental `9c6b4cf`, mais hashes dos arquivos centrais. Evidências em `test-content-reuso.json` e recibo copiado. Dry-run e validação dos novos mapas são deste lote. Nenhuma alteração de código, dependência, schema ou segurança: lint/build/audit/workflows globais não repetidos.
- Sem alteração de PRO Legis, dados pessoais, .env ou credenciais. Publicação confirmada por leitura/reconciliação do conteúdo de produção; nenhum novo deploy Netlify ou smoke de aluno alegado.

Reprodução proporcional: CLI `import-batch <pasta v2/import> --dry-run --preserve-flashcards`; apresentação pelo harness `validar-visual.cjs` com `render.json`, copiando os artefatos para nova pasta se houver motivo para repetir, sem sobrescrever recibos. **Não executar aplicar.sql novamente.**

### Pendências e parada

Cobertura comprovada: 01–10, dez de vinte seções. Restam **11–20**; próximo recorte sugerido 11–15, não iniciado. Tópico/disciplina permanecem parciais. Trabalho encerrado neste lote.

Prompt: “Revise somente Macroeconomia 11–15, conforme relatório 47. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

## Registro anterior — lote 01–05

Registro histórico preservado abaixo. Suas contagens/pendências descrevem o encerramento de 01–05; o estado vigente e o próximo lote são os informados acima.

Atualização: 24/11/2026 (data local). **Parcial: 5/20 seções revisadas, publicadas e reconciliadas; um tópico parcialmente revisado, zero tópicos encerrados.**

## Escopo e diagnóstico

Lote exclusivo `macroeconomia-sec-01` a `05`: Contas Nacionais — Agregados Macroeconômicos; Poupança (S); Produto (P); Cálculo do Produto; Produto Real X Produto Nominal. Lidos integralmente texto, seis callouts e cinco mapas originais. Não havia cartões ou mnemônicos nessas cinco seções; ausência preservada. A versão final contém três tabelas, com um novo exemplo de preços e quantidades na seção 05.

O tópico possui 20 seções. Recorte coerente de contas nacionais, poupança e mensuração do PIB, respeitando o limite de cinco seções. Seções 06–20 não receberam revisão editorial, proposta nem escrita neste lote. Comparação técnica integral do tópico não equivale a leitura editorial das quinze restantes.

Instruções canônicas, status/diff e commits conferidos: editorial em `5ab7c2a` na entrada, sem remote; worktree documental do site em `d65584a`, limpa e alinhada ao origin/main. Preservadas alterações preexistentes, inclusive `workflow_onda.py`, propostas amplas não rastreadas e checkout principal do site. Nenhum arquivo de Informática alterado.

O relatório individual Markdown 47 ainda não existia. A fotografia de 18/11 e a proposta ampla não rastreada de 20 seções foram diferenciadas do estado publicado. Releitura atual confirmou um tópico/20 seções e redação original; a comparação com a fotografia não encontrou diferenças. A proposta ampla não foi aplicada nem certificada. Este relatório e seu checkpoint inauguram o aceite limitado 01–05.

## Achados e correções

| Seção | Diagnóstico e tratamento fundamentado |
| --- | --- |
| 01 | Corrigido salário público classificado como investimento e G restrito à administração direta/autarquias. Definida a convenção G = consumo final e I = capital público e privado; diferenciados benefícios em dinheiro e empréstimos. Qualificadas igualdade produto/renda, categorias fatoriais/royalties e identidade realizada versus demanda planejada. Corrigidas exclusão absoluta de ativos usados, restrição do capital ao físico e fórmula de estoques sem ajustes de valoração. Incluídos objetos de valor quando contemplados e ressalva de ativos usados importados. Dois callouts e mapa alinhados. |
| 02 | Corrigida poupança privada limitada a famílias e confusão de poupança, orçamento e financiamento. Separadas fórmulas do modelo simplificado e contas institucionais. Juros não tratados como transferências por definição. Corrigido sinal de transferências externas recebidas/enviadas com CC = X − M + RPL + TCL e S_ext = −CC. Déficit corrente distinguido de dívida/estoque de passivo; efeitos de X/M condicionados aos demais componentes constantes. Exemplo de poupança 100/investimento 150. Callout e mapa coerentes. |
| 03 | Substituído critério de nacionalidade por residência econômica e renda primária; explicitados RNB/PIB/RPL/RLEE e bruto/líquido/CCF. Separados custo de fatores, preços básicos e preços de mercado. Retiradas siglas não definidas da explicação original, sem mudar títulos/IDs. Duas tabelas e callout conferidos; mapa compacto e legível. |
| 04 | Corrigida fórmula de valor adicionado com bases de valoração incompatíveis. PIB pela produção usa VAB básico e tributos líquidos sobre produtos; pela renda usa remuneração, excedente operacional bruto, rendimento misto e tributos líquidos sobre produção/importação. Qualificadas equivalência das óticas e discrepâncias estatísticas. Carga tributária inclui perímetro/metodologia e fator 100; CTL apresentada como convenção didática, sem fingir definição oficial única. Exemplo fictício conferido. Callout e mapa alinhados. |
| 05 | Diferenciados preços correntes, base fixa ilustrativa e séries encadeadas, sem aditividade presumida. Criado exemplo fictício: PIB base 200, nominal atual 276, real 240; crescimentos 38%/20% e deflator 115. Deflator distinguido de índice de preços ao consumidor. Fórmulas, tabela, callout e mapa conferidos. |

Omissões relevantes tratadas dentro do lote: rendas/transferências externas e seus sinais; residência; valoração coerente; exceções de investimento; deflator e exemplo calculado. Redundâncias úteis à compreensão foram mantidas; nenhuma seção foi excluída ou fundida. Nenhum dado econômico real ou recomendação financeira foi acrescentado.

## Fontes primárias — conferidas em 24/11/2026

Consultados os trechos pertinentes, sem alegação de leitura integral de manuais. Fontes metodológicas antigas são identificadas como tais; disponibilidade atual não transforma sua data de edição.

- [Eurostat — PIB](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:Gross_domestic_product_(GDP)): valor adicionado, impostos/subsídios sobre produtos e três óticas (01/04).
- [Eurostat — preços básicos](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:Basic_price) e [Renda Nacional Bruta](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:Gross_national_income_(GNI)): valoração e rendas primárias de residentes (03/04). Glossário oficial acessível, fundamentado em ESA 2010/SNA 2008; não apresentado como prova de adoção brasileira de novo padrão.
- [Eurostat — formação de capital fixo](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:Gross_fixed_capital_formation_(GFCF)): aquisições menos alienações e ativos tangíveis/intangíveis usados repetidamente (01).
- [BCB — Nota metodológica 2 do BPM6](https://www.bcb.gov.br/content/estatisticas/notas_metodologicas/balanco_pagamentos/bpm6/nm2bpm6p.pdf), abril/2015: bens, serviços, renda primária e secundária; base para explicitar os sinais convencionados e separar fluxos correntes/de capital (02/03). A expressão S_ext = −CC é derivação contábil com as convenções declaradas, não citação literal do BCB.
- [BEA — Measuring the Economy](https://www.bea.gov/resources/methodologies/measuring-the-economy) e [PDF metodológico](https://www.bea.gov/sites/default/files/methodologies/nipa_primer.pdf): contas de produção, governo, poupança e mensuração (01–05). PDF de 2015, página de acesso atualizada em 2026. A convenção norte-americana de G incluindo investimento público não foi transposta: neste material I inclui o investimento público.
- [BEA — ótica da despesa, 2025](https://www.bea.gov/news/blog/2025-06-03/expenditures-approach-measuring-gdp): dedução das importações evita atribuir produção estrangeira ao PIB doméstico (01).
- [BEA — contas internacionais integradas](https://apps.bea.gov/scb/issues/2021/07-july/0721-iea-primer.htm), 2021: residência econômica e distinção de fluxos/posições (02/03).
- [BEA — índices encadeados](https://www.bea.gov/resources/methodologies/chained-dollar-indexes): limitações de agregação e de pesos fixos (05). Artigo histórico, não usado como dado conjuntural.
- [Tesouro Nacional — carga tributária 2025](https://www.tesourotransparente.gov.br/publicacoes/carga-tributaria-do-governo-geral/2025/114), publicado em 10/04/2026: receita tributária do governo geral/PIB e perímetro institucional (04). Percentual real da publicação não incluído no exemplo.
- [IBGE — administração pública](https://ftp.ibge.gov.br/Contas_Nacionais/Sistema_de_Contas_Nacionais/Notas_Metodologicas/11_APU.pdf): produção não mercantil avaliada por custos, incluindo remuneração (01/03). Nota histórica de referência 2000, usada apenas para esse fundamento. Portal SCN e PDFs da biblioteca de referência 2010 retornaram 403; não foi presumida sua leitura nem sua atualização. Portal SNA 2025 da ONU exigiu JavaScript; não foi usado como base substantiva.

## Proposta, validação, aplicação e reconciliação

Evidência final em `orquestracao-03-54/saneamento-onda-7/47-macroeconomia/contas-01-05-20261124-v3/`; executor restrito `../contas-01-05-lote.mjs`.

1. Pré-imagem atual integral do tópico, identidades e revisões preservada. Mudam somente `content_markdown`, `callouts` e `mermaid_mindmap` nas cinco seções. Títulos, IDs, stable keys, content_unit_ids, ordem, cartões e mnemônicos mantidos.
2. Proposta inicial recebeu correções de notação e remoção de notas editoriais destinadas ao revisor. A v2 revelou fórmulas consecutivas unidas na apresentação de 02; a v3 separou os blocos. **Somente v3 publicada.** v1/v2 são preparações, não publicações anteriores a reaplicar.
3. Dry-run final do CLI existente aprovado. O contrato de preservação exige as 20 seções no arquivo do tópico, incluindo quinze intactas; isso não ampliou a revisão nem a escrita, que contém cinco updates e zero inserts/deletes.
4. Ensaio final SQL com BEGIN/ROLLBACK aprovado. Controle negativo v2 rejeitou UUID de revisão divergente; a guarda, os cinco IDs e revisões esperadas são idênticos na v3. Três controles Mermaid maliciosos rejeitados; cinco mapas aceitos pelo validador compartilhado.
5. Releitura imediatamente anterior confirmou todo o conteúdo e as vinte revisões sem alteração. Escrita atômica com `current_revision_id`, `content_unit_id`, tópico ativo, bloqueio compartilhado e comparação de metadados; timeout de bloqueio de 5 s. Mecanismo existente, sem migration ou alteração de segurança.
6. Recibo de aplicação seguido de releitura/reconciliação integral: um tópico/20 seções, sem ausentes, extras ou divergências; cinco revisões novas e as demais quinze revisões intactas. `target: preimagem` é rótulo do comparador genérico, alimentado com o esperado corrigido. Publicação de conteúdo comprovada no banco de produção; não requer deploy de aplicação.

SHA-256 do conjunto de cinco seções publicado: `9ea9e4415ab8f6f9b84b7eaca635e1780a25a7e6caa782d692317242ec67d6e8`.

## Verificação e limites

- 49/49 testes de conteúdo aprovados. Nenhum código da aplicação modificado; lint/build e workflows globais não repetidos.
- 30 combinações finais: cinco seções × Light/Dark/Sepia × 375/1200 px. 24 da v2 reaproveitadas após igualdade estrita das quatro seções sem nova mudança; seis de 02 refeitas na v3. Nove checagens de tabelas no celular, 30 interações de zoom/overlay, sem erro KaTeX ou overflow do artigo. Tabelas largas usam rolagem interna, efetivamente testada.
- Capturas inspecionadas, incluindo fórmulas de 04, tabelas de 03/05, mapas e separação corrigida de 02. Componentes reais e CSS compilado da worktree `questoes-experiencia-20261122`; harness local, não navegação autenticada de produção. Conferência de aluno dispensada pelo usuário.
- Exemplos numéricos conferidos por cálculo independente; resultados em `verificacao-numerica.json`. Nenhum arredondamento material divergente.
- Nenhuma alteração de schema, autenticação, credencial, .env, dependência, corpus PRO Legis ou dado pessoal. A página de estudo lê o Supabase após controle de acesso; reconciliação confirma o conteúdo servido como fonte. Não se alega smoke com aluno ou novo deploy Netlify.

Reprodução proporcional: `content-admin.mjs import-batch <v3/import> --dry-run --preserve-flashcards`; `node <v3/validar-visual.cjs> <v3/render.json>` para apresentação integral se houver nova dúvida. Não executar `aplicar.sql` novamente: revisões já mudaram. Executor usa recibos imutáveis; uma nova releitura precisa de caminho próprio. Checkpoint registra a origem e o alcance das evidências, inclusive reaproveitadas.

## Pendências e parada

Restam quinze seções (06–20), sem aceite editorial deste lote. Próximo recorte sugerido: 06–10, apenas após nova solicitação e releitura dos registros/banco. Não marcar a disciplina inteira como concluída. Trabalho encerrado neste lote.

Prompt: “Revise somente Macroeconomia 06–10, conforme relatório 47. Preserve 01–05 publicados, publique com proteção de concorrência, reconcilie e pare.”
