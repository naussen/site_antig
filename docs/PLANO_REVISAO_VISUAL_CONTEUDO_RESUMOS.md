# Plano de Revisão Visual e de Conteúdo dos Resumos

**Produto:** PRO Concursos — PRO Resumos

**Ambiente principal:** `https://proconcursos.com.br/resumos`

**Inventário inicial:** 12 de setembro de 2026

**Escopo inventariado:** 30 disciplinas disponíveis na configuração da conta

## 1. Objetivo

Revisar sistematicamente todos os resumos publicados, uma disciplina por vez, verificando integridade visual, estrutura do conteúdo e funcionamento dos recursos didáticos. O plano não autoriza uma varredura integral em uma única execução: cada disciplina somente pode ser iniciada após comando explícito do usuário.

## 2. Protocolo obrigatório de execução

1. Aguardar o usuário indicar exatamente uma disciplina.
2. Comparar a lista publicada de disciplinas com este plano; adicionar eventuais disciplinas novas, sem iniciá-las automaticamente.
3. Atualizar o inventário da disciplina autorizada, incluindo todos os resumos e respectivas URLs.
4. Abrir todos os resumos da disciplina e percorrer todas as seções, sem amostragem.
5. Ignorar completamente os flashcards nesta etapa: não avaliar conteúdo, aparência, interação ou quantitativo de flashcards.
6. Registrar observações objetivas com resumo, seção, URL, viewport, tema e evidência reproduzível.
7. Corrigir imediatamente, sem novo comando, todo erro visual ou funcional encontrado dentro da disciplina autorizada.
8. Para cada correção, aplicar alteração mínima, executar verificações proporcionais, criar commit atômico, fazer push em `main`, confirmar o deploy Netlify e repetir o smoke em produção.
9. Continuar dentro da mesma disciplina até que todas as correções visuais e funcionais estejam publicadas e validadas.
10. Atualizar a linha da disciplina e o registro detalhado da execução.
11. Encerrar a execução e aguardar novo comando antes de iniciar outra disciplina.

Se uma correção em componente compartilhado puder afetar outros resumos, executar um smoke de regressão representativo fora da disciplina apenas para validar o componente. Isso não autoriza revisar ou marcar outra disciplina como concluída.

## 3. Checklist obrigatório para cada resumo

### Conteúdo e estrutura visual

- títulos, subtítulos, listas e hierarquia aparecem na ordem correta;
- não há texto truncado, duplicado, ausente, com mojibake ou sintaxe técnica exposta;
- Markdown, tabelas, fórmulas KaTeX, callouts, mnemônicos, destaques e links são legíveis;
- tabelas e blocos extensos possuem rolagem interna quando necessária, sem overflow da página;
- espaçamento, contraste, alinhamento e densidade permanecem adequados nos temas Light, Dark e Sepia;
- desktop e viewport móvel de 390 × 844 não apresentam sobreposição, corte ou rolagem horizontal global;
- inconsistências substantivas do conteúdo são registradas como atenção, sem reescrever conteúdo jurídico ou factual sem fonte e autorização específicas.

### Gráficos

- cada gráfico esperado carrega sem erro ou placeholder permanente;
- dados, eixos, títulos, legendas e unidades são visíveis e coerentes com o texto próximo;
- o gráfico é responsivo, não corta rótulos e não provoca overflow global;
- estados vazio, inválido e de falha apresentam fallback compreensível;
- console e rede não apresentam falha associada ao carregamento.

### Mermaid

- cada bloco Mermaid é convertido em diagrama, sem código bruto visível;
- não há erro de parsing, diagrama em branco ou carregamento infinito;
- textos e conexões são legíveis, sem colisões críticas ou elementos cortados;
- zoom, restauração e visualização ampliada funcionam;
- o fallback permanece seguro e o console não apresenta erro de renderização.

### Mapas mentais

- o mapa mental esperado está associado à seção correta;
- direção, agrupamento e conexões representam adequadamente a hierarquia fornecida;
- configuração de zoom inicial, limites, overlay e controles permite leitura prática;
- o mapa permanece legível e funcional nos três temas e no mobile;
- mapas muito largos usam contenção ou rolagem interna sem deformar a página.

## 4. Regra para observações e correções

- Marcar **Atenção** somente quando houver problema, dúvida de conteúdo ou melhoria necessária.
- Marcar **Correção validada** somente depois que todos os problemas visuais e funcionais da disciplina estiverem corrigidos em produção. Se não houver erro corrigível, registrar `N/A — nenhum erro visual ou funcional`.
- Observações de conteúdo substantivo permanecem registradas como pendência editorial; elas não impedem a conclusão da correção visual, mas impedem declarar o conteúdo integralmente aprovado.
- Não alterar conteúdo jurídico, fórmulas, dados ou afirmações factuais por suposição.

## 5. Progresso por disciplina

| Revisão concluída | Disciplina | Atenção | Correção validada | Observações / evidências |
|---|---|---|---|---|
| [x] | Administração de Recursos Materiais | [ ] | [ ] | 9 resumos e 33 seções revisados; correções editoriais e normativas importadas; persistência exata confirmada. O smoke autenticado em produção permanece sem automação disponível nesta execução: as rotas públicas retornam 307 para `/resumos/login`. |
| [x] | Administração Financeira e Orçamentária | [ ] | [x] | 6 resumos e 48 seções revisados; 38 seções corrigidas; 24 mapas, 13 tabelas e 11 fórmulas validados; persistência integral e smoke autenticado confirmados. |
| [x] | Administração Geral | [ ] | [x] | 11 resumos e 54 seções revisados; 26 seções corrigidas; 22 mapas, 6 tabelas e 3 fórmulas validados; persistência integral confirmada. |
| [x] | Administração Pública | [x] | [x] | 12 resumos e 40 seções revisados; 11 payloads corrigidos; 24 mapas, 14 tabelas e 2 fórmulas KaTeX validados; 120 flashcards preservados; persistência integral confirmada. |
| [x] | Análise de Balanços | [ ] | [x] | 4 resumos e 4 seções revisados; 3 módulos corrigidos; 5 tabelas e 22 blocos matemáticos validados; persistência integral confirmada. |
| [x] | Auditoria | [ ] | [x] | 24 resumos e 76 seções revisados; 33 seções corrigidas; 2 tabelas e 12 mapas validados; persistência integral confirmada. |
| [ ] | Contabilidade de Custos | [ ] | [ ] | — |
| [x] | Contabilidade Geral e Avançada | [ ] | [x] | 32 resumos e 142 seções revisados; 76 seções corrigidas; 24 mapas e 40 tabelas validados; persistência e smoke autenticado confirmados. |
| [x] | Direito Administrativo | [ ] | [x] | 19 resumos e 184 seções revisados; 58 seções corrigidas; 20 mapas e 18 tabelas validados; persistência integral e smoke autenticado confirmados. |
| [x] | Direito Civil | [ ] | [x] | 12 resumos e 130 seções revisados; 67 correções jurídicas; 25 seções de fonte restauradas; 26 mapas e 17 tabelas validados; persistência integral e smoke autenticado confirmados. |
| [x] | Direito Constitucional | [ ] | [x] | 15 resumos e 105 seções revisados; 64 correções jurídicas aplicadas em 30 seções; persistência integral confirmada no Supabase. |
| [ ] | Direito da Pessoa com Deficiência | [ ] | [ ] | — |
| [ ] | Direito do Trabalho | [ ] | [ ] | — |
| [ ] | Direito Eleitoral | [ ] | [ ] | — |
| [x] | Direito Empresarial | [ ] | [x] | 3 resumos e 29 seções revisados; revisão jurídica integral reaberta após o smoke, correções publicadas e persistência exata confirmada por reexportação. |
| [x] | Direito Penal | [ ] | [x] | 3 resumos e 104 seções; a Parte Especial foi reorganizada em 82 crimes individualizados, sem títulos editoriais genéricos; persistência integral confirmada no Supabase. |
| [ ] | Direito Previdenciário | [ ] | [ ] | — |
| [ ] | Direito Processual Civil | [ ] | [ ] | — |
| [ ] | Direito Processual do Trabalho | [ ] | [ ] | — |
| [ ] | Direito Processual Penal | [ ] | [ ] | — |
| [ ] | Direito Tributário | [ ] | [ ] | — |
| [ ] | Ética no Serviço Público | [ ] | [ ] | — |
| [ ] | Finanças Públicas | [ ] | [ ] | — |
| [ ] | Geral | [ ] | [ ] | — |
| [ ] | Legislação Aduaneira | [ ] | [ ] | — |
| [ ] | Legislação Penal Especial | [ ] | [ ] | — |
| [ ] | Macroeconomia | [ ] | [ ] | — |
| [ ] | Microeconomia | [ ] | [ ] | — |
| [x] | Português | [ ] | [x] | 6 resumos e 37 seções revisados; 72 correções editoriais aplicadas em 20 seções; persistência integral confirmada no Supabase. |
| [ ] | Raciocínio Lógico, Matemática, Estatística e Matemática Financeira | [ ] | [ ] | — |

