# Plano operacional de revisão — orquestração por agentes IA

Versão 2 — atualização documental de 18/11/2026. Público exclusivo: agentes de orquestração, execução e verificação. Este documento é o ponto de entrada para retomar o programa sem acesso ao chat. Não certifica a qualidade integral do acervo.

## 1. Objetivo, escopo e ambientes

Revisar todas as 54 disciplinas de PRO Resumos: textos, exemplos, cálculos, tabelas, callouts, mnemônicos, flashcards e diagramas. Identificar e tratar erros, discrepâncias, desatualizações, redundâncias e omissões justificadas. Conferir apresentação e funcionamento nos temas Light, Dark e Sepia, em desktop e celular.

Fora do escopo: banco de questões, corpus PRO Legis e funcionalidades alheias à revisão. Dependência técnica nesses módulos exige justificativa concreta e autorização aplicável. Não inventar fontes, evidências ou credenciais editoriais. Consultar fontes primárias atuais a cada iteração e registrar a data real; não prometer atualização permanente.

| Local | Papel |
|---|---|
| `C:\PRO\AGENTS.md` | Instruções canônicas; leitura obrigatória antes da implementação. |
| `C:\PRO\revisoes-resumos` | Repositório editorial: plano, fila, relatórios, snapshots, propostas e evidências. Sem remoto configurado na última conferência. |
| `C:\PRO\site` | Aplicação e CLI; há mudanças locais preexistentes de outros trabalhos. |
| `C:\PRO\site\scripts\content-admin.mjs` | Importador existente; inspecionar comandos, contratos e validadores antes de usar. |
| `C:\PRO\worktrees\publicacao-afo-20261117` | Worktree de publicação documental; conferir limpeza, branch e origin/main antes de reutilizar. |
| `https://proconcursos.com.br/resumos` | Produção; teste de aluno exige sessão autorizada. |

Caminhos relativos abaixo partem do repositório editorial. Inventário: `inventario.json`. Fila curta: `disciplinas.txt`. Relatórios vigentes: `01-administracao-de-recursos-materiais.md` e `02-administracao-financeira-e-orcamentaria.md`. Não usar arquivos 02 para corrigir ARM nem arquivos 01 para corrigir AFO.

## 2. Protocolo de entrada e hierarquia das evidências

1. Ler instruções aplicáveis e executar git status/diff nos repositórios afetados. Preservar mudanças alheias; não executar cargas ou coletores automaticamente.
2. Ler este plano, disciplinas.txt, o topo vigente do relatório da disciplina e suas evidências. Pareceres históricos descrevem o estado da época.
3. Conferir tarefas em andamento e arquivos não rastreados antes de assumir o escopo. Registrar responsável, arquivos reservados, entradas/hashes, saída esperada e checkpoint.
4. Para fatos, preferir evidência recuperável e datada: snapshot/recibo, conteúdo atual, fontes e resultados brutos. Em conflito, registrar e apurar, sem apagar o histórico.
5. Revalidar inventário ativo em leitura antes de iniciar cada disciplina. As contagens abaixo não são um novo censo do banco.

## 3. Progresso consolidado e limites conhecidos

**54 disciplinas, 543 tópicos ativos: 0 encerradas [x], 37 em estado parcial [~] (sendo 11 disciplinas com conteúdo revisadas/reconciliadas no banco + 6 em andamento + 20 disciplinas sem seções no acervo documentadas) e 17 aguardando ondas seguintes [ ].** As contagens de seções/componentes de ARM/AFO são das evidências já registradas, sem nova consulta nesta atualização.

