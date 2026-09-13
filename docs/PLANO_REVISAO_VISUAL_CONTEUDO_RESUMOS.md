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
| [ ] | Administração de Recursos Materiais | [ ] | [ ] | — |
| [ ] | Administração Financeira e Orçamentária | [ ] | [ ] | — |
| [ ] | Administração Geral | [ ] | [ ] | — |
| [ ] | Administração Pública | [ ] | [ ] | — |
| [ ] | Análise de Balanços | [ ] | [ ] | — |
| [ ] | Auditoria | [ ] | [ ] | — |
| [ ] | Contabilidade de Custos | [ ] | [ ] | — |
| [ ] | Contabilidade Geral e Avançada | [ ] | [ ] | — |
| [ ] | Direito Administrativo | [ ] | [ ] | — |
| [ ] | Direito Civil | [ ] | [ ] | — |
| [x] | Direito Constitucional | [ ] | [x] | 15 resumos e 105 seções revisados; 64 correções jurídicas aplicadas em 30 seções; persistência integral confirmada no Supabase. |
| [ ] | Direito da Pessoa com Deficiência | [ ] | [ ] | — |
| [ ] | Direito do Trabalho | [ ] | [ ] | — |
| [ ] | Direito Eleitoral | [ ] | [ ] | — |
| [ ] | Direito Empresarial | [ ] | [ ] | — |
| [x] | Direito Penal | [ ] | [x] | 3 resumos e 43 seções revisados; 18 correções jurídicas/editoriais aplicadas em 9 seções; persistência integral confirmada no Supabase. |
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

**Quantidade de seções:** 43

**Estado:** concluída

| Resumo | URL | Seções | Visual/conteúdo | Gráficos | Mermaid | Mapas mentais | Observação e ação | Evidência final |
|---|---|---:|---|---|---|---|---|---|
| Da Lei Penal | `https://proconcursos.com.br/resumos/da-lei-penal` | 4 | [x] | N/A | [x] | [x] | Conteúdo confrontado com a Parte Geral do Código Penal; nenhuma incorreção objetiva remanescente identificada. | 4 seções presentes; 1 mapa renderizado; 2 tabelas responsivas; sem overflow. |
| Do Crime | `https://proconcursos.com.br/resumos/do-crime` | 18 | [x] | N/A | [x] | [x] | Corrigida a fonte normativa do critério legal de infração penal. | 18 seções presentes; 1 mapa renderizado; 2 tabelas responsivas; sem conteúdo bruto. |
| Parte Especial do Código Penal | `https://proconcursos.com.br/resumos/parte-especial-do-codigo-penal` | 21 | [x] | N/A | [x] | [x] | Atualizados feminicídio, vicaricídio, lesão corporal, art. 122 e dispositivos dos arts. 158, 311 e 311-A; corrigidas tabela e comunicação falsa à PM. | 21 seções presentes; 1 mapa renderizado; 2 tabelas responsivas; zoom e overlay aprovados. |

**Consolidação:** os 3 resumos e as 43 seções foram percorridos integralmente em produção, sem avaliar flashcards. Foram identificados 3 mapas Mermaid e 6 tabelas; não houve código Mermaid bruto, erro persistente, seção vazia, imagem visível quebrada ou overflow global em desktop e no viewport de 390 × 844.

**Correções visuais/funcionais:** corrigidos no próprio conteúdo uma célula vazia e separadores textuais indevidos em tabela. A estrutura da aplicação não exigiu alteração. O zoom, a restauração e o overlay do mapa mental funcionaram, e o viewport padrão foi restaurado ao final.

**Revisão jurídica corretiva:** foram aplicadas 18 substituições controladas em 9 seções. A revisão usou o Código Penal compilado oficial e alcançou apenas afirmações objetivamente desatualizadas, incorretas ou truncadas, sem uniformizar controvérsias doutrinárias.

**Persistência:** a atualização parcial gravou exclusivamente `content_markdown` e `callouts`, com conferência otimista antes da primeira escrita. Flashcards, mapas Mermaid, mnemônicos, títulos, IDs e ordem das seções foram preservados. A leitura posterior confirmou correspondência exata das 43 seções com os payloads esperados.

**Pendências editoriais:** nenhuma dentre os erros encontrados nesta revisão. Flashcards permaneceram integralmente fora do escopo, inclusive quando possam repetir redações anteriores à atualização legislativa.