## 6. Registro da disciplina ativa

Ao iniciar uma disciplina, adicionar abaixo uma subseção no formato:

```markdown
### <Disciplina> — <data>

**Comando de início do usuário:** `<mensagem>`

**Quantidade de resumos:** `<n>`

**Estado:** em revisão | em correção | concluída | bloqueada

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid | Mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|---|
| <título> | <URL> | <n> | [ ] | [ ] | [ ] | [ ] | <descrição> | <commit/deploy/smoke> |
```

O relatório final da disciplina deve informar arquivos alterados, correções realizadas, testes executados, commits, SHA remoto, deploy publicado, smoke em produção, observações editoriais pendentes e riscos remanescentes.

### Português — 12 de setembro de 2026

**Comando de início do usuário:** `processar disciplina PORTUGUÊS`

**Quantidade de resumos:** 6

**Quantidade de seções:** 37

**Estado:** concluída

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid | Mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|---|
| Considerações Iniciais | `https://proconcursos.com.br/resumos/consideracoes-iniciais` | 1 | [x] | N/A | [x] | [x] | Sem falha visual ou funcional. | Desktop e 390 × 844; sem overflow; mapa renderizado. |
| Fonética | `https://proconcursos.com.br/resumos/fonetica` | 4 | [x] | N/A | [x] | [x] | Sem falha visual ou funcional. | Todas as seções percorridas; console sem erro. |
| Morfologia | `https://proconcursos.com.br/resumos/morfologia` | 10 | [x] | N/A | [x] | [x] | Sem falha visual ou funcional. | Todas as seções percorridas; tabelas com contenção responsiva. |
| Outros Tópicos | `https://proconcursos.com.br/resumos/outros-topicos` | 3 | [x] | N/A | [x] | [x] | Corrigidas a caracterização da narração, denotação e expressões vocabulares imprecisas. | Três mapas renderizados; zoom, restauração e overlay funcionais; temas Light, Dark e Sepia validados. |
| Sintaxe | `https://proconcursos.com.br/resumos/sintaxe` | 11 | [x] | N/A | [x] | [x] | Corrigidos estrangeirismos acidentais e regras imprecisas de pontuação, sujeito, concordância, regência, crase e funções de “se” e “que”. | Quatro mapas renderizados; tabela densa com rolagem horizontal interna no mobile; conteúdo reexportado e comparado com o banco. |
| Redação Oficial | `https://proconcursos.com.br/resumos/redacao-oficial` | 8 | [x] | N/A | [x] | [x] | Sem falha visual ou funcional. | Todas as seções percorridas; mapas e conteúdo legíveis no mobile. |

**Consolidação:** os 6 resumos e as 37 seções foram percorridos integralmente em produção, desconsiderando flashcards. Não há gráficos quantitativos na disciplina. Foram encontrados 12 mapas Mermaid e 8 tabelas; todos carregaram sem código bruto, erro persistente, corte global ou falha de console. A revisão estrutural também não encontrou texto ausente, seção vazia ou imagem quebrada visível.

**Correções visuais/funcionais:** N/A — nenhum erro visual ou funcional reproduzido.

**Revisão editorial corretiva — 12 de setembro de 2026:** realizada nova leitura integral das 37 seções, sem avaliar ou alterar flashcards. Foram aplicadas 72 substituições controladas em 20 seções de Fonética, Morfologia, Outros Tópicos, Sintaxe e Redação Oficial. As correções abrangeram ortografia, flexão verbal, classificação gramatical, concordância, colocação pronominal, pronomes relativos, tipologia textual, regência, crase, pontuação e estrutura de documentos oficiais.

**Persistência:** a atualização parcial gravou exclusivamente `content_markdown` e `callouts`. Flashcards, mapas Mermaid, mnemônicos, títulos, IDs e ordem das seções foram preservados. A exportação posterior foi comparada com o resultado esperado nas 37 seções e não apresentou divergência.

**Pendências editoriais:** nenhuma dentre os erros encontrados nesta revisão. O contrato legado dos flashcards sem o campo `source` permanece fora do escopo deste plano e não foi modificado.

### Direito Constitucional — 12 de setembro de 2026

**Comando de início do usuário:** `disciplina: Direito Constitucional — Após revisão funcional e visual, realizar revisão de correção do conteúdo.`

**Quantidade de resumos:** 15

**Quantidade de seções:** 105