| Frente | Estado sustentado | Limite / próximo trabalho |
|---|---|---|
| ARM (`01`) | Iteração 015 **aplicada e reconciliada no Supabase** (`f48ec8e`, `aplicacao-015-reconciliacao.json`): 34 seções ativas (33 originais + 1 adição de lacuna em `movimentacao-e-transporte-de-materiais`), 15 diagramas; 89/89 propostas verificadas às cegas; 32 edições em 18 seções aplicadas (sanados os 11 erros KaTeX/controle); validação visual 3 temas (90 renders DOM + 60 PNGs + 11/11 asserções interativas); `exactParityWithApprovedProposal: true`. | Pendente apenas conferência autenticada em produção (`[~]` mantido). |
| AFO (`02`) | Iteração 015 **aplicada e reconciliada no Supabase** (`f48ec8e`, `aplicacao-015-reconciliacao.json`): 50 seções ativas (48 originais + 2 adições LRF em `lei-de-responsabilidade-fiscal-lrf-lc-101`), 26 diagramas, 100 cartões (cartão índice 1 de `despesa-publica-sec-05` corrigido `CERTO` → `ERRADO` via CAS atômico); 108/108 propostas verificadas às cegas; 30 edições em 21 seções; validação visual DOM/KaTeX aprovada; `exactParityWithApprovedProposal: true`. | Pendente apenas conferência autenticada em produção (`[~]` mantido). |
| Coleta e auditoria `03–54` (`043a0a4`) | Fotografias `03` a `54` coletadas (`snapshot.sha256`), auditoria determinística AST/KaTeX/Mermaid gerada (`orquestracao-03-54/auditoria-deterministica-03-54.json`), **20 disciplinas sem seções ativas (`secs: 0`)** cruzadas com o acervo e documentadas em seus relatórios `NN-slug.md`; 32 disciplinas ativas particionadas em 7 ondas (`W1` a `W7`, 169 lotes). | Concluir ondas `W2` a `W7` para as disciplinas com conteúdo ativo. |
| Onda 1 (`03, 04, 06, 07, 09, 11` — saneamento aplicado e reconciliado em `2026-11-19`) | Entrega `25ee3cc` saneada: **saneamento completo aplicado e reconciliado no Supabase de produção** sob commit `ae74b76`, manifesto imutável `manifesto-saneamento-onda1.json` (`2d74a661...`, exatamente `36` operações atômicas: `6` seções + `5` CAS flashcards + `25` metadados) via `aplicar_e_reverter_saneamento_onda1.mjs --apply` (run ID `aplicacao-2026-11-19T02-11-09-642Z-4c6b938f`, 36 linhas afetadas, 0 indeterminadas); pós-reconciliação independente via `reconciliar_onda1_completo.mjs --target=saneado` (run ID `reconciliacao-saneado-2026-11-19T02-11-39-497Z-6c60f61b`) com **`exactFullParity: true`** sobre os `82` tópicos e `235` seções ativas no banco; suíte visual **167/167 (`0` falhas)** em `1200px`/`375px` × 3 temas. | Pendente apenas sessão autenticada em produção (`https://proconcursos.com.br/resumos`) e decisão sobre tópicos vazios legados (`[~]` mantido). |
| Onda 2 (`12` e `15` — `8499cf8`) | **100% revisada, verificada às cegas, aplicada e reconciliada no Supabase:** `27/27` lotes (`326/326` seções lidas: `142` em `12` + `184` em `15`); **274 veredictos confirmados** (`39` em `12` + `235` em `15`); **291 edições aplicadas em 121 seções** (`42` em `29` seções de `12` + `249` em `92` seções de `15`, com `rejectedEditsCount: 0` e `remainingDetErrors: []`), incluindo **60 seções** com atualização cirúrgica CAS de flashcards (`6` em `12` + `54` em `15`); `exactParity: true`; validação visual React real nos 3 temas (`light`, `dark`, `sepia`) com **315/315 renders DOM aprovados (`0` falhas)**. | Pendente apenas conferência autenticada em produção (`[~]` mantido). |
| Onda 3 (`17` — `b55b110`) | **100% revisada, verificada às cegas, aplicada e reconciliada no Supabase:** `12/12` lotes (`130/130` seções lidas de `17. Direito Civil`); **76/76 achados confirmados** (`14/14` tarefas de verificação cega sem falhas); **81 edições aplicadas em 40 seções** em `12` tópicos editoriais (`rejectedEditsCount: 0`, `remainingDetErrors: []`), incluindo **18 seções** com atualização cirúrgica CAS de flashcards; `exactParity: true`; validação visual React real nos 3 temas com **78/78 renders DOM aprovados (`0` falhas)**. | Pendente apenas conferência autenticada em produção (`[~]` mantido). |
| Onda 4 (`18–23` — 100% revisada, verificada às cegas, validada em dry-run e visual) | **Retomada e concluída integralmente em ambiente local:** `33/33` lotes lidos (`358/358` seções de Constitucional, Pessoa com Deficiência, Trabalho, Eleitoral, Empresarial e Penal); **181 achados brutos + 2 determinísticos** verificados às cegas com confronto em fontes primárias (`179` confirmados, `2` parcialmente confirmados, `1` refutado, `1` inconclusivo); **186 edições preparadas em 107 seções**; `cliDryRunOk: true` e `remainingDetErrors: []` em todas as 6 disciplinas; pacote de adição em `18` (`+2` seções de Nacionalidade e Direitos Políticos, EC nº 131/2023) revisado e aprovado em `import` dry-run; validação visual aprovada em **186/186 renders (`0` falhas)** nos 3 temas. | Aguardando autorização para aplicação em produção (`--apply`) sob manifesto imutável e testes com sessão autenticada (`[~]` mantido). |
| Ondas 5–7 (`25–52`) e Adições de lacunas | Fotografia coletada e lotes preparados; **5 pacotes de adição** para lacunas reais das Ondas 5 e 7 (`25-direito-previdenciario`, `39-informatica` ×3 e `51-portugues`) já elaborados em `orquestracao-03-54/adicoes/` e aprovados em `import --dry-run`. | Aguardando retomada após conclusão da Onda 4. |
| Recibos e rastreabilidade 015 | `recibo-comparacao-arm-afo-2026-11-17.json` (`f34978cc...`), `estado-atual-2026-11-17.json` (`6f934456...`), `aplicacao-015-antes.json`, `aplicacao-015-reconciliacao.json`, `censo-197-achados.json`, `matriz-8-topicos-vazios.json` e `evidencias-iteracao-015/resultados-brutos-015.json` versionados e preservados. | Conferência autenticada em produção (`https://proconcursos.com.br/resumos`) permanece bloqueada sem sessão de aluno. |

