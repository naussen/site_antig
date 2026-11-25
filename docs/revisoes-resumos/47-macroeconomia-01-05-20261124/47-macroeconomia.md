# 47 — Macroeconomia

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