**Estado:** concluída

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid | Mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|---|
| Aspectos introdutórios do Direito Constitucional | `https://proconcursos.com.br/resumos/aspectos-introdutorios-do-direito-constitucional` | 20 | [x] | N/A | [x] | [x] | Corrigidas as concepções de Lassalle, a recepção e a terminologia do controle constitucional. | 20 seções presentes; 2 mapas renderizados; sem overflow. |
| Da Administração Pública | `https://proconcursos.com.br/resumos/administracao-publica` | 3 | [x] | N/A | N/A | N/A | Corrigidos subsídio, Súmula Vinculante, teto federal, acumulação e mandato eletivo. | 3 seções presentes; tabela com rolagem interna no mobile. |
| Da defesa do Estado e das instituições democráticas | `https://proconcursos.com.br/resumos/defesa-do-estado-e-das-instituicoes-democraticas` | 10 | [x] | N/A | N/A | N/A | Corrigidas convocação do Congresso e posição/atribuições constitucionais das guardas municipais. | 10 seções presentes; tabela responsiva; sem imagem quebrada. |
| Da fiscalização contábil, financeira e orçamentária | `https://proconcursos.com.br/resumos/fiscalizacao-contabil-financeira-orcamentaria` | 5 | [x] | N/A | [x] | [x] | Corrigido o requisito etário dos Ministros do TCU. | 5 seções presentes; 1 mapa renderizado; sem overflow. |
| Da intervenção | `https://proconcursos.com.br/resumos/intervencao` | 2 | [x] | N/A | N/A | N/A | Corrigidos os legitimados e os procedimentos de solicitação, requisição e representação. | 2 seções presentes; smoke autenticado aprovado. |
| Da ordem social | `https://proconcursos.com.br/resumos/ordem-social` | 17 | [x] | N/A | [x] | [x] | Corrigidos custeio da seguridade, pensão por morte, aposentadoria compulsória e critério assistencial. | 17 seções presentes; 1 mapa e 2 tabelas responsivos. |
| Da organização do Estado | `https://proconcursos.com.br/resumos/organizacao-do-estado` | 4 | [x] | N/A | [x] | [x] | Corrigida a competência municipal em educação. | 4 seções presentes; 3 mapas renderizados; zoom e overlay aprovados. |
| Das funções essenciais à Justiça | `https://proconcursos.com.br/resumos/funcoes-essenciais-a-justica` | 1 | [x] | N/A | N/A | N/A | Retirado o CNMP da estrutura orgânica do MP e corrigidas as competências atribuídas ao Conselho. | Seção integralmente revisada; smoke autenticado aprovado. |
| Do controle de constitucionalidade | `https://proconcursos.com.br/resumos/controle-de-constitucionalidade` | 9 | [x] | N/A | [x] | [x] | Corrigidos pressupostos, momentos, controle preventivo, competências, reserva de plenário e art. 52, X. | 9 seções presentes; 2 mapas e tabela responsivos. |
| Do Poder Executivo | `https://proconcursos.com.br/resumos/poder-executivo` | 4 | [x] | N/A | N/A | N/A | Corrigidas tomada de contas, imunidades, requisitos de Ministro e eleição municipal. | 4 seções presentes; sem overflow. |
| Do Poder Judiciário | `https://proconcursos.com.br/resumos/poder-judiciario` | 4 | [x] | N/A | N/A | N/A | Corrigidos requisitos/listas do STJ, indicação do CNJ, Súmula 649 e tabela de foro. | 4 seções presentes; 2 tabelas com rolagem interna no mobile. |
| Do Poder Legislativo | `https://proconcursos.com.br/resumos/poder-legislativo` | 6 | [x] | N/A | N/A | N/A | Atualizada a jurisprudência de foro de 2025 e corrigida a situação dos corréus sem prerrogativa. | 6 seções presentes; smoke autenticado aprovado. |
| Do processo legislativo | `https://proconcursos.com.br/resumos/processo-legislativo` | 11 | [x] | N/A | N/A | N/A | Corrigidos o prazo constitucional da MP e a vedação orçamentária das leis delegadas. | 11 seções presentes; sem overflow. |
| Dos direitos e garantias fundamentais | `https://proconcursos.com.br/resumos/direitos-e-garantias-fundamentais` | 6 | [x] | N/A | N/A | N/A | Atualizados nacionalidade, alistamento, inelegibilidade reflexa e cláusula de desempenho partidária. | 6 seções presentes; tabelas responsivas; conteúdo novo visível em produção. |
| Dos princípios fundamentais | `https://proconcursos.com.br/resumos/principios-fundamentais` | 3 | [x] | N/A | N/A | N/A | Corrigidos o procedimento de plebiscito/referendo e os conceitos de povo e população. | 3 seções presentes; smoke autenticado aprovado. |

**Consolidação:** os 15 resumos e as 105 seções foram percorridos integralmente em produção, sem avaliar flashcards. Não há gráficos quantitativos na disciplina. Foram identificados 9 mapas Mermaid e 8 tabelas no conteúdo; não houve código Mermaid bruto, erro persistente, seção vazia, imagem visível quebrada, overflow global ou mensagem no console.

**Correções visuais/funcionais:** N/A — nenhum erro visual ou funcional foi reproduzido. As tabelas mantêm rolagem horizontal interna no viewport de 390 × 844. Zoom, restauração e overlay dos mapas responderam sem provocar overflow. Os temas Light, Dark e Sepia foram conferidos e o tema Light foi restaurado.

**Revisão jurídica corretiva:** foram aplicadas 64 substituições controladas em 30 seções, confrontadas com a Constituição compilada, a EC 131/2023, a EC 97/2017 e jurisprudência oficial do STF. Os ajustes abrangeram nacionalidade, segurança pública municipal, servidores, organização dos Poderes, controle de constitucionalidade, intervenção, seguridade social, processo legislativo, direitos políticos e foro por prerrogativa.

**Persistência:** a atualização parcial gravou exclusivamente `content_markdown` e `callouts`. Flashcards, mapas Mermaid, mnemônicos, títulos, IDs e ordem das seções foram preservados. A leitura posterior confirmou correspondência exata das 105 seções com os payloads esperados.

**Pendências editoriais:** nenhuma dentre os erros encontrados nesta revisão. Flashcards permaneceram integralmente fora do escopo, inclusive quando continham texto relacionado a trechos corrigidos.

### Direito Penal — 12 de setembro de 2026

**Comando de início do usuário:** `Direito Penal`

**Quantidade de resumos:** 3

**Quantidade de seções:** 104

**Estado:** concluída

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid | Mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|---|
| Da Lei Penal | `https://proconcursos.com.br/resumos/da-lei-penal` | 4 | [x] | N/A | [x] | [x] | Conteúdo confrontado com a Parte Geral do Código Penal; nenhuma incorreção objetiva remanescente identificada. | 4 seções presentes; 1 mapa renderizado; 2 tabelas responsivas; sem overflow. |
| Do Crime | `https://proconcursos.com.br/resumos/do-crime` | 18 | [x] | N/A | [x] | [x] | Corrigida a fonte normativa do critério legal de infração penal. | 18 seções presentes; 1 mapa renderizado; 2 tabelas responsivas; sem conteúdo bruto. |
| Parte Especial do Código Penal | `https://proconcursos.com.br/resumos/parte-especial-do-codigo-penal` | 82 | [x] | N/A | [x] | [x] | Atualizados feminicídio, vicaricídio, lesão corporal, art. 122 e dispositivos dos arts. 158, 311 e 311-A; os crimes foram individualizados, enquanto qualificadoras e disposições auxiliares permaneceram no crime correspondente. | 82 crimes presentes; sem títulos genéricos na indexação; 1 mapa preservado. |

**Consolidação:** os 3 resumos e as 43 seções foram percorridos integralmente em produção, sem avaliar flashcards. Foram identificados 3 mapas Mermaid e 6 tabelas; não houve código Mermaid bruto, erro persistente, seção vazia, imagem visível quebrada ou overflow global em desktop e no viewport de 390 × 844.

**Correções visuais/funcionais:** corrigidos no próprio conteúdo uma célula vazia e separadores textuais indevidos em tabela. A estrutura da aplicação não exigiu alteração. O zoom, a restauração e o overlay do mapa mental funcionaram, e o viewport padrão foi restaurado ao final.

**Revisão jurídica corretiva:** foram aplicadas 18 substituições controladas em 9 seções. A revisão usou o Código Penal compilado oficial e alcançou apenas afirmações objetivamente desatualizadas, incorretas ou truncadas, sem uniformizar controvérsias doutrinárias.

**Persistência:** a atualização parcial gravou exclusivamente `content_markdown` e `callouts`, com conferência otimista antes da primeira escrita. Flashcards, mapas Mermaid, mnemônicos, títulos, IDs e ordem das seções foram preservados. A leitura posterior confirmou correspondência exata das 43 seções com os payloads esperados.

**Pendências editoriais:** nenhuma dentre os erros encontrados nesta revisão. Flashcards permaneceram integralmente fora do escopo, inclusive quando possam repetir redações anteriores à atualização legislativa.

**Reorganização posterior:** em 12 de setembro de 2026, a Parte Especial passou de 21 agrupamentos para 82 crimes individualizados. Foram removidos da indexação títulos que não representam crimes e a nomenclatura visual “Seção”; qualificadoras, causas de aumento, formas equiparadas e regras comuns permaneceram incorporadas ao delito pertinente. Antes da atualização, confirmou-se a inexistência de progresso, notas ou destaques vinculados aos 21 IDs anteriores. A reexportação do Supabase confirmou correspondência exata das 82 seções, com os 3 callouts e o mapa Mermaid preservados.