Ler: `iteracao-014/ESTADO_ITERACAO_014.md`, `iteracao-014/resultados_revisao_bruto.json`, `iteracao-014/resultados_verificacao_bruto.json`, `iteracao-014/achados_trecho_nao_localizado.json`, `revalidar-arm-afo.mjs`, `APLICACAO_AFO_2026-11-17.md` e `aplicacao-afo-reconciliacao.json`.

## 4. Fila completa e progresso por disciplina

Legenda: `[ ]` não iniciada; `[~]` parcial; `[x]` encerrada conforme seção 9. Quantidades de tópicos: coleta de 15/11/2026. “Não iniciada” significa ausência de revisão formal comprovada neste programa, não ausência de conteúdo.

| Ordem | Disciplina | Tópicos | Revisão | Progresso documentado | Próxima ação |
|---|---|---|---|---|---|
| 01 | Administração de Recursos Materiais | 11 | [~] parcial | 34 seções (33 + 1 adição); 15 diagramas; 89 propostas verificadas às cegas; 32 edições aplicadas e reconciliadas no banco; visual 3 temas aprovado (60 PNGs) | Pendente apenas sessão autenticada em produção |
| 02 | Administração Financeira e Orçamentária | 12 | [~] parcial | 50 seções (48 + 2 adições LRF); 26 diagramas; 100 cartões (1 corrigido via CAS); 108 propostas verificadas às cegas; 30 edições aplicadas e reconciliadas no banco | Pendente apenas sessão autenticada em produção |
| 03 | Administração Geral | 13 | [~] parcial | 54/54 seções lidas; +1 seção(ões) adicionada(s); 120 cartões; 22 diagramas; 9 edições em 9 seções reconciliadas no banco; visual 75/75 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Pendente apenas sessão autenticada em produção |
| 04 | Administração Pública | 15 | [~] parcial | 40/40 seções lidas; 120 cartões; 24 diagramas; 8 edições em 7 seções reconciliadas no banco; visual 78/78 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Pendente apenas sessão autenticada em produção |
| 05 | Agências Reguladoras e Regulação | 5 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 5 tópicos vazios registrada em `05-agencias-reguladoras-e-regulacao.md` | Aguardar autoria/importação futura de conteúdo |
| 06 | Análise de Balanços | 4 | [~] parcial | 4/4 seções lidas; 0 cartões; 0 diagramas; 1 edições em 1 seções reconciliadas no banco; visual 9/9 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Pendente apenas sessão autenticada em produção |
| 07 | Arquivologia | 16 | [~] parcial | 29/29 seções lidas; +1 seção(ões) adicionada(s); 0 cartões; 6 diagramas; 15 edições em 9 seções reconciliadas no banco; visual 18/18 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Pendente apenas sessão autenticada em produção |
| 08 | Atualidades | 8 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 8 tópicos vazios registrada em `08-atualidades.md` | Aguardar autoria/importação futura de conteúdo |
| 09 | Auditoria | 24 | [~] parcial | 76/76 seções lidas; 159 cartões; 12 diagramas; 42 edições em 23 seções reconciliadas no banco; visual 39/39 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Pendente apenas sessão autenticada em produção |
| 10 | Conhecimentos Bancários | 10 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 10 tópicos vazios registrada em `10-conhecimentos-bancarios.md` | Aguardar autoria/importação futura de conteúdo |
| 11 | Contabilidade de Custos | 10 | [~] parcial | 30/30 seções lidas; 120 cartões; 8 diagramas; 41 edições em 16 seções reconciliadas no banco; visual 39/39 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Pendente apenas sessão autenticada em produção |
| 12 | Contabilidade Geral e Avançada | 32 | [~] parcial | 142/142 seções lidas; 120 cartões; 24 diagramas; 42 edições em 29 seções reconciliadas no banco; visual 231/231 renders OK | Pendente apenas sessão autenticada em produção |
| 13 | Contabilidade Pública | 5 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 5 tópicos vazios registrada em `13-contabilidade-publica.md` | Aguardar autoria/importação futura de conteúdo |
| 14 | Controle Externo | 8 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 8 tópicos vazios registrada em `14-controle-externo.md` | Aguardar autoria/importação futura de conteúdo |
| 15 | Direito Administrativo | 25 | [~] parcial | 184/184 seções lidas; 729 cartões; 20 diagramas; 249 edições em 92 seções reconciliadas no banco; visual 84/84 renders OK | Pendente apenas sessão autenticada em produção |
| 16 | Direito Ambiental | 10 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 10 tópicos vazios registrada em `16-direito-ambiental.md` | Aguardar autoria/importação futura de conteúdo |
| 17 | Direito Civil | 12 | [~] parcial | 130/130 seções lidas; 298 cartões; 26 diagramas; 81 edições em 40 seções reconciliadas no banco; visual 78/78 renders OK | Pendente apenas sessão autenticada em produção |
| 18 | Direito Constitucional | 16 | [~] parcial | Onda 4 revisada localmente: 105/105 seções lidas; 70 achados (72 confirmados); dry-run OK (72 edições em 29 seções); visual 33/33 renders OK; +2 seção(ões) de lacuna em dry-run (1 pacote(s)) | Aguardando autorização para aplicação em produção (--apply) sob manifesto imutável |
| 19 | Direito da Pessoa com Deficiência | 4 | [~] parcial | Onda 4 revisada localmente: 12/12 seções lidas; 8 achados (8 confirmados); dry-run OK (10 edições em 4 seções); visual 6/6 renders OK | Aguardando autorização para aplicação em produção (--apply) sob manifesto imutável |
| 20 | Direito do Trabalho | 15 | [~] parcial | Onda 4 revisada localmente: 50/50 seções lidas; 21 achados (20 confirmados); dry-run OK (21 edições em 15 seções); visual 60/60 renders OK | Aguardando autorização para aplicação em produção (--apply) sob manifesto imutável |
| 21 | Direito Eleitoral | 9 | [~] parcial | Onda 4 revisada localmente: 58/58 seções lidas; 31 achados (31 confirmados); dry-run OK (32 edições em 24 seções); visual 42/42 renders OK | Aguardando autorização para aplicação em produção (--apply) sob manifesto imutável |
| 22 | Direito Empresarial | 3 | [~] parcial | Onda 4 revisada localmente: 29/29 seções lidas; 8 achados (8 confirmados); dry-run OK (8 edições em 6 seções); visual 12/12 renders OK | Aguardando autorização para aplicação em produção (--apply) sob manifesto imutável |
| 23 | Direito Penal | 7 | [~] parcial | Onda 4 revisada localmente: 104/104 seções lidas; 43 achados (42 confirmados); dry-run OK (43 edições em 29 seções); visual 33/33 renders OK | Aguardando autorização para aplicação em produção (--apply) sob manifesto imutável |
| 24 | Direito Penal Militar | 4 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 4 tópicos vazios registrada em `24-direito-penal-militar.md` | Aguardar autoria/importação futura de conteúdo |
| 25 | Direito Previdenciário | 21 | [ ] não iniciada | Fotografia coletada (59 seções, 0 cartões, 23 diagramas); +1 seção(ões) de lacuna em dry-run (1 pacote(s)) | Executar Onda 5 (ciclo D02–D08) |
| 26 | Direito Processual Civil | 17 | [ ] não iniciada | Fotografia coletada (91 seções, 0 cartões, 35 diagramas) | Executar Onda 5 (ciclo D02–D08) |
| 27 | Direito Processual do Trabalho | 7 | [ ] não iniciada | Fotografia coletada (20 seções, 0 cartões, 11 diagramas) | Executar Onda 5 (ciclo D02–D08) |
| 28 | Direito Processual Penal | 19 | [ ] não iniciada | Fotografia coletada (81 seções, 0 cartões, 12 diagramas) | Executar Onda 5 (ciclo D02–D08) |
| 29 | Direito Processual Penal Militar | 4 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 4 tópicos vazios registrada em `29-direito-processual-penal-militar.md` | Aguardar autoria/importação futura de conteúdo |
| 30 | Direito Tributário | 21 | [ ] não iniciada | Fotografia coletada (306 seções, 828 cartões, 106 diagramas) | Executar Onda 6 (ciclo D02–D08) |
| 31 | Direitos Humanos | 9 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 9 tópicos vazios registrada em `31-direitos-humanos.md` | Aguardar autoria/importação futura de conteúdo |
| 32 | Enfermagem | 5 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 5 tópicos vazios registrada em `32-enfermagem.md` | Aguardar autoria/importação futura de conteúdo |
| 33 | Engenharia Florestal | 2 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 2 tópicos vazios registrada em `33-engenharia-florestal.md` | Aguardar autoria/importação futura de conteúdo |
| 34 | Estatística | 4 | [ ] não iniciada | Fotografia coletada (8 seções, 0 cartões, 1 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 35 | Ética no Serviço Público | 4 | [ ] não iniciada | Fotografia coletada (19 seções, 0 cartões, 5 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 36 | Finanças Públicas | 1 | [ ] não iniciada | Fotografia coletada (7 seções, 0 cartões, 4 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 37 | Física | 9 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 9 tópicos vazios registrada em `37-fisica.md` | Aguardar autoria/importação futura de conteúdo |
| 38 | Geografia | 10 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 10 tópicos vazios registrada em `38-geografia.md` | Aguardar autoria/importação futura de conteúdo |
| 39 | Informática | 15 | [ ] não iniciada | Fotografia coletada (52 seções, 0 cartões, 11 diagramas); +3 seção(ões) de lacuna em dry-run (3 pacote(s)) | Executar Onda 7 (ciclo D02–D08) |
| 40 | Legislação Aduaneira | 5 | [ ] não iniciada | Fotografia coletada (31 seções, 0 cartões, 19 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 41 | Legislação Aplicada à EBSERH | 7 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 7 tópicos vazios registrada em `41-legislacao-aplicada-a-ebserh.md` | Aguardar autoria/importação futura de conteúdo |
| 42 | Legislação de Trânsito | 11 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 11 tópicos vazios registrada em `42-legislacao-de-transito.md` | Aguardar autoria/importação futura de conteúdo |
| 43 | Legislação do SUS | 10 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 10 tópicos vazios registrada em `43-legislacao-do-sus.md` | Aguardar autoria/importação futura de conteúdo |
| 44 | Legislação Municipal | 4 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 4 tópicos vazios registrada em `44-legislacao-municipal.md` | Aguardar autoria/importação futura de conteúdo |
| 45 | Legislação Penal Especial | 36 | [ ] não iniciada | Fotografia coletada (112 seções, 0 cartões, 51 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 46 | Língua Inglesa | 6 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 6 tópicos vazios registrada em `46-lingua-inglesa.md` | Aguardar autoria/importação futura de conteúdo |
| 47 | Macroeconomia | 1 | [ ] não iniciada | Fotografia coletada (20 seções, 0 cartões, 14 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 48 | Matemática | 4 | [ ] não iniciada | Fotografia coletada (2 seções, 0 cartões, 1 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 49 | Matemática Financeira | 4 | [ ] não iniciada | Fotografia coletada (2 seções, 0 cartões, 1 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 50 | Microeconomia | 1 | [ ] não iniciada | Fotografia coletada (27 seções, 0 cartões, 13 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 51 | Português | 10 | [ ] não iniciada | Fotografia coletada (37 seções, 170 cartões, 12 diagramas); +1 seção(ões) de lacuna em dry-run (1 pacote(s)) | Executar Onda 7 (ciclo D02–D08) |
| 52 | Raciocínio Lógico | 4 | [ ] não iniciada | Fotografia coletada (6 seções, 0 cartões, 1 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 53 | Relações Humanas e Atendimento | 6 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 6 tópicos vazios registrada em `53-relacoes-humanas-e-atendimento.md` | Aguardar autoria/importação futura de conteúdo |
| 54 | Vendas e Negociação | 8 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 8 tópicos vazios registrada em `54-vendas-e-negociacao.md` | Aguardar autoria/importação futura de conteúdo |

## 5. Tarefas imediatas de recuperação e encerramento

Todos os itens permanecem abertos neste plano até aceite documentado. Trabalhar ARM antes de AFO, com saídas separadas; antecipação de erro crítico de AFO exige prioridade explícita registrada. Não repetir workflows inteiros sem examinar saídas existentes.

| ID | Escopo / tarefa | Saída e critério de aceite |
|---|---|---|
| R01 | Ambas: reconciliar trabalho concorrente e a 015 | **Concluída (015):** arquivos reconciliados e versionados em `propostas-iteracao-015/` e `evidencias-iteracao-015/`. |
| R02 | Ambas: salvar revalidação corrigida | **Concluída (015):** `recibo-comparacao-arm-afo-2026-11-17.json` salvo com SHA-256 e `missingInLocalPayload`, preservando `estado-atual-2026-11-17.json`. |
| R03 | AFO: tratar os dois problemas internos identificados | **Concluída e aplicada (015 / `f48ec8e`):** flashcard índice 1 de `despesa-publica-sec-05` (`CERTO` → `ERRADO` via CAS) e nota ¹ de `receita-publica-sec-09` corrigidos e reconciliados no banco. |
| R04 | Ambas: verificar as 197 alegações | **Concluída (015):** `censo-197-achados.json` com verificação cega integral (77 confirmados, 4 parciais, 116 refutados, 0 inconclusivos; 42/42 trechos localizados manualmente). |
| R05 | ARM: cálculos/coerência; AFO: rastreabilidade normativa | **Concluída (015):** `registro-81-secoes.json` e `auditar_propostas_015.mjs` (81/81 seções lidas, 96 nós KaTeX com 0 erros e 0 caracteres de controle, cálculos e normas 2025/2026 conferidos). |
| R06 | Ambas: cobertura dos oito tópicos vazios e omissões internas | **Concluída e aplicada (`f48ec8e`):** `matriz-8-topicos-vazios.json` com os 8 IDs exatos + 2 pacotes (`01-arm-movimentacao-e-transporte-de-materiais` e `02-afo-lei-de-responsabilidade-fiscal-lrf-lc-101`) aplicados e reconciliados no banco. |
| R07 | Ambas: visual local e produção | **Parcial (local concluída, produção bloqueada por sessão):** `resultados-brutos-015.json` com 11/11 asserções interativas, 132/132 renders DOM de diagramas, 78/78 renders KaTeX e 63 PNGs; falta conferência autenticada em produção. |
| R08 | Ambas: preparar delta e validar | **Concluída (015):** `delta-completo-antes-depois.json` (62 edições), pré-imagens/manifestos SHA-256, dry-runs `import-batch --preserve-flashcards` e `atualizar-flashcard-cirurgico.mjs` aprovados. |
| R09 | Ambas: aplicar delta autorizado e reconciliar | **Concluída e reconciliada (`f48ec8e`):** após autorização do usuário para execução autônoma integral, aplicado delta completo (`aplicacao-015-antes.json` → `aplicacao-015-reconciliacao.json`) com `exactParityWithApprovedProposal: true` e `personalPreserved: true`. |
| R10 | Encerrar cada disciplina e liberar próxima | **Onda 1 saneada e reconciliada no banco (`5e1bdd8`); Onda 4 100% revisada localmente, verificada às cegas, validada em dry-run e visual (`0` falhas):** ARM e AFO mantidas `[~]` apenas pela etapa autenticada em produção; **Onda 1 (`03, 04, 06, 07, 09, 11` — `5e1bdd8`)** com saneamento aplicado e reconciliado em produção sob commit `ae74b76` (36 operações atômicas confirmadas, `exactFullParity: true` sobre 82 tópicos e 235 seções); **Onda 2 (`12, 15` — `8499cf8`)** e **Onda 3 (`17` — `b55b110`)** reconciliadas no banco; **20 disciplinas sem seções documentadas (`043a0a4`)**; **Onda 4 (`18–23`)** com 33/33 lotes (358 seções) concluídos, 181 achados verificados (179 confirmados), 186 edições preparadas em 107 seções, dry-run CLI aprovado e validação visual de 186/186 renders aprovada em 3 temas, aguardando autorização para aplicação em produção sob manifesto imutável. |

Tópicos vazios conhecidos: ARM `gestao-de-estoques-e-reposicao`, `movimentacao-e-transporte-de-materiais`; AFO `creditos-adicionais`, `despesa-publica-etapas-e-estagios`, `lei-de-responsabilidade-fiscal-lrf-lc-101`, `planejamento-e-leis-orcamentarias-ppa-ldo-loa`, `principios-orcamentarios`, `receita-publica-classificacoes-e-estagios`.

## 6. Regras para o orquestrador e seus executores

O orquestrador consolida o estado, decide o aceite e coordena gravações. Delegar apenas quando autorizado e suportado pelo ambiente; este plano não substitui essas condições. Distribuir lotes limitados por tópico/disciplina, preferindo execução somente leitura e saídas exclusivas. Apenas um executor escreve cada arquivo compartilhado; plano, fila e changelog são consolidados pelo orquestrador.

Registrar cada tarefa no relatório da iteração: ID, disciplina/IDs, responsável, entradas/hashes, saída, estado, dependências e próximo checkpoint. Estados: `pendente → em execução → em verificação → concluída`; `bloqueada` exige motivo concreto e condição de retomada. Tarefa concluída não encerra automaticamente disciplina. Revalidar hashes antes de integrar propostas.

Separar proposta, verificação e decisão. Para verificação cega, fornecer primeiro trecho e pergunta; registrar solução com fontes antes de revelar a sugestão. Sugestão no fim do mesmo prompt não torna a verificação cega. Outro agente/modelo também precisa de evidência recuperável; o rótulo “confirmado” não basta.

Falha de cota não impede trabalho direto independente. Registrar a falha, reduzir o lote ou continuar a verificação pelo orquestrador. Não contornar limites nem repetir automaticamente o workflow. Salvar cada tentativa em arquivo novo; preservar recibos de falha e sucesso.

## 7. Ciclo padrão D01–D08 para todas as disciplinas

| Etapa | Execução | Saída mínima |
|---|---|---|
| D01 — diagnóstico | Conferir inventário ativo, IDs e estado atual em leitura; preservar fotografia anterior. | Novo snapshot/hash, população e componentes existentes. |
| D02 — cobertura | Enumerar e ler todas as seções/componentes, distinguindo leitura de verificação. | Matriz por seção; amostras identificadas como tais. |
| D03 — verificação | Conferir conceitos, vigência, âmbito, cálculos, prazos, percentuais, exceções e coerência. | Fontes primárias atuais, dispositivos/datas e vereditos; divergências doutrinárias sinalizadas. |
| D04 — completude | Mapear omissões e redundâncias contra referência explícita; procurar cobertura em outros tópicos. | Matriz de lacunas; editais/referências identificados; sem promessa de cobertura universal. |
| D05 — proposta | Corrigir localmente apenas o demonstrado, com escopo mínimo e IDs preservados. | Antes/depois, fontes e proposta separada; adições fundamentadas. |
| D06 — validação | Validar contrato/JSON, dry-runs e componentes afetados; testar visual local e sessão autorizada. | Resultados reais e cobertura por combinação de tema/viewport; limites declarados. |
| D07 — aplicação | Cumprir seção 8, reler estado antes de escrever e reconciliar depois. | Pré-imagem, autorização aplicável, recibo e resultado publicado, ou “não necessária”. |
| D08 — fechamento | Avaliar seção 9; atualizar documentos e checkpoints. | Aceite ou pendências exatas; próximo prompt e estado Git/publicação. |

Criar relatório `NN-slug-da-disciplina.md` ao iniciar cada disciplina 03–54, com snapshot e propostas próprios. Não criar relatórios vazios para simular progresso. Nomes e IDs vêm do inventário atual. Mudanças de código exigem documentação Next local e verificações proporcionais quando aplicável; mudança apenas documental não exige nova carga nem testes da aplicação inteira.

## 8. Contratos, autorização e publicação

Preservar topic_id, section_id, content_unit_id, stable_key e contratos do importador. Avaliar chave composta no escopo correto. Não alterar .env, credenciais, autenticação, RLS ou dados de aluno para viabilizar a revisão. Não contornar login. Falta de sessão bloqueia a etapa autenticada, não testes locais possíveis.

Autorizações e preferências vigentes da sessão prevalecem. Se o delta já estiver autorizado, não pedir autorização repetida. Se faltar autorização, concluir proposta, validação e reversão antes de pedir aprovação da escrita concreta. Não presumir que a autorização histórica das cinco mudanças de AFO cobre cargas novas. Consulta de evidências e preparação local não exigem nova autorização de produção.

Inspecionar o fluxo administrativo real: `--preserve-flashcards` preserva cartões e não aplica edição neles; pode exigir todas as seções ativas do tópico. Delta editorial pequeno não implica que uma seção isolada seja importável. Conferir campos escritos, concorrência e pré-imagem. Correção individual de cartão deve usar fluxo validado que preserve os demais; não desabilitar a proteção indiscriminadamente.

Controlar separadamente: revisão, proposta validada, aplicação, reconciliação, commit/push, deploy e conferência autenticada. Conteúdo no Supabase não é versionado automaticamente pelo Git; commit documental não aplica conteúdo e sua reversão não restaura banco.

O repositório editorial está sem remoto: fazer checkpoint local e declarar a limitação, sem inventar destino. Espelhar este plano em `docs/PLANO_REVISAO_DISCIPLINAS.md` no repositório do site e conferir igualdade. Usar checkout/worktree limpa para publicação autorizada em main, confirmar SHA remoto e conferir deploy se necessário. O espelho permite retomar o plano, mas não contém os snapshots locais. Não publicar snapshots, conteúdo integral ou dados pessoais inadvertidamente.

## 9. Critérios de encerramento e transição

| Dimensão | Evidência necessária para [x] |
|---|---|
| Cobertura editorial | Todas as seções/componentes existentes lidos e verificados no escopo declarado; afirmações relevantes confrontadas com fontes. Amostra prioriza, não encerra revisão integral. |
| Achados | Veredito individual: confirmado, parcialmente confirmado, refutado ou inconclusivo. Confirmados tratados; inconclusivos necessários ao aceite continuam pendentes. |
| Completude | Matriz explícita; tópico vazio não é conteúdo revisado. Lacuna impeditiva aberta mantém parcial; exclusão do escopo precisa de justificativa registrada. |
| Integridade | Identidades preservadas; exemplos/cálculos/cartões afetados conferidos; adições fundamentadas e revisadas. |
| Visual/funcional | Evidência das combinações de tema/viewport exigidas e controles; testes locais e autenticados identificados separadamente. |
| Aplicação | Se houver correção em produção: delta autorizado, pré-imagem, validações, reconciliação e conferência do resultado. Caso contrário, “não necessária”. |
| Rastreabilidade | Relatório vigente, versão/hash, fontes, cobertura, riscos, pendências, checkpoint e próximo passo. |

Manter `[~]` enquanto faltar verificação necessária, mesmo que correções anteriores estejam publicadas. `[x]` vale para versão/escopo registrados, não para alterações futuras. Depois de encerrar ARM/AFO, iniciar Administração Geral e seguir a fila alfabética. Antecipar outra disciplina com pendência impeditiva exige decisão explícita de prioridade; não converter bloqueio em conclusão.

## 10. Contrato de relatório e passagem de contexto

Cada relatório começa pelo estado vigente e registra disciplina/IDs, iteração, versão/hash, executor, população, cobertura, fontes, achados, antes/depois, validações, autorização aplicável, banco/Git/deploy, riscos e tarefas restantes. Achado: ID estável, gravidade, componente/seção, trecho/contexto, evidência, proposta e aceite. Atualizar achados existentes sem duplicar contagens.

Ao concluir uma unidade, atualizar o relatório, as linhas deste plano e disciplinas.txt, CHANGELOG.md e o espelho no site; conferir contagens e igualdade. Preservar histórico, inclusive falhas metodológicas.

Passagem obrigatória para outro agente: checkpoint; arquivos alterados/reservados; tarefas concluídas/em execução/bloqueadas; evidências não verificadas; próxima ação segura; condições de autorização; prompt autocontido. Nenhum agente deve depender do chat para entender o escopo ou o progresso.

## 11. Prompt de retomada do orquestrador

```text
Retome C:\PRO\revisoes-resumos. Leia C:\PRO\AGENTS.md e PLANO_REVISAO_DISCIPLINAS.md versão 2; confira Git, fila, topo dos relatórios e evidências 014. Examine a possível 015 e eventual executor ativo antes de assumir arquivos. Preserve mudanças alheias.

Execute a primeira tarefa aberta R01–R10, com evidência nova. Não repita cargas históricas ou workflows inteiros. As 197 propostas não são 197 erros confirmados. Salve comparação corrigida; trate os dois problemas internos de AFO e avance por lotes pequenos, priorizando ARM. Se subagentes não estiverem disponíveis, continue diretamente o trabalho independente; delegue apenas quando autorizado.

Prepare correções comprovadas, matriz de cobertura e validação visual. Preserve IDs, cartões não envolvidos e dados pessoais. Antes de escrever, cumpra autorizações vigentes e, se faltar autorização, apresente delta pronto para aprovação. --preserve-flashcards não publica edição de cartão.

Atualize tarefas, disciplinas, relatórios e espelho; entregue checkpoint, evidências, pendências e próximo prompt. Só marque [x] mediante seção 9. Não avance de disciplina implicitamente para esconder pendências.
```
