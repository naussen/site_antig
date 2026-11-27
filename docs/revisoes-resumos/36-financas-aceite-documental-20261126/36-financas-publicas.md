# 36 — Finanças Públicas

## Aceite documental vigente — 26/11/2026 — fotografia integral conciliada

**Finanças Públicas [x] aceita para esta versão do catálogo:** **7/7 seções**, em **um tópico ativo/físico** (`financas-publicas`), com **11 callouts, quatro mapas Mermaid, quatro gráficos estruturados (`quant-chart`) e cinco tabelas Markdown**. Zero cartões/mnemônicos e zero tópicos vazios ou arquivados. O aceite apoia-se no censo integral dos dois lotes publicados (`01–04` e `05–07`) e na conferência atual do banco, não em amostra.

**Esta etapa foi exclusivamente documental e de leitura (`SELECT`): zero alterações, importações ou reaplicações de conteúdo, cadastro, vínculos ou banco.** Os sete conteúdos normalizados (`content_fingerprint = 6e6a5759344431d20da720bcf5a98bb46a57d8449d4e6a4c33a256333b552022`) e os sete IDs de revisão (`revision_fingerprint = e6803df9907e56ebe0a4141c793b2a150d42d0ef0b0cb0cc00e11f2905cac399`) coincidem exatamente com os lotes reconciliados. **Ética no Serviço Público permanece intacta**, com 20 conteúdos e 20 IDs de revisão idênticos à sua matriz de aceite.

### Matriz de cobertura e execução anterior

| Lote concluído | Seções examinadas | Execução comprovada | Callouts (alt./tot.) | Mapas (alt./tot.) | Gráficos (alt./tot.) | Tabelas | Visuais válidos |
|---|---:|---|---|---|---|---:|---:|
| `secoes-01-04-20261126-v2` | 4 | `01`, `02` e `04` corrigidas/publicadas; `03` conferida sem edição | 4 / 6 | 3 / 3 | 0 / 0 | 1 | 24 |
| `secoes-05-07-20261126-v2` | 3 | `05`, `06` e `07` corrigidas/publicadas/reconciliadas | 4 / 5 | 0 / 1 | 2 / 4 | 4 | 18 |
| **Total** | **7** | **6 corrigidas/publicadas + 1 conferida sem edição** | **8 / 11** | **3 / 4** | **2 / 4** | **5** | **42** |

As **42 combinações visuais** (`Light`/`Dark`/`Sepia` × `375px`/`1200px`, incluindo 24 interações de zoom/overlay e 30 checagens de tabela) foram comprovadas pelos recibos dos dois lotes, sem repetição desnecessária de renders. A matriz individual está registrada em `orquestracao-03-54/saneamento-onda-7/36-financas-publicas/aceite-documental-20261126/matriz-aceite.json`: identidade, chave, unidade, revisão atual, SHA-256 do conteúdo normalizado, lote responsável, disposição editorial e componentes de cada uma das 7 seções, sem faltas, extras ou sobreposições, acompanhada dos hashes dos recibos de ambos os lotes.

### Resolução documental sobre `quant_charts_changed`

Na revisão documental desta consolidação, a comparação estrutural entre a pré-imagem (`preimagem.json`) e a proposta publicada (`secoes-revisadas.json`) do lote `05–07` confirmou que **dois gráficos estruturados foram alterados na seção 05** (e dois permaneceram inalterados na seção 06), totalizando `quant_charts_changed = 2` em 4 examinados:

1. *Quantidade de equilíbrio antes e depois da tributação* (`financas-publicas-sec-05`, índice 0): alterados `data` (`1860 → 1860.47` e `1875 → 1873.68`) e `description`.
2. *Elasticidade e perda de peso morto* (`financas-publicas-sec-05`, índice 1): mantidos os valores conceituais (`1` e `2`), mas alterada a `description` (acréscimo da condição *"em mercado sem falhas"*).

Os registros derivados (`preparacao.json`, `checkpoint.json`, `cobertura-7-secoes.json`, scripts de preparação/fechamento e espelhos em `docs/revisoes-resumos/36-financas-05-07-20261126/`) foram retificados de `1` para `2`, documentados em `matriz-aceite.json` (`quant_charts_audit`), preservando integralmente todos os recibos primários de aplicação, dry-run, CAS, pré-imagem, delta, manifesto e reconciliação.

### Cadastro, vínculos e conferência atual

- Único tópico físico e ativo da disciplina: `financas-publicas` (*Finanças Públicas*, `sort_order = 1`, `7` seções ativas; zero tópicos vazios, zero arquivados e zero redirecionamentos em `topic_id_redirects`).
- Vínculos conferidos em `SELECT` e idênticos aos recibos anteriores: `1` associação em `question_topic_relations` e `1` associação primária em `topic_discipline_relations`.
- Evidências desta consolidação em `orquestracao-03-54/saneamento-onda-7/36-financas-publicas/aceite-documental-20261126/`: `conferir.mjs` (somente leitura), `conferencia-atual.json`, `matriz-aceite.json` e `checkpoint.json`.

### Limites do aceite, fila e parada

Aceite `[x]` restrito à fotografia e às versões documentadas no relatório 36; **não certifica cobertura integral de qualquer edital nem atualização automática diante de mudanças normativas futuras**. Mantêm-se as fontes primárias e as limitações registradas em **26/11/2026** nos lotes `01–04` e `05–07` (exemplos numéricos de alíquotas/faixas expressamente rotulados como hipotéticos; conceitos metodológicos históricos do BCB contextualizados; dispensa de conferência com conta de aluno).