### Direito Empresarial — 13 de setembro de 2026

**Comando de início do usuário:** `Plano de Revisão Visual e de Conteúdo dos Resumos disciplina: Direito Empresarial`

**Quantidade de resumos:** 3

**Quantidade de seções:** 29

**Estado:** concluída

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid | Mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|---|
| Direito de Empresa | `https://proconcursos.com.br/resumos/direito-de-empresa` | 6 | [x] | N/A | [x] | [x] | Substituída tabela-placeholder por comparação útil entre firma e denominação; restaurada cobertura de trespasse, escrituração e prepostos. | JSON validado; importação e reexportação coincidem. |
| Sociedades | `https://proconcursos.com.br/resumos/sociedades` | 18 | [x] | N/A | [x] | [x] | Preenchida SCP; restaurada cobertura de comandita simples, Assembleia Geral e Conselho de Administração; atualizados pontos legais objetivos. | JSON validado; importação e reexportação coincidem. |
| Títulos de Crédito | `https://proconcursos.com.br/resumos/titulos-de-credito` | 5 | [x] | N/A | N/A | N/A | Corrigidas a regra de outorga conjugal para aval e a redação sobre cessão civil de crédito. | JSON validado; importação e reexportação coincidem. |

**Consolidação:** os 3 resumos e as 29 seções foram auditados sem avaliar flashcards. Não há gráficos quantitativos. Foram preservados um mapa Mermaid em Direito de Empresa, um em Sociedades e as tabelas didáticas; a única tabela sem função pedagógica foi substituída por comparação substantiva. A análise estrutural não encontrou `U+FFFD`, `@@`, HTML técnico exposto ou seção vazia.

**Correções visuais/funcionais:** corrigida a tabela-placeholder no resumo Direito de Empresa. As demais tabelas e os diagramas atendem à função didática prevista no plano visual.

**Revisão jurídica corretiva:** foram restaurados blocos omitidos durante o processamento e corrigidos pontos objetivamente incompatíveis com o Código Civil e a Lei das Sociedades por Ações, incluindo a extensão subjetiva da desconsideração, sociedade limitada unipessoal, contribuição em serviços, quórum de capital, diretoria da S/A, aval e cessão civil.

**Persistência:** a importação administrativa em lote foi aprovada no preflight e aplicada aos 3 módulos. A reexportação posterior confirmou correspondência semântica exata de `content_markdown`, callouts, mnemônicos, flashcards, mapas, títulos e IDs nas 29 seções.

**Pendências editoriais:** flashcards permaneceram fora do escopo.

**Smoke autenticado em produção:** repetido com sucesso em 13 de setembro de 2026 nos três módulos. As 29 seções, os dois mapas Mermaid, as tabelas responsivas, a navegação lateral, o cabeçalho, os cartões e a navegação entre módulos carregaram sem erro visual ou funcional observável. Durante a sessão autenticada, nenhuma das três rotas redirecionou para o login.

**Revisão integral de conteúdo reaberta:** o smoke revelou erro textual e repetição real em Sociedades, motivo pelo qual os três módulos foram novamente conferidos contra fontes legais oficiais. Em Direito de Empresa, foram corrigidas regras sobre registro, empresário incapaz, trespasse, escrituração, nome empresarial e desconsideração. Em Sociedades, foram removidas as repetições e atualizadas regras de sociedade simples, limitada, cooperativa e anônima, inclusive os quóruns da Lei 14.451/2022. Em Títulos de Crédito, foram corrigidos sujeitos cambiais, endosso, aval, apresentação, protesto, execução de cheque e duplicata e incluída a duplicata escritural.

**Nova persistência:** os três payloads passaram por 41 testes de conteúdo e pelo preflight administrativo. A importação atualizou as 29 seções sem criar ou remover unidades; `section_id`, `content_unit_id` e `stable_key` foram preservados. A reexportação posterior apresentou correspondência semântica exata com os três JSONs revisados. O backup anterior à alteração permanece exportável em `C:\PRO\agente\backups\Direito Empresarial\2026-09-13-revisao-conteudo`.

### Contabilidade Geral e Avançada — 13 de setembro de 2026

**Comando de início do usuário:** `disciplina: Contabilidade Geral e Avançada — revisão funcional, visual e correção do conteúdo`

**Quantidade de resumos:** 32

**Quantidade de seções:** 142

**Estado:** concluída

| Faixa de resumos | Resumos | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---:|---:|---|---|---|---|---|
| 001–008 | 8 | 34 | [x] | N/A | [x] | Corrigidos fundamentos, folha, duplicatas, AVP e operações com mercadorias. | Rotas autenticadas, tabelas responsivas, KaTeX e mapas validados. |
| 009–016 | 8 | 36 | [x] | N/A | [x] | Atualizados ativos, CPC 27, CPC 04, impairment, estoques, arrendamentos, PIV e CPC 31. | Rotas autenticadas, tabelas responsivas, KaTeX e mapas validados. |
| 017–024 | 8 | 33 | [x] | N/A | [x] | Atualizados CPC 48, provisões, CPC 08, reservas, dividendos e encoding. | Rotas autenticadas, tabelas responsivas, KaTeX e mapas validados. |
| 025–032 | 8 | 39 | [x] | N/A | [x] | Atualizados reservas, demonstrações, câmbio, subvenções, MEP, combinações, consolidação e CPC 23. | Rotas autenticadas, tabelas responsivas, KaTeX e mapas validados. |

**Consolidação visual e funcional:** os 32 resumos e as 142 seções foram abertos em produção com sessão autenticada. As 40 tabelas permaneceram em contêineres responsivos; os 24 mapas Mermaid carregaram como SVG, sem código bruto, estado preso ou erro; não houve redirecionamento para login nem overflow horizontal global. Não há gráfico quantitativo requerido pelos planos desta disciplina.

**Correções visuais:** escapadas 191 ocorrências textuais de `R$` que eram interpretadas como delimitadores matemáticos; reparadas fórmulas de estoques; normalizadas abreviações monetárias para `BRL`, `USD` e `EUR` somente dentro de KaTeX; removido o bloco vazio “Insubistência X Superveniência”. O smoke corretivo confirmou zero `.katex-error` nos módulos afetados.

**Revisão de conteúdo:** 76 seções receberam correções objetivas, com foco na vigência e terminologia dos CPCs, Lei 6.404/76, legislação trabalhista e tributária correlata. Os módulos 002, 003, 018 e 024 não exigiram correção textual substantiva. As fontes primárias usadas incluem pronunciamentos oficiais do CPC, legislação compilada do Planalto e atos do CFC.

**Persistência:** o preflight administrativo aprovou os 32 módulos antes da primeira escrita. A importação atualizou somente conteúdo e recursos didáticos das 142 unidades existentes, com igualdade exata de `section_id`, `content_unit_id` e `stable_key`. A reexportação confirmou correspondência integral com os payloads revisados. Os 120 flashcards publicados permaneceram idênticos ao backup prévio e não foram analisados.

**Backups:** `C:\PRO\agente\contabilidade_geral_e_avançada\backups\2026-09-13-pre-revisao` e `C:\PRO\agente\contabilidade_geral_e_avançada\backups\2026-09-13-pos-revisao`.

**Pendências editoriais:** nenhuma dentre os erros encontrados nesta revisão. O `topic_id` legado `cpc-27-intangivel` foi mantido para preservar a URL, embora o título exibido tenha sido corrigido para CPC 04 (R1). Flashcards permanecem fora do escopo.

### Auditoria — 13 de setembro de 2026

**Comando de início do usuário:** `disciplina: Auditoria — revisão funcional, visual e correção do conteúdo`

**Quantidade de resumos:** 24

**Quantidade de seções:** 76

**Estado:** concluída

| Faixa da revisão | Resumos | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---:|---:|---|---|---|---|---|
| Normas gerais, auditoria interna e planejamento | 8 | 26 | [x] | N/A | [x] | Corrigidas definições, responsabilidades, documentação, planejamento e controles. | Persistência confirmada por reexportação. |
| Evidência, riscos, materialidade e estimativas | 8 | 23 | [x] | N/A | [x] | Atualizados critérios das NBC TA 240, 320, 500, 530, 540 e 560. | Persistência confirmada por reexportação. |
| Relatórios, qualidade e trabalho de terceiros | 8 | 27 | [x] | N/A | [x] | Atualizados NBC TA 220, 505, 600, 610, 620, 700, 705 e 706. | Persistência confirmada por reexportação. |

**Consolidação visual e funcional:** as 24 rotas e 76 seções foram percorridas autenticadas em desktop de 2560 px e mobile de 390 × 844. As duas tabelas mantiveram rolagem horizontal interna. Os mapas Mermaid renderizaram sem código bruto ou estado preso; não houve imagem quebrada, erro de console ou overflow global. Não há gráficos quantitativos na disciplina.

**Correções visuais:** links longos em Markdown agora podem quebrar em qualquer ponto no mobile, sem ultrapassar o card. O título principal do módulo recebeu contenção responsiva e quebra segura para impedir o corte de palavras longas. Valores monetários textuais deixaram de ser interpretados como delimitadores matemáticos.

**Revisão de conteúdo:** 33 seções em 20 módulos receberam correções técnicas baseadas no catálogo vigente do CFC, nas NBC TA/NBC TI/NBC PA e na Resolução CVM nº 23/2021. Foram corrigidos conceitos de amostragem, documentação, fraude, evidência, materialidade, independência, planejamento, qualidade, relatórios, utilização de especialistas e outros auditores.

**Persistência:** a atualização foi aplicada individualmente para não alterar a ordenação dos módulos. A reexportação confirmou correspondência integral dos 24 payloads revisados, preservação dos 76 pares `content_unit_id`/`stable_key`, ordem dos módulos, 12 mapas e 159 flashcards publicados. Flashcards não foram analisados.

**Backups:** `C:\PRO\agente\auditoria\backups\2026-09-13-pre-revisao` e `C:\PRO\agente\auditoria\backups\2026-09-13-pos-revisao`.

**Pendências editoriais:** nenhuma dentre as incorreções comprovadas nesta revisão. Simplificações pedagógicas não contraditórias foram preservadas; flashcards permanecem fora do escopo.

### Administração Geral — 13 de setembro de 2026

**Comando de início do usuário:** `disciplina: Administração Geral — revisão funcional, visual e correção do conteúdo`

**Quantidade de resumos:** 11

**Quantidade de seções:** 54

**Estado:** concluída

| Grupo | Resumos | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---:|---:|---|---|---|---|---|
| Processo administrativo, planejamento e organização | 4 | 16 | [x] | N/A | [x] | Corrigidos PODC, delegação, planejamento, cenários, BSC, PES, estruturas e amplitude de controle. | Persistência confirmada por reexportação. |
| Direção, comunicação e controle | 3 | 15 | [x] | N/A | [x] | Corrigidos motivação, liderança, comunicação, desempenho e conceitos de controle. | Persistência confirmada por reexportação. |
| Qualidade, projetos, desempenho e processos | 4 | 23 | [x] | N/A | [x] | Atualizados ISO 9001, PMBOK, qualidade, avaliação e modelagem de processos. | Persistência confirmada por reexportação. |

**Consolidação visual e funcional:** as 11 rotas e 54 seções foram percorridas autenticadas em desktop de 2560 px e mobile de 390 × 844. As 6 tabelas mantiveram rolagem horizontal interna; 22 mapas Mermaid e 3 fórmulas KaTeX renderizaram sem código bruto, erro ou carregamento preso. Não houve imagem quebrada, aviso de console ou overflow global. O zoom Mermaid foi testado e funcionou.

**Correção visual:** o título muito longo de Processo Organizacional deixou de quebrar uma letra isolada no mobile. O tamanho responsivo foi reduzido apenas em telas estreitas, preservando a escala original a partir do breakpoint médio.

**Revisão de conteúdo:** 26 seções em 10 módulos receberam correções objetivas. Foram atualizados ou refinados conceitos de Maslow, AMO, comunicação, planejamento, Godet, BSC, PES, delegação, ISO 9000/9001, PMBOK, qualidade, avaliação de desempenho, cadeia de valor, IDEF0 e teorias administrativas.

**Persistência:** a publicação foi aplicada individualmente para preservar a ordenação. A reexportação confirmou correspondência integral dos 11 payloads revisados, das 54 identidades permanentes, dos 22 mapas e dos 120 flashcards publicados. Flashcards não foram analisados.

**Backups:** `C:\PRO\agente\administracao_geral\backups\2026-09-13-pre-revisao` e `C:\PRO\agente\administracao_geral\backups\2026-09-13-pos-revisao`.

**Pendências editoriais:** nenhuma dentre os erros encontrados. Simplificações didáticas compatíveis com as referências foram preservadas e flashcards permanecem fora do escopo.

### Administração de Recursos Materiais — 19 de setembro de 2026

**Comando de início do usuário:** `disciplina: Administração de Recursos Materiais — revisão funcional, visual e correção do conteúdo`

**Quantidade de resumos:** 9

**Quantidade de seções:** 33

**Estado:** concluída, com ressalva de smoke autenticado em produção

| Grupo | Resumos | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---:|---:|---|---|---|---|---|
| Fundamentos, classificação e estoques | 3 | 13 | [x] | [x] | [x] | Restauradas comparações, tabela do LEC e conceitos omitidos; corrigidos classificação contábil, tendência, segurança e fórmula corrompida. | JSON válido, preflight aprovado e persistência exata por reexportação. |
| Almoxarifado, recebimento e armazenagem | 3 | 9 | [x] | N/A | [x] | Atualizado o recebimento para a Lei 14.133/2021; corrigido o exemplo de layout e restauradas estruturas comparativas. | Conteúdo importado; Mermaid sem artefatos; build aprovado. |
| Distribuição, patrimônio e compras | 3 | 11 | [x] | N/A | [x] | Restauradas tabelas comparativas; atualizadas classificação temporal, inventário e alienação conforme a legislação vigente. | Conteúdo importado e reexportado sem divergência semântica. |

**Revisão visual e funcional:** as 17 páginas do PDF de origem foram confrontadas integralmente com os nove payloads. Estruturas comparativas que haviam sido achatadas em listas foram recompostas em tabelas Markdown; diagramas existentes foram preservados e o mapa de recebimento foi atualizado. O validador não encontrou artefatos Mermaid, os 44 testes de conteúdo passaram e o build de produção concluiu sem erro. O lint concluiu sem erros, com um aviso preexistente em `scripts/content-admin.mjs`.

**Revisão de conteúdo:** foram corrigidas omissões comprovadas contra a fonte, um estrangeirismo acidental, o conceito de consumo com tendência, o tratamento do estoque de segurança, o exemplo incorreto de layout por processo e a estrutura do inventário rotativo. A disciplina foi atualizada para o art. 140 e o art. 76 da Lei 14.133/2021 e para a redação correta dos arts. 2º e 3º da Portaria STN 448/2002. A IN SEDAP 205/1988 foi conferida em publicação oficial.