Propostas/SQLs antigos não rastreados e alterações preexistentes (`workflow_onda.py` e checkout principal do site) permanecem preservados e intocados. Fila e plano atualizados com recálculo exato das 54 disciplinas: **23 `[x]`, 24 `[~]` e 7 `[ ]`**.

**Aceite registrado; execução encerrada. Nenhuma outra disciplina diagnosticada ou iniciada.**

Próximo prompt: “Diagnostique somente o próximo lote pendente da fila da Onda 7 em PRO Resumos, até cinco seções. Preserve Finanças Públicas e Ética aceitas, registre o recorte e pare.”

---

## Histórico anterior ao aceite consolidado

## Publicação vigente — 26/11/2026 — seções 05–07 (conclusão editorial 7/7)

**Três seções revisadas, corrigidas, publicadas e reconciliadas (`financas-publicas-sec-05` a `07`).** Avanço editorial passa de **4/7** para **7/7 seções ativas revisadas** no único tópico ativo da disciplina (`financas-publicas`), zero tópicos vazios. **As seções 01–04 publicadas e suas quatro revisões permanecem intactas.** **Ética no Serviço Público permanece integralmente preservada**, com 20 conteúdos normalizados e 20 IDs de revisão idênticos à matriz de aceite em todas as etapas. A disciplina permanece **[~] parcial** na fila (`22 [x] / 25 [~] / 7 [ ]`), distinguindo a conclusão editorial dos dois lotes de eventual consolidação documental de aceite global em etapa própria.

### Exame e correções aplicadas

Examinados integralmente **três textos, cinco callouts, um mapa Mermaid, quatro gráficos estruturados (`quant-chart`) e quatro tabelas** (todas na seção 05), além de todas as suas fórmulas e exemplos numéricos; zero cartões/mnemônicos existentes ou criados. IDs, títulos, ordem, `content_unit_id`, `stable_key` e vínculos preservados.

- **05 (`Função Distributiva e Tributação`):**
  - *Incidência tributária e sincronização numérica:* recalculados os equilíbrios para $S(p_p) = -400 + 400p_p$ e $D(p_c) = 5000 - 500p_c$ sem arredondamento intermediário (aritmética racional exata). Mantidos o equilíbrio inicial ($P_e = 6{,}00$; $Q_e = 2.000$) e o tributo específico de $0{,}90$ ($p_c = 6{,}40$; $p_p = 5{,}50$; $Q = 1.800$; $R = 1.620{,}00$; ônus $0{,}40$ e $0{,}50$). Sincronizados equações, texto, tabela comparativa e `quant-chart` para os casos *ad valorem* de $10\%$: **por dentro** ($p_c = 270/43 \approx 6{,}2791$; $p_p = 243/43 \approx 5{,}6512$; $Q = 80.000/43 \approx 1.860{,}465116$; receita $= 2.160.000/1.849 \approx 1.168{,}199027$; ônus $12/43$ e $15/43$) e **por fora** ($p_c = 594/95 \approx 6{,}2526$; $p_p = 108/19 \approx 5{,}6842$; $Q = 35.600/19 \approx 1.873{,}684211$; receita $= 384.480/361 \approx 1.065{,}041551$; ônus $24/95$ e $6/19$). Mantidos os exemplos progressivos válidos de R\$ 675 ($19{,}29\%$) e R\$ 750 ($18{,}75\%$) e o exemplo regressivo de R\$ 170 ($3{,}40\%$ vs. $0{,}85\%$), todos identificados expressamente como hipotéticos.
  - *Conceitos, hipóteses e estrutura:* corrigida a tabela de sistemas tributários — para imposto fixo $T(y) = K$, a alíquota marginal é **zero** ($dT/dy = 0$) e a média $K/y$ decresce; incluída a linha proporcional ($T(y) = t \cdot y$, média = marginal $= t$) e esclarecido que progressividade exige alíquota média crescente (marginal acima da média, podendo subir por degraus). Qualificada a relação entre proporcionalidade, pagamento absoluto maior e critérios normativos de equidade vertical. Explicitada no texto e no callout 1 a comparação *excise* vs. *lump-sum* sob igual arrecadação e efeito renda (neutralidade restrita aos preços relativos), bem como a possibilidade de *excises* específicos ou *ad valorem*. Diferenciada incidência legal de incidência econômica (sem repasse automático integral); ressalvados tributos corretivos em externalidades; explicitadas no texto e no callout 2 as hipóteses da regra da elasticidade inversa de Ramsey (ausência de *lump-sum*, custos marginais constantes e demandas independentes / elasticidades cruzadas nulas). Diferenciado máximo de arrecadação na Curva de Laffer de ótimo de bem-estar social e afastada a inferência automática entre efeitos renda e substituição apenas pelo nível de renda. Removido o título duplicado de Laffer, contextualizadas as áreas $A$–$D$ em relação ao diagrama clássico de excedentes, acrescentada síntese curta da função distributiva (tributos, transferências e gastos sociais) e compatibilizada a emissão monetária com o art. 164, § 1º, da CF/1988.