**Persistência:** o preflight aprovou os 9 módulos e 33 seções antes da escrita. A importação em lote foi concluída e a reexportação posterior coincidiu semanticamente com os nove artefatos revisados em `topic_id`, título, disciplina, ordem e conteúdo integral das seções.

**Ressalva operacional:** o smoke autenticado em produção foi novamente tentado, mas as rotas canônicas continuam respondendo `307 Temporary Redirect` para `/resumos/login`, e esta execução não dispõe de controle de navegador autenticado nem de endpoint CDP. Por isso, a coluna **Correção validada** permanece desmarcada: não há evidência honesta de inspeção nos temas Light, Dark e Sepia nem no viewport móvel em produção.

**Pendências editoriais:** nenhuma dentre as incorreções objetivamente comprovadas nesta revisão. Flashcards permaneceram fora do escopo, conforme o protocolo.

### Direito Civil — 19 de setembro de 2026

**Comando de início do usuário:** `Plano de Revisão Visual e de Conteúdo dos Resumos disciplina: Direito Civil, caso ainda não tenha sido revisada. Após revisão funcional e visual, realizar revisão de correção do conteúdo.`

**Quantidade de resumos:** 12

**Quantidade de seções:** 130

**Estado:** concluída

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|
| Dos Bens | `https://proconcursos.com.br/resumos/classificacao-doutrinaria` | 2 | [x] | N/A | N/A | Corrigidas classificações de bens, aeronaves, embarcações, outorga conjugal e mar territorial. | Tabela, conteúdo e responsividade validados em produção. |
| Dos Fatos Jurídicos | `https://proconcursos.com.br/resumos/classificacao-geral-dos-fatos-juridicos` | 23 | [x] | N/A | [x] | Corrigidos defeitos, forma, atos ilícitos, prescrição, decadência e prazos; restaurados três blocos da fonte. | 23 seções, tabelas e mapas validados em produção. |
| Das Pessoas Jurídicas | `https://proconcursos.com.br/resumos/comeco-da-personalidade-juridica` | 16 | [x] | N/A | [x] | Corrigidos associações, fundações, administradores e desconsideração da personalidade jurídica. | 16 seções e mapas validados em produção. |
| Da Responsabilidade Civil | `https://proconcursos.com.br/resumos/da-responsabilidade-civil` | 1 | [x] | N/A | [x] | Qualificado o estado de necessidade e recompostos os esquemas de elementos e responsabilidade objetiva. | Conteúdo e dois mapas validados em produção. |
| Direito das Sucessões | `https://proconcursos.com.br/resumos/da-sucessao-em-geral` | 11 | [x] | N/A | [x] | Restauradas nove seções da fonte e corrigidos indignidade, representação, capacidade testamentária e disposições nulas. | 11 seções e mapas validados em produção. |
| Direito de Família | `https://proconcursos.com.br/resumos/do-direito-pessoal` | 13 | [x] | N/A | [x] | Corrigidos guarda, parentesco, regimes de bens, Tema 1.236/STF, união estável e curatela. | 13 seções e mapas validados em produção. |
| Das Várias Espécies de Contratos | `https://proconcursos.com.br/resumos/especies-de-contratos` | 8 | [x] | N/A | [x] | Restauradas compra e venda e cláusulas especiais; corrigidos doação, empréstimo, preço e preferência. | 8 seções e mapas validados em produção. |
| Direito das Coisas | `https://proconcursos.com.br/resumos/esquema-geral` | 11 | [x] | N/A | [x] | Restaurados conceitos e posse; corrigidos usucapião, benfeitorias, direitos reais, concessões e art. 243 da CF. | 11 seções, 5 tabelas e mapas validados em produção. |
| Direito das Obrigações | `https://proconcursos.com.br/resumos/modalidades-das-obrigacoes` | 11 | [x] | N/A | [x] | Restaurados transmissão, adimplemento, novação, compensação, confusão e remissão; corrigidos mora e cláusula penal. | 11 seções, tabelas e mapas validados em produção. |
| Das Pessoas Naturais | `https://proconcursos.com.br/resumos/pessoa` | 8 | [x] | N/A | N/A | Restaurados domicílio e disposição do corpo; corrigidos nome, capacidade, emancipação e alimentos. | 8 seções validadas em produção. |
| Dos Contratos em Geral | `https://proconcursos.com.br/resumos/principios-contratuais` | 10 | [x] | N/A | [x] | Corrigidos vícios redibitórios e categorias de extinção; restauradas comparações e mapas. | 10 seções, tabelas e mapas validados em produção. |
| LINDB | `https://proconcursos.com.br/resumos/vigencia-das-leis` | 16 | [x] | N/A | [x] | Corrigidos competência internacional, homologação e reenvio; restaurados quadros e fluxo do compromisso. | 16 seções e mapas validados em produção. |

**Consolidação visual e funcional:** as 12 rotas e as 130 seções foram percorridas com sessão autenticada em desktop de 1249 × 1269 e mobile de 390 × 844. Os 26 mapas Mermaid renderizaram como SVG, sem código bruto ou erro de segurança; zoom, restauração e overlay foram exercitados. As 17 tabelas permaneceram contidas no mobile. Não houve seção vazia, marcador técnico exposto, erro de console ou overflow horizontal global. Os temas Light, Dark e Sepia foram inspecionados, e Light e o viewport normal foram restaurados ao final.

**Revisão de conteúdo:** 67 correções jurídicas objetivas foram aplicadas com confronto do Código Civil e demais fontes oficiais vigentes. A revisão alcançou LINDB, pessoas naturais e jurídicas, bens, fatos jurídicos, obrigações, contratos, responsabilidade civil, coisas, família e sucessões. Também foram recompostas 21 estruturas visuais achatadas ou inválidas e removidos marcadores técnicos e Mermaid exposto como código.

**Restauração de integridade:** a comparação com o PDF e o Markdown de origem revelou blocos ausentes nos módulos publicados. O pipeline PYGEM/Vertex e LEIAUT foi executado sobre 12 recortes canônicos; 25 seções ausentes foram incorporadas de forma incremental, sem substituir ou remapear as 105 seções existentes. As novas seções abrangem domicílio, disposição do corpo, fundamentos dos fatos jurídicos, transmissão e extinção das obrigações, compra e venda, posse e o núcleo de sucessões.

**Persistência:** o preflight aprovou os 12 módulos e as 130 seções antes da escrita. A importação preservou as 105 identidades existentes e os 298 flashcards legados, adicionou 25 identidades permanentes novas sem flashcards e não removeu seção alguma. A reexportação final coincidiu semanticamente com os 12 payloads revisados em títulos, disciplina, ordem, conteúdo, callouts, mnemônicos, Mermaid e flashcards.

**Verificações:** 48 testes de conteúdo, lint, build Next.js 16 com webpack, auditoria de dependências sem vulnerabilidades, validação LEIAUT e segurança Mermaid aprovados. O código administrativo foi publicado na `main` no commit `41b6a5f`; o registro final desta revisão foi publicado em commit subsequente.

**Pendências editoriais:** nenhuma dentre as incorreções objetivamente comprovadas nesta revisão. Flashcards foram preservados, mas não revisados, conforme o protocolo.

### Direito Administrativo — 19 de setembro de 2026

**Comando de início do usuário:** `Plano de Revisão Visual e de Conteúdo dos Resumos disciplina: Direito Administrativo, caso ainda não tenha sido revisada. Após revisão funcional e visual, realizar revisão de correção do conteúdo.`

**Quantidade de resumos:** 19

**Quantidade de seções:** 184

**Estado:** concluída

| Grupo | Resumos | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---:|---:|---|---|---|---|---|
| Fundamentos, Administração Pública, poderes, atos e organização | 5 | 24 | [x] | N/A | [x] | Corrigidos jurisdição una, princípios, nepotismo, poderes, atos, decadência, entidades e terceiro setor. | Conteúdo, identidades e recursos persistidos e reexportados. |
| Serviços públicos, responsabilidade civil, controle e processo administrativo | 4 | 50 | [x] | N/A | [x] | Atualizados delegação, PPP, responsabilidade, prescrição, controle, recursos, revisão e o fluxo Mermaid inválido. | Diagrama corrigido sem fallback ou erro de console em desktop e mobile. |
| Bens, intervenção, LAI e agentes públicos | 4 | 40 | [x] | N/A | [x] | Corrigidos regime dos bens, desapropriação, custos da LAI e efeitos atuais do regime jurídico único. | Preflight e persistência integral aprovados. |
| Lei 8.112 e módulos históricos das Leis 8.666 e 10.520 | 4 | 35 | [x] | N/A | [x] | Corrigidos prazos e efeitos funcionais; o caráter histórico das leis revogadas foi explicitado sem alterar IDs. | Conteúdo vigente e contexto histórico conferidos. |
| Lei 14.133 e improbidade administrativa | 2 | 35 | [x] | N/A | [x] | Corrigidos critérios, sanções, prescrição e efeitos das ADIs 7.156/7.236; valores monetários deixaram de acionar KaTeX. | Texto monetário legível e sem KaTeX indevido nos três temas. |

**Consolidação visual e funcional:** as 19 rotas e 184 seções foram percorridas com sessão autenticada em desktop de 2560 × 1295 e mobile de 390 × 844. As 18 tabelas mantiveram rolagem horizontal interna, e os 20 mapas Mermaid foram conferidos; zoom, restauração e overlay funcionaram. Não houve imagem quebrada nem overflow horizontal global. Os temas Light, Dark e Sepia foram validados, e o tema Light e o viewport normal foram restaurados ao final.

**Correções visuais/funcionais:** o diagrama da seção “Fases do processo administrativo” foi reescrito com sintaxe Mermaid válida e conteúdo juridicamente corrigido. Os valores monetários da seção “Habilitação” passaram a escapar o caractere `$`, eliminando a interpretação indevida como KaTeX. O smoke corretivo confirmou SVG visível, ausência de fallback, ausência de “Syntax error in text”, zero erro novo no console e zero overflow global em desktop e mobile.

**Revisão de conteúdo:** 58 seções receberam correções objetivas, com confronto do PDF de origem, legislação compilada e jurisprudência oficial. Foram atualizados, entre outros pontos, processo administrativo, organização, serviços públicos, responsabilidade civil, controle, bens, intervenção, LAI, agentes, Lei 8.112, licitações, contratos e improbidade. Os módulos das Leis 8.666/1993 e 10.520/2002 foram preservados como históricos e claramente sinalizados.

**Persistência:** o preflight aprovou os 19 módulos e as 184 seções antes da escrita. A importação em lote preservou explicitamente os flashcards. A reexportação final coincidiu semanticamente com os 19 payloads revisados e confirmou as 184 identidades permanentes, a ordem e os 729 flashcards publicados. Flashcards não foram avaliados.

**Verificações:** 44 testes do contrato de conteúdo aprovados; TypeScript sem erros; lint dos scripts sem erros ou avisos; build Next.js 16.3.4 com webpack aprovado; auditoria de dependências sem vulnerabilidades; busca de sinks de XSS sem ocorrência nos arquivos novos. Checkpoint técnico: `56f7d77`.

**Backups:** `C:\PRO\agente\direito_administrativo_revisao\backups\2026-09-19-pre-revisao` e `C:\PRO\agente\direito_administrativo_revisao\backups\2026-09-19-pos-revisao`.

**Pendências editoriais:** nenhuma dentre as incorreções objetivamente comprovadas nesta revisão. Flashcards foram preservados, mas não revisados, conforme o protocolo.

### Análise de Balanços — 19 de setembro de 2026

**Comando de início do usuário:** `disciplina: Análise de Balanços — revisão funcional, visual e correção do conteúdo`

**Quantidade de resumos:** 4

**Quantidade de seções:** 4

**Estado:** concluída

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|
| Análise das Demonstrações Contábeis | `/resumos/analise-das-demonstracoes-contabeis` | 1 | [x] | N/A | N/A | Conteúdo confrontado com a fonte, sem incorreção material. | Rota, seção e identidade persistente validadas. |
| Análise Vertical (Análise de Estrutura) | `/resumos/analise-vertical-analise-de-estrutura` | 1 | [x] | N/A | N/A | Restaurada a hierarquia do demonstrativo e explicitados fórmula e valor-base. | Tabela e fórmula KaTeX validadas em desktop e mobile. |
| Análise Horizontal (Análise de Tendência ou de Evolução) | `/resumos/analise-horizontal-analise-de-tendencia-ou-de-evolucao` | 1 | [x] | N/A | N/A | Restaurados percentuais do período-base, hierarquia e distinção entre bases fixa e encadeada. | Tabela e duas fórmulas KaTeX validadas nos três temas. |
| Análise por Quocientes | `/resumos/analise-por-quocientes` | 1 | [x] | N/A | N/A | Corrigidos liquidez, solvência, margem operacional, ROA/ROI, payback e GAF; restaurada a equivalência com `ANC − RLP`. | Três tabelas e 19 fórmulas KaTeX validadas em desktop e mobile. |

**Consolidação visual e funcional:** as 4 rotas foram percorridas com sessão autenticada em desktop de 1440 × 900 e mobile de 390 × 844, nos temas Light, Dark e Sepia. As 5 tabelas permaneceram em contêineres com rolagem horizontal própria no mobile e os 22 blocos matemáticos foram renderizados em KaTeX sem código bruto. Não houve imagem quebrada, erro de renderização, erro de console ou overflow horizontal global. O tema Light e o viewport normal foram restaurados ao final.

**Inventário visual da fonte:** as 4 páginas do PDF contêm uma estrutura hierárquica de análise vertical, uma tabela de análise horizontal, três tabelas de quocientes e dois destaques textuais. A fonte não contém gráfico nem diagrama Mermaid; por isso, esses recursos não foram inventados.

**Revisão de conteúdo:** três dos quatro módulos receberam correções. Foram recompostas estruturas achatadas, restaurados dados omitidos do período-base e corrigidos os conceitos e fórmulas de liquidez, solvência, margem operacional, retorno, payback e grau de alavancagem financeira. Quando disponíveis, ativos e patrimônio líquido médios passaram a ser preferidos nos indicadores de retorno.

**Persistência:** o preflight aprovou os 4 módulos e as 4 seções antes da escrita. A importação em lote preservou explicitamente os flashcards; nenhum flashcard existia na disciplina. A reexportação final coincidiu semanticamente com os quatro payloads revisados e confirmou as quatro identidades permanentes, a ordem e o conteúdo integral das seções.

**Backups:** `C:\PRO\agente\analise_balancos\backups\2026-09-19-pre-revisao` e `C:\PRO\agente\analise_balancos\backups\2026-09-19-pos-revisao`.

**Pendências editoriais:** nenhuma dentre as incorreções objetivamente comprovadas nesta revisão. Não havia flashcards a revisar.

### Administração Pública — 19 de setembro de 2026

**Comando de início do usuário:** `disciplina: Administração Pública — revisão funcional, visual e correção do conteúdo`

**Quantidade de resumos:** 12

**Quantidade de seções:** 40

**Estado:** concluída