- **06 (`Função Estabilizadora Ou Anticíclica`):**
  - Preservados integralmente o callout, o mapa Mermaid e os dois gráficos `quant-chart` conceituais (que declaram ausência de escala empírica e ilustram suavização, não eliminação dos ciclos). Acrescentado apenas um parágrafo conciso diferenciando **estabilizadores automáticos** (tributação progressiva da renda e seguro-desemprego) de **medidas fiscais discricionárias** expansionistas e contracionistas, sem reproduzir os modelos de Macroeconomia já publicados.
- **07 (`Déficit e Dívida Pública`):**
  - *Sinais, indicadores e conciliação estoque-fluxo:* explicitadas e harmonizadas as duas convenções de sinal — **saldo fiscal** (Receitas menos Despesas, superávit positivo, padrão RTN/STN) versus **Necessidade de Financiamento / NFSP** (Despesas menos Receitas, déficit positivo, convenção tradicional do BCB) —, preservando o exemplo prático $360 - 400 = -40$ (saldo) / $+40$ (NFSP). Especificados juros nominais líquidos apropriados por competência, fluxos primários por caixa e abrangências institucionais (Governo Central acima da linha pela STN; Setor Público Não Financeiro consolidado abaixo da linha pelo BCB, exceto Petrobras e Eletrobras). Corrigida a equação que podia sugerir dupla dedução de ajustes ($\text{RN} = \text{NFSP} - \text{AP}$), estabelecendo $NFSP_n = \Delta \text{DLSP} - AJ$ (com exemplo numérico reconciliado: $\Delta \text{DLSP} = +100$, ajustes líquidos $+30 \implies NFSP_n = 70$ e, com juros líquidos de $50$, $NFSP_p = 20$).
  - *Dívidas, séries históricas e identidades:* diferenciadas **DLSP** e **DBGG**; explicados os ajustes metodológicos/cambiais, reconhecimentos de passivos (*esqueletos*) e **privatizações** como alienações de ativos abatidas do fluxo (e não ativo permanente). Contextualizadas expressamente como **históricas** as séries do **resultado operacional** e da **NFSP com desvalorização cambial**, encerradas pelo BCB após dezembro de 2009, afastando a equiparação indevida entre atualização monetária da dívida e imposto inflacionário. Distinguida arrecadação monetária absoluta de **Carga Tributária Bruta em `% do PIB`**, qualificadas as identidades macroeconômicas simplificadas (mesma unidade, sem dupla contagem de transferências e distinguindo investimento público de despesas orçamentárias de capital da Lei nº 4.320/1964) e qualificados os efeitos da colocação de títulos sobre poupança e inflação, preservando a vedação do art. 164, § 1º, da CF/1988. Alinhados os dois callouts.

### Fontes primárias e limites

Fontes primárias conferidas em **26/11/2026**, registradas com trechos e aplicações em `fontes.json`:

- [BCB — Manual de Estatísticas Fiscais, maio/2019](https://www.bcb.gov.br/content/estatisticas/Documents/notas_metodologicas/estatisticas-fiscais/estatisticasfiscais.pdf), caps. 2, 3, 5, 6 e 7 (metodologia oficial de DLSP, DBGG, NFSP, sinais, regime caixa/competência, ajustes patrimoniais/metodológicos e encerramento em 2009 das séries operacional e com desvalorização cambial; usado estritamente como referência metodológica, não conjuntural).
- [Tesouro Nacional — Resultado do Tesouro Nacional (RTN)](https://www.gov.br/tesouronacional/pt-br/estatisticas-fiscais-e-planejamento/resultado-do-tesouro-nacional-rtn) e [Tesouro Transparente — Carga Tributária do Governo Geral 2025](https://www.tesourotransparente.gov.br/publicacoes/carga-tributaria-do-governo-geral/2025/114) (apuração acima da linha do Governo Central e definição da CTB em `% do PIB`, sem importar percentuais conjunturais ao resumo).
- [Câmara dos Deputados — Constituição Federal de 1988 atualizada](https://www2.camara.leg.br/legin/fed/consti/1988/constituicao-1988-5-outubro-1988-322142-normaatualizada-pl.html), arts. 153, § 6º, VI, e 164, §§ 1º e 2º; [Lei nº 4.320/1964 atualizada](https://www2.camara.leg.br/legin/fed/lei/1960-1969/lei-4320-17-marco-1964-376590-normaatualizada-pl.html), arts. 11 e 12.
- [U.S. Department of the Treasury — Bradford & Rosen, OTA Paper 8, 1975/1976](https://home.treasury.gov/system/files/131/WP-8.pdf), seções II–IV (hipóteses da regra inversa de Ramsey e relação entre eficiência e equidade; texto teórico seminal, não alíquota vigente).
- [OpenStax — Principles of Economics 3e, 5.3 Elasticity and Pricing](https://openstax.org/books/principles-economics-3e/pages/5-3-elasticity-and-pricing), [15.5 Government Policies to Reduce Income Inequality](https://openstax.org/books/principles-economics-3e/pages/15-5-government-policies-to-reduce-income-inequality), [30.2 Taxation](https://openstax.org/books/principles-economics-3e/pages/30-2-taxation), [30.5 Automatic Stabilizers](https://openstax.org/books/principles-economics-3e/pages/30-5-automatic-stabilizers) e [2e Appendix B, Indifference Curves](https://openstax.org/books/principles-economics-2e/pages/b-indifference-curves).

Limitações registradas: `planalto.gov.br` redefiniu a conexão TCP e páginas da OCDE/FMI retornaram HTTP 403 na consulta automatizada; não se alega leitura dessas URLs bloqueadas, tendo sido utilizadas fontes oficiais e acadêmicas primárias integralmente abertas (Câmara dos Deputados, BCB, STN, U.S. Treasury e OpenStax). Tabelas escalonadas e alíquotas exemplificativas foram rotuladas como hipotéticas.

### Preparação, validação, publicação e reconciliação

Versão publicada: `orquestracao-03-54/saneamento-onda-7/36-financas-publicas/secoes-05-07-20261126-v2/`. A pasta `secoes-05-07-20261126/` preserva a preparação v1 **não publicada** (na qual o teste visual detectou 9 erros KaTeX por `R\$` dentro de `\text{}` na 05 e overflow de `44px` em `375px` na 07, corrigidos na v2 antes de qualquer escrita). Propostas/SQLs antigos não rastreados da raiz não foram executados.

1. **Pré-imagem e preflight:** pré-imagem completa do tópico, das 7 seções e dos vínculos (`question_topic_relations` e `topic_discipline_relations`) preservada e confrontada com o recibo reconciliado de `secoes-01-04-20261126-v2` e com `diagnostico-05-07-20261126`. Dry-run do CLI (`import-batch --dry-run --preserve-flashcards`) aprovado com 7 seções sem escritas; manifesto de escrita restrito a `05`, `06` e `07`.
2. **Proteção de concorrência e aplicação:** controle negativo CAS com `current_revision_id` inválido rejeitado com **zero linhas afetadas** e estado integral preservado. Aplicação executada via `createStore.cas` + `apply` (`executar-onda5.mjs`): três CAS sequenciais por identidade e revisão esperada, com preflight final, diário sincronizado (`aplicacao.jsonl`) e recibo `completed` (`baad7270-0704-41e7-a4dc-309cc3ebadbd`, `233c64ca-02d3-47ba-8267-47e360364776` e `d55d317f-f0a1-4147-b4b3-8cb24124ebf9`). **Não constitui transação única entre as três seções.**
3. **Reconciliação independente:** 1 tópico e 7 seções reconciliados sem ausentes, extras ou divergências (`full_topic_sha256 = 6e6a5759344431d20da720bcf5a98bb46a57d8449d4e6a4c33a256333b552022`). Comprovada a preservação dos **4 IDs de revisão das seções 01–04**, dos vínculos do tópico e dos **20 conteúdos e IDs de revisão aceitos de Ética no Serviço Público** (`cobertura-7-secoes.json` e `reconciliacao.json`).
4. **Validação numérica, estrutural e visual:** aritmética racional verificada em `verificar-numeros.py`; **4 gráficos estruturados aprovados** e 4 payloads inválidos rejeitados pelo `QuantitativeChartSchema` compartilhado (`validar-grafico.cjs`); mapa Mermaid aprovado e 3 payloads maliciosos rejeitados por `getMermaidSecurityIssue`. **18 combinações visuais finais aprovadas** na v2 (`3 seções × Light/Dark/Sepia × 375/1200px`), com `0` erros KaTeX, `0` erros de gráfico, `overflow = 0` em todas as 18 telas, **6 verificações de zoom/overlay** do mapa da 06 e **24 verificações de tabela** da 05 (rolagem interna confirmada em `375px` e encaixe direto em `1200px`). Capturas inspecionadas diretamente (`05` Light/1200 e Dark/375, `06` Light/1200 e Sepia/375, `07` Dark/375). Componentes de estudo com paridade SHA-256 comprovada (`render-proveniencia.json`); reutilizados os 44 testes de conteúdo sem mudança de código. Sem alterações de aplicação, schema, RLS, `.env` ou dependências; lint/build/workflows globais não repetidos; conferência de aluno dispensada.

### Situação final e próximo passo

**7/7 seções ativas de Finanças Públicas revisadas, publicadas e reconciliadas** nos dois lotes (`01–04` e `05–07`, censo em `cobertura-7-secoes.json`, somando 42 combinações visuais válidas), sem tópicos vazios ativos. Mantido o status **[~] parcial** (`22 [x] / 25 [~] / 7 [ ]`) para não confundir a conclusão editorial deste lote com o aceite documental global da disciplina. Nenhum outro lote iniciado.

Próximo prompt: “Consolide somente o aceite documental de Finanças Públicas (fotografia 7/7 dos lotes 01–04 e 05–07), conforme relatório 36, sem alterar ou reaplicar conteúdo. Confira conteúdos, revisões e vínculos em SELECT, atualize fila/plano e pare.”

---

## Histórico anterior a esta publicação

## Diagnóstico vigente — 26/11/2026 — seções 05–07

**Somente diagnóstico e registro do recorte; zero correções, escritas ou publicações de conteúdo.** Avanço permanece **4/7**:01–04 concluídas, preservadas e sem reaplicação. Ética aceita permanece intacta. Recorte coerente: distribuição/tributação, estabilização e resultado/endividamento públicos; três seções, dentro do limite.

| Seção | Título | Callouts | Mapas | Gráficos estruturados |
|---|---|---:|---:|---:|
|05|Função Distributiva e Tributação|2|0|2|
|06|Função Estabilizadora Ou Anticíclica|1|1|2|
|07|Déficit e Dívida Pública|2|0|0|

Examinados integralmente três textos, cinco callouts, um mapa Mermaid, quatro gráficos quant-chart, quatro tabelas da05 e suas fórmulas/exemplos. Zero cartões/mnemônicos. O exame visual foi semântico/estrutural; nenhum novo render ou teste de temas nesta etapa sem edição.

### Estado comprovado e distinção de etapas

SELECT atual comparado à pré-imagem, proposta final e recibo da publicação01–04 (`secoes-01-04-20261126-v2`): **sete conteúdos e sete revisões iguais ao estado reconciliado**. As01/02/04 têm as revisões publicadas;03 permanece conferida sem edição. Ética:20 conteúdos normalizados e IDs de revisão iguais à matriz de aceite. Relatório35 não alterado.

As propostas antigas não rastreadas de05/07 diferem do banco: são preparação, sem aplicação comprovada, não conteúdo publicado. Não executar SQLs, importação ou pacote histórico de sete seções. Fotografia antiga de um byte não é fonte válida. Nenhum cadastro, vínculo, nota, progresso, segurança ou aplicação alterado; scripts deste diagnóstico usam somente SELECT.

### Achados que delimitam a revisão futura

- **05 — prioridade alta:** cálculo ad valorem inconsistente entre equações, texto, tabela e gráfico. Recalculando sem arredondamento intermediário: por dentro, preço≈6,2790698, quantidade≈1860,465116 e receita≈1168,199027; por fora, preço≈6,2526316, quantidade≈1873,684211 e receita≈1065,041551. Os valores1875/1065/1065,38 não formam solução coerente. Atualização futura deve sincronizar todos os componentes. Específico(1800/1620) e exemplos de imposto675/750 estão corretos.
- **05 — conceitos:** marginal de lump-sum é zero, não decrescente; médiaK/y decresce. Progressividade se define pela média crescente, sem exigir marginal crescente em toda faixa. Proporcionalidade não exclui automaticamente equidade vertical. Comparação excise/lump-sum precisa de arrecadação equivalente e hipóteses; neutralidade não significa ausência de efeito renda. Excises podem ser específicos ou ad valorem; incidência depende das elasticidades. Qualificar regra inversa deRamsey, perda de peso morto e suposto trade-off obrigatório de equidade. Fontes e limites teóricos: [OpenStax, incidência](https://openstax.org/books/principles-economics-2e/pages/5-3-elasticity-and-pricing), [escolhas](https://openstax.org/books/principles-economics-2e/pages/b-indifference-curves), [U.S.Treasury,OTA8](https://home.treasury.gov/system/files/131/WP-8.pdf) e [OECD,excises](https://www.oecd.org/en/publications/consumption-tax-trends-2020_152def2d-en/full-report/component-7.html).
- **05 — complementos e redundância:** não deduzir dominância renda/substituição apenas de ser pobre/rico; máximo de arrecadação não demonstra máximo de bem-estar (inferência conceitual, não estimativa de alíquota ótima). Falta síntese de gastos/transferências distributivos; títuloLaffer duplicado e áreasA–D sem diagrama correspondente. Declarar exemplos tributários hipotéticos. Compatibilizar emissão/endividamento com ressalva brasileira já presente na07, sem duplicação extensa.
- **06:** núcleo correto em texto/callout/mapa. Os dois gráficos se declaram conceituais e ilustram suavização, sem prometer eliminar ciclos. Preservar. Pode receber apenas síntese curta de instrumentos expansionistas/restritivos e estabilizadores automáticos, sem reproduzir Macroeconomia publicada; possibilidade de aceite sem edição permanece aberta. [World Bank — Fiscal Policy](https://www.worldbank.org/ext/en/topic/fiscal-policy-and-growth/fiscal-policy).
- **07 — prioridade alta:** alterna saldo(receitas−despesas) e necessidade(despesas−receitas) sem aviso. Explicitar sinais, abrangência e juros líquidos; revisarRN=NFSP−AP para evitar descontar ajustes novamente. Dívida não é soma simples dos déficits. Separar ajustes cambiais/patrimoniais, estoque bruto/líquido e histórico: séries operacionais e com desvalorização foram encerradas em2009. Privatização não é estoque genérico de ativo; correção monetária não equivale a imposto inflacionário. [BCB — Manual2019, capítulos3/5/6](https://www.bcb.gov.br/content/estatisticas/Documents/notas_metodologicas/estatisticas-fiscais/estatisticasfiscais.pdf).
- **07 — demais cuidados:** distinguir montante arrecadado de carga usualmente expressa em%PIB; identidades deCTL/poupança exigem unidades e evitar dupla contagem. Títulos financiam, não elevam automaticamente poupança pública; “não aumenta inflação” precisa qualificação. Preservar núcleo fluxo/estoque, cálculo360−400=−40 e vedação de empréstimoBCB/Tesouro. [Tesouro — carga](https://www.tesourotransparente.gov.br/publicacoes/carga-tributaria-do-governo-geral/2025/114), [RTN](https://www.gov.br/tesouronacional/pt-br/estatisticas-fiscais-e-planejamento/resultado-do-tesouro-nacional-rtn) e [STF,art164](https://portal.stf.jus.br/constituicao-supremo/artigo.asp?abrirArtigo=164&abrirBase=CF).

Fontes primárias conferidas em **26/11/2026**; URLs, aplicações e limites em `fontes.json`. ManualBCB2019/OTA1975/OECD2020 usados para metodologia/teoria, sem chamar seus dados de atuais. PáginasIMF retornaram403 na abertura; não alegada leitura integral. WorldBank/RTN/CTB/STF tiveram trechos oficiais indexados consultados; não houve conferência completa de todas as normas ou alíquotas atuais. A revisão deverá resolver essas pendências conforme as alterações efetivas.

### Evidências, validação e parada

Pasta `orquestracao-03-54/saneamento-onda-7/36-financas-publicas/diagnostico-05-07-20261126/`: leituraSELECT, estado atual, achados, fontes, verificação numérica racional e checkpoint. Sintaxe, JSONs, comparação de conteúdo/revisão e diff documental conferidos. Nenhuma importação, dry-run, CAS, publicação de conteúdo, novo render, lint/build ou workflow global; não necessários ao diagnóstico documental. O futuro lote com alteração visual deverá conferir Light/Dark/Sepia, celular/desktop e controles existentes de publicação/reconciliação.

Disciplina permanece[~], **4/7**, fila **22[x]/25[~]/7[ ]**.05–07 diagnosticadas, ainda não revisadas/aceitas. Mudanças preexistentes e propostas antigas preservadas. Nenhum próximo lote iniciado.

Próximo prompt: “Revise somente Finanças Públicas05–07, conforme relatório36. Preserve01–04 publicadas e Ética aceita, publique com proteção de concorrência, reconcilie e pare.”

---

## Publicação parcial vigente — 26/11/2026 — seções 01–04

**Quatro seções revisadas:01/02/04 corrigidas, publicadas e reconciliadas;03 conferida sem edição.** Avanço **4/7**, sem aceite global da disciplina. Seções05–07 e suas revisões preservadas. **Ética aceita permanece intacta**, com20 conteúdos e IDs de revisão conferidos à matriz de aceite em cada etapa.

### Exame e correções

Examinados integralmente quatro textos, seis callouts, três mapas e a tabela da03. Alterados três textos, quatro callouts e os três mapas; zero cartões/mnemônicos criados. IDs, títulos, ordem, unidades e chaves preservados.

- **01:** compras públicas diferenciadas de fonte de financiamento; receitas de vendas/exportações diferenciadas do agregado exportações líquidas. Externalidade técnica distinguida do mero efeito de oferta/preço; exemplo de conhecimento externo, comparações marginais com variáveis definidas e diferença produção/consumo. Intervenção e instrumentos qualificados; dois callouts alinhados. Mapa passa a representar apenas pagamentos/recursos, com legenda no texto, financiamentoMF→G, receitasexportaçãoRM→F e pagamentoimportaçãoF→RM; síntese declaradamente não exaustiva.
- **02:** tragédia dos comuns explicada por acesso/uso sem coordenação, sem reduzi-la a sentimento de propriedade. Propriedade comum pode ter regras e fiscalização. Custos de transação não impedem acordos automaticamente; hipóteses de Coase e distribuição dos ganhos diferenciadas. Texto/callout/mapa alinhados.
- **03:** classificação rivalidade/exclusão, tabela, carona, distinção de meritórios e rodovias pedagiadas/congestionadas conferidas e mantidas integralmente. Não reescrita por reflexo; **sem nova revisão**.
- **04:** seleção adversa explicada por características ocultas/seleção de tipos, instrumentos contextualizados e salário eficiência identificado como incentivo. Poder de mercado sujeito a restrições; monopólio natural definido pela economia de atender a demanda e não apenas por custos fixos. Regulação e análise de concentrações não equivalem a proibição automática. Função estabilizadora diferenciada da alocativa; alto risco isolado não prova falha e patente não garante sucesso. Prazo20anos desde depósito conferido e preservado. Callout e mapa diferenciam tipos ocultos de ações difíceis de observar.

### Fontes e limites

Fontes primárias conferidas em **26/11/2026**, com aplicações e limites em `fontes.json`:

- [IMF — externalidades](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/externalities) e [bens públicos](https://www.imf.org/en/publications/fandd/issues/2021/12/global-public-goods-chin-basics).
- [OpenStax — fluxo circular](https://openstax.org/books/introduction-business-2e/pages/1-3-how-business-and-economics-work), [comércio e pagamentos](https://openstax.org/books/principles-economics-3e/pages/23-3-trade-balances-and-flows-of-financial-capital) e [externalidade de produção](https://openstax.org/books/principles-economics-3e/pages/12-1-the-economics-of-pollution).
- [Ostrom Workshop, Indiana University](https://www.ostrom.indiana.edu/about/ostroms-history/nobel-prize/index.html); [Stiglitz — Nobel Lecture](https://www.nobelprize.org/uploads/2018/06/stiglitz-lecture.pdf), trechos sobre informação, seleção e incentivos.
- [Cade — defesa da concorrência](https://www.gov.br/cade/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-sobre-defesa-da-concorrencia/) e [Seae — promoção à concorrência](https://www.gov.br/fazenda/pt-br/central-de-conteudo/publicacoes/guias-e-cartilhas/arquivos/cartilha-promocao-a-concorrencia.pdf/@@download/file).
- [Lei9279/1996, art40](https://www.planalto.gov.br/ccivil_03/leis/l9279.htm).

Primeiras aberturas diretas dos PDFs Nobel retornaram403. Stiglitz foi depois recuperado via resultado indexado; para Ostrom usada fonte acessível do próprio Workshop. Não alegada nova leitura do PDF2009 bloqueado. Fórmulas referem-se aos casos/hipóteses explicados, não a toda externalidade; mapa monetário é simplificado. Sem reabrir Macroeconomia, Ética ou05–07.

### Preparação, aplicação e reconciliação

Versão vigente: `orquestracao-03-54/saneamento-onda-7/36-financas-publicas/secoes-01-04-20261126-v2/`. A pasta sem `-v2` preserva preparação **não publicada** e evidências reutilizadas. As propostas/SQLs antigos da raiz não foram executados.

1. Pré-imagem atual do tópico/7 seções e dos vínculos preservada, com comparação integral à base anterior e das sete revisões. Dry-run de7 seções aprovado por exigência de correspondência integral do CLI com `--preserve-flashcards`; manifesto de escrita somente01/02/04. Não houve importação geral.
2. Executor existente `createStore.cas` + `apply`: três CAS sequenciais por identidade/revisão, com preflight, pré-imagem e diário sincronizado. **Não é uma transação única do lote.** CAS negativo de revisão incorreta rejeitado com zero linhas; estado integral preservado. Nenhuma precondição afrouxada.
3. Recibo `completed`: três novas revisões. Reconciliação independente das sete seções sem faltas, extras ou divergências. Preservadas quatro revisões:03 e05–07; vínculos de questões/disciplinas intactos. Ética20/20 conferida à matriz de aceite em todos os modos, sem alterações. Nenhum cadastro, schema, RLS, credencial, nota ou progresso alterado.
4. **44 testes de conteúdo passaram** nesta revisão, e o validador compartilhado rejeitou três exemplos Mermaid maliciosos na preparação. Não substituídos os mapas por HTML/SVG bruto nem alterado o renderizador. Skill exatas aplicada à formulação e validação proporcional, preservando o contrato existente.
5. **24 combinações visuais efetivas** Light/Dark/Sepia ×375/1200px aprovadas, sem overflow de artigo ou erros de fórmula;18 verificações de zoom/overlay e seis da tabela (rolagem interna no celular). A v1 passou24 telas; a v2 apenas acrescentou ressalva textual em04. Por igualdade integral de01/02/03, reutilizadas18 telas; refeitas seis da04, sem repetir as demais nem a suíte44 válida. Fontes de cada resultado registradas em `render-visual.json`/`testes-validacao.json`.
6. Conferidas diretamente capturas01Light/desktop com fórmulas/mapa,02Sepia/celular,03Light/celular e04Dark/desktop da versão final. Renderizadores/CSS iguais ao checkout publicado, com hashes. Usados os componentes existentes, sem dependências novas ou alteração de código Next.js.
7. Sintaxe/JSONs/diff verificados. Sem mudança de aplicação: lint/build/auth/audit e workflows globais não repetidos. Conta de aluno dispensada; visual local não é smoke autenticado de produção. Publicação de conteúdo comprovada no banco é distinta do push documental; nenhum deploy de aplicação necessário.

### Pendências e parada

**Restam somente05–07 para revisão em lote futuro**, sem diagnóstico editorial novo nesta entrega. Disciplina passa a[~] parcial,4/7; contagens **22[x]/25[~]/7[ ]**. Relatório35/aceite de Ética preservados; alterações preexistentes e arquivos não rastreados antigos intocados. Corpus PRO Legis e demais frentes fora do escopo. Nenhum próximo lote iniciado.

Próximo prompt: “Diagnostique somente Finanças Públicas05–07, conforme relatório36. Preserve01–04 publicadas e Ética aceita, registre o recorte e pare.”

---

## Histórico anterior a esta publicação

## Diagnóstico vigente — 26/11/2026 — seções 01–04

**Somente diagnóstico; zero correções, escritas ou publicações.** Próximo lote da fila Onda7: **Finanças Públicas01–04**, quatro seções sobre falhas de mercado. A disciplina possui um tópico/7 seções ativas. **05–07 ficam fora deste lote**: distribuição/tributação, estabilização e déficit/dívida. Recorte de quatro em vez de cinco para manter coerência temática.

| Seção | Título | Callouts | Mapas |
|---|---|---:|---:|
| 01 | Externalidades | 2 | 1 |
| 02 | Causas das Externalidades | 1 | 1 |
| 03 | Bens Públicos | 2 | 0 |
| 04 | Informações Assimétricas (Entre as Partes) | 1 | 1 |

Examinados integralmente os quatro textos, seis callouts, três mapas Mermaid e a tabela de rivalidade/exclusão da03. Zero cartões/mnemônicos. Não se revisou o conteúdo de05–07; apenas títulos/identidades/revisões registrados para preservação.

### Estado e etapas do trabalho antigo

- Não havia relatório individual36. A fotografia `36-financas-publicas.snapshot.json` contém apenas um byte e não fornece JSON utilizável; preservada, não usada como fonte do estado atual.
- A definição histórica de lote `W7--36-financas-publicas--b01.json` agrupa sete seções; não autoriza executar as sete agora. O recorte atual prevalece.
- Há arquivos **não rastreados** antigos de pré-imagem, dataset, cinco propostas, importação, SQLs e capturas. Não localizados checkpoint/recibo de aplicação ou publicação nessa pasta. Conteúdos e revisões atuais das sete seções coincidem com a pré-imagem antiga; as cinco propostas locais diferem do banco. Isso distingue preparação/visual local de aplicação/reconciliação/publicação: **não tratar os SQLs ou renders como trabalho publicado**.
- Propostas antigas referentes a01/02/04 pertencem ao recorte;05/07 não pertencem. Não executar o pacote geral nem importar proposta sem nova revisão de fontes/contrato. A03 não integra a lista de propostas antigas, o que não a dispensa de conferência no lote.
- Ética aceita preservada: SELECT comparou os20 conteúdos e IDs de revisão à matriz de aceite, sem divergências. Relatório35 e seu aceite não modificados/reabertos. Nenhuma outra frente retomada.

### Achados e riscos para a revisão

- **01:** o exemplo agricultura→oferta→preço não demonstra externalidade técnica positiva por si; separar efeitos de preços de benefícios externos não internalizados. Corrigir a ideia de que compras públicas financiam despesas. Qualificar a intervenção estatal e comparações entre custos/benefícios sociais/privados, especificando grandezas marginais e produção/consumo. Conferir também os dois callouts. No mapa, definir se as setas são de bens ou dinheiro, especialmente empréstimos G→MF e comércio exterior; o problema não deve ser resolvido apenas invertendo setas sem definir o modelo.
- **02:** retirar a explicação da tragédia dos comuns baseada apenas em sentimento de propriedade; diferenciar livre acesso de propriedade comum com regras. A presença de custos de transação não inviabiliza automaticamente toda negociação: o mapa é absoluto demais. Texto/callout de Coase têm base válida a preservar/qualificar, sem reescrever por reflexo.
- **03:** núcleo e tabela já distinguem bens públicos puros, comuns, privados e de clube; carona, meritórios e rodovias pedagiadas/congestionadas tratados com distinções relevantes. Conferir terminologia de semipúblicos e exemplos sem presumir erro. Pode ser aceita sem edição se a revisão e a validação aplicável confirmarem; não foi marcada revisada neste diagnóstico.
- **04:** seleção adversa exige explicar seleção sob informação oculta; não é mera chance de compra ruim. Qualificar soluções, pois juros e outros instrumentos alteram incentivos/seleção. Salário eficiência é mecanismo de incentivo em modelos pertinentes, não exemplo nu do problema. Poder de mercado não permite escolher preço e quantidade sem restrições. Monopólio natural não se define apenas por custo fixo alto; distinguir estrutura, eficiência e necessidade/desenho da regulação. Conferir enquadramento alocativo/estabilizador e o mapa antes/depois. O prazo20anos da patente de invenção desde depósito corresponde ao art40: preservar o que está correto e não afirmar que patente elimina risco de pesquisa.

Esses achados delimitam a revisão futura; não são uma proposta aplicada nem aceite de conteúdo. Preservar identidades, títulos, ordem, vínculos e alterações preexistentes. Para mapas/conteúdo alterados, a revisão deverá conferir temas Light/Dark/Sepia, celular/desktop e zoom/overlay, usando os controles existentes; não repetir testes globais válidos sem motivo.

### Fontes e limites

Fontes primárias conferidas em **26/11/2026**, com relação aos achados em `fontes.json`:

- [IMF — Externalities](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/externalities): efeitos não incorporados no preço, custos/retornos privados e sociais e condições de negociação.
- [IMF — Global Public Goods](https://www.imf.org/en/publications/fandd/issues/2021/12/global-public-goods-chin-basics): bens públicos e carona.
- [Royal Swedish Academy — prêmio2009](https://www.nobelprize.org/uploads/2018/06/press-7.pdf): governança de propriedade comum por usuários, sem supor fracasso inevitável.
- [Stiglitz — Nobel Lecture](https://www.nobelprize.org/uploads/2018/06/stiglitz-lecture.pdf): trechos sobre informação, seleção/incentivos e salário eficiência.
- [Cade — defesa da concorrência](https://www.gov.br/cade/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-sobre-defesa-da-concorrencia/): poder de mercado e monopólio natural.
- [Lei9279/1996, art40](https://www.planalto.gov.br/ccivil_03/leis/l9279.htm): prazo da patente de invenção.

HTMLs do Nobel retornaram403; os PDFs oficiais de Ostrom/Stiglitz foram recuperados e consultados. Para Coase, usada a exposição do IMF; lecture indexada foi apenas complementar, sem alegar leitura integral da página bloqueada. Não se revisaram todas as funções macroeconômicas ou a Macroeconomia aceita. Mapas foram lidos semanticamente, sem novo teste visual nesta etapa de diagnóstico.

### Evidência, pendência e parada

Evidências: `orquestracao-03-54/saneamento-onda-7/36-financas-publicas/diagnostico-01-04-20261126/`: SELECT, estado atual, achados, fontes e checkpoint. Sintaxe/JSONs/diff documental verificados. Sem importação, dry-run, CAS, SQL de escrita, novos renders, build/lint ou workflows globais. Conferência com aluno dispensada; corpus PRO Legis fora do escopo.

**0/7 seções formalmente revisadas/aceitas neste ciclo**; quatro delimitadas para revisão, três reservadas para lote posterior. Disciplina permanece[ ] na fila de execução, com diagnóstico registrado; contagens22[x]/24[~]/8[ ] inalteradas. Arquivos antigos não rastreados e `workflow_onda.py` preservados. Nenhum próximo lote iniciado.

Próximo prompt: “Revise somente Finanças Públicas01–04, conforme relatório36. Preserve Ética aceita e as seções05–07, publique com proteção de concorrência, reconcilie e pare.”