| Grupo | Resumos | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---:|---:|---|---|---|---|---|
| Administração pública, governança e governo eletrônico | 4 | 12 | [x] | N/A | [x] | Corrigidos DASP, diferenças público/privado, governança e referências atuais de governo digital. | Seções, mapas e tabelas do grupo validados em produção. |
| Transparência, accountability e políticas públicas | 2 | 15 | [x] | N/A | [x] | Atualizadas LAI, LRF, recursos, sanções, revisão do sigilo e ciclo de políticas públicas. | Seções, mapas e tabelas do grupo validados em produção. |
| Funções administrativas, pessoas e estruturas | 6 | 13 | [x] | N/A | [x] | Restauradas comparações e corrigidas simplificações sobre PODC, avaliação, motivação, planejamento e estruturas. | Seções, mapas, tabelas e fórmulas do grupo validados em produção. |

**Consolidação visual e funcional:** as 12 rotas e as 40 seções foram percorridas com sessão autenticada em desktop de 1440 × 900 e mobile de 390 × 844. Os 24 mapas Mermaid exibiram SVG e controles; zoom e visualização sobreposta foram exercitados. As 14 tabelas permaneceram em contêineres responsivos, e as 2 expressões KaTeX renderizaram sem código bruto. Não houve imagem quebrada, erro de renderização, erro de console ou overflow horizontal global. Os temas Light, Dark e Sepia foram inspecionados, e Light e o viewport normal foram restaurados ao final.

**Revisão de conteúdo:** 11 dos 12 payloads receberam correções editoriais ou normativas. Foram corrigidos a cronologia do DASP, generalizações sobre gestão pública e privada, conceitos de governança, referências históricas e atuais de governo digital, regras da LAI e da LRF, ciclo e avaliação de políticas públicas, PODC, vieses de avaliação, Maslow, Herzberg, McGregor, horizontes de planejamento, indicadores e estruturas organizacionais. Comparações achatadas foram recompostas em tabelas e fluxos relevantes foram representados em Mermaid.

**Persistência:** o preflight aprovou os 12 módulos e as 40 seções antes da escrita. A importação em lote preservou explicitamente os flashcards. A reexportação final confirmou os 12 tópicos, as 40 identidades permanentes, a ordem, os 24 mapas, as 14 tabelas, as 2 seções com KaTeX e os 120 flashcards publicados.

**Backups:** `C:\PRO\agente\administracao_publica\backups\2026-09-19-pre-revisao` e `C:\PRO\agente\administracao_publica\backups\2026-09-19-pos-revisao`.

**Ressalva taxonômica:** o próprio PDF passa a tratar conteúdos típicos de Administração Geral a partir do módulo 007, embora esses módulos estejam publicados em Administração Pública. A revisão preservou a classificação atual para não alterar navegação, IDs ou escopo sem decisão editorial explícita.

**Pendências editoriais:** nenhuma dentre as incorreções objetivamente comprovadas. A possível reclassificação dos módulos 007 a 012 é uma decisão taxonômica separada. Flashcards foram preservados, mas não revisados, conforme o protocolo.

### Administração Financeira e Orçamentária — 19 de setembro de 2026

**Comando de início do usuário:** `Plano de Revisão Visual e de Conteúdo dos Resumos disciplina: Administração Financeira e Orçamentária — Após revisão funcional e visual, realizar revisão de correção do conteúdo.`

**Quantidade de resumos:** 6

**Quantidade de seções:** 48

**Estado:** concluída

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid/mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|
| Tipos de Orçamento | `https://proconcursos.com.br/resumos/tipos-de-orcamento` | 5 | [x] | N/A | [x] | Corrigidos eficiência, cronologia do PART e a dinâmica autorizativa/impositiva. | 3 mapas, 2 tabelas e 5 seções validados em produção. |
| Orçamento Público – Constituição Federal e Lei 4.320 | `https://proconcursos.com.br/resumos/orcamento-publico-constituicao-federal-e-lei-4-320` | 18 | [x] | N/A | [x] | Atualizados princípios, PPA/LDO/LOA, CMO, controle, precatórios, não afetação, créditos e regime extraordinário. | 10 mapas, 4 tabelas e 7 fórmulas validados em produção. |
| Receita Pública | `https://proconcursos.com.br/resumos/receita-publica` | 9 | [x] | N/A | [x] | Corrigidas classificações, doações, dívida ativa, prescrição, estágios e a fórmula KaTeX corrompida. | 3 mapas, 3 tabelas e 2 fórmulas validados em produção. |
| Receita Pública na LRF | `https://proconcursos.com.br/resumos/receita-publica-na-lrf` | 3 | [x] | N/A | [x] | Removido exemplo controvertido do IGF e atualizados renúncia, diferimento e avaliação do art. 14-A. | 2 mapas e 3 seções validados em produção. |
| Despesa Pública | `https://proconcursos.com.br/resumos/despesa-publica` | 6 | [x] | N/A | [x] | Separados enfoques orçamentário e patrimonial; corrigidas classificações, RAP, DEA e suprimento de fundos. | 5 mapas, 2 tabelas e 2 fórmulas validados em produção. |
| Despesa Pública na LRF | `https://proconcursos.com.br/resumos/despesa-publica-na-lrf` | 7 | [x] | N/A | [x] | Atualizados DOCC, deduções, limites, revisão geral anual, nulidades e recondução da despesa com pessoal. | 1 mapa, 2 tabelas e 7 seções validados em produção. |

**Consolidação visual e funcional:** as 6 rotas e as 48 seções foram percorridas com sessão autenticada em desktop de 2560 × 1351 e em mobile de 390 × 844, nos temas Light, Dark e Sepia. Os 24 mapas Mermaid exibiram SVG e controles; zoom, restauração e overlay foram exercitados no componente compartilhado. As 13 tabelas permaneceram em contêineres responsivos e as 11 expressões KaTeX foram renderizadas sem código bruto. Não houve imagem quebrada, estado preso, erro de console ou overflow horizontal global. O tema Light e o viewport normal foram restaurados ao final.

**Correções visuais/funcionais:** reparados dois diagramas com aspas inválidas, seis relações Mermaid que tratavam alternativas como sequência, uma tabela inconsistente, HTML bruto incompatível com o renderizador seguro e uma fórmula de Dívida Ativa com caracteres TAB no lugar de comandos `\text`. O smoke corretivo confirmou a fórmula semântica em KaTeX e os novos diagramas em produção.

**Revisão de conteúdo:** 38 das 48 seções receberam ajustes editoriais ou normativos em relação ao backup inicial. A conferência usou Constituição compilada, Lei 4.320/1964, LRF vigente, CTN, Resolução 1/2006-CN, MCASP 11, MTO 2026, julgados oficiais do STJ e manuais do TCU. Foram corrigidos, entre outros pontos, universalidade, PPA/LDO/LOA, competências da CMO, não afetação e IBS, dívida ativa, renúncia do art. 14-A, RAP, DEA, suprimento de fundos, limites e controle da despesa com pessoal.

**Persistência:** o preflight administrativo aprovou os 6 módulos e as 48 seções antes da escrita. A importação em lote usou preservação explícita dos flashcards e atualizou as unidades existentes. A reexportação final coincidiu integralmente com os seis payloads revisados; os 48 `section_id`, `content_unit_id` e `stable_key`, a ordem e os 100 flashcards publicados permaneceram idênticos ao backup inicial. Flashcards não foram avaliados.

**Backups:** `C:\PRO\agente\afo_revisao\backups\2026-09-19-pre-revisao` e `C:\PRO\agente\afo_revisao\backups\2026-09-19-final`.

**Pendências editoriais:** nenhuma dentre as incorreções objetivamente comprovadas nesta revisão. Flashcards permaneceram fora do escopo, conforme o protocolo.
