# Plano operacional de revisão — orquestração por agentes IA

Versão 3 — atualização documental de 23/11/2026. Público exclusivo: agentes de orquestração, execução e verificação. Este documento é o ponto de entrada para retomar o programa sem acesso ao chat. Não certifica a qualidade integral do acervo.

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

A fila inclui 54 disciplinas. Há 19 com aceite para a versão revisada do catálogo, 25 parciais (incluindo as 20 sem seções na fotografia) e 10 ainda não iniciadas na fila da Onda 7. A conferência com conta de aluno foi dispensada em todo o programa. Corpus PRO Legis permanece fora do escopo; sua integração com a gamificação permanece autorizada.

| Frente | Última evidência | Trabalho seguinte |
|---|---|---|
| ARM e AFO | Aceites individuais em 23/11: 45/45 e 71/71 refutações reexaminadas; 23 tópicos e 84 seções reconciliados. Checkpoint `f4fa492`, recibo `iteracao-016-arm-afo/aceite-20261123-identidades.json`. | Reabrir somente mediante alteração posterior ou achado específico. |
| Ondas 1–4 | A reconciliação de 22/11 abrangeu 235, 326, 130 e 360 seções, respectivamente. Recuperada a ordem de 28 tópicos da Onda 2. Amostra visual de uma seção por disciplina com 90 verificações em três temas e duas larguras. Recibos em `orquestracao-03-54/aceite-ondas-1-4/`. | Restam os tópicos macro de 03, 04, 07 e 15. O recibo posterior de Penal substitui a referência histórica de 104 seções desta disciplina por 108. |
| Onda 5 | 106 operações confirmadas, 64 tópicos e 251 seções reconciliados. Aceite das quatro disciplinas. | Consultar `orquestracao-03-54/saneamento-onda-5/reconciliacao-publicacao-onda5.json` antes de nova edição. |
| Onda 6 | Publicados os ajustes de precisão e dois tópicos adicionais. Conferidos 23 tópicos e 327 seções. | Consultar `orquestracao-03-54/saneamento-onda-6/evidencias/fechamento/reconciliacao.json` e o aceite em 30-direito-tributario.md. |
| Onda 7 | Estatística publicada e reconciliada em 23/11: quatro tópicos e onze seções, oito correções e três adições, 66 verificações locais aprovadas. Onze disciplinas restantes em execução/fila. | Conferir checkpoints exclusivos por disciplina e reservas da retomada. |

## 4. Fila completa e progresso por disciplina

Legenda: `[ ]` não iniciada; `[~]` parcial; `[x]` encerrada conforme seção 9. Quantidades de tópicos: coleta de 15/11/2026. “Não iniciada” significa ausência de revisão formal comprovada neste programa, não ausência de conteúdo.

| Ordem | Disciplina | Tópicos | Revisão | Progresso documentado | Próxima ação |
|---|---|---|---|---|---|
| 01 | Administração de Recursos Materiais | 11 | [x] concluída | 34 seções e 15 diagramas; 45/45 refutações reexaminadas; identidades e conteúdo reconciliados em 23/11. | Aceite da versão publicada; ver relatório 01 e recibo da 016. |
| 02 | Administração Financeira e Orçamentária | 12 | [x] concluída | 50 seções, 26 diagramas e 100 cartões; 71/71 refutações reexaminadas; 13+1 correções publicadas e reconciliadas nesta retomada. | Aceite da versão publicada; ver relatório 02 e recibo da 016. |
| 03 | Administração Geral | 13 | [~] parcial | 54/54 seções lidas; +1 seção(ões) adicionada(s); 120 cartões; 22 diagramas; 9 edições em 9 seções reconciliadas no banco; visual 75/75 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Conferir cobertura dos tópicos macro vazios e registrar cada decisão. |
| 04 | Administração Pública | 15 | [~] parcial | 40/40 seções lidas; 120 cartões; 24 diagramas; 8 edições em 7 seções reconciliadas no banco; visual 78/78 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Conferir cobertura dos tópicos macro vazios e registrar cada decisão. |
| 05 | Agências Reguladoras e Regulação | 5 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 5 tópicos vazios registrada em `05-agencias-reguladoras-e-regulacao.md` | Aguardar autoria/importação futura de conteúdo |
| 06 | Análise de Balanços | 4 | [x] concluída | 4/4 seções lidas; 0 cartões; 0 diagramas; 1 edições em 1 seções reconciliadas no banco; visual 9/9 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 07 | Arquivologia | 16 | [~] parcial | 29/29 seções lidas; +1 seção(ões) adicionada(s); 0 cartões; 6 diagramas; 15 edições em 9 seções reconciliadas no banco; visual 18/18 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Conferir cobertura dos tópicos macro vazios e registrar cada decisão. |
| 08 | Atualidades | 8 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 8 tópicos vazios registrada em `08-atualidades.md` | Aguardar autoria/importação futura de conteúdo |
| 09 | Auditoria | 24 | [x] concluída | 76/76 seções lidas; 159 cartões; 12 diagramas; 42 edições em 23 seções reconciliadas no banco; visual 39/39 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 10 | Conhecimentos Bancários | 10 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 10 tópicos vazios registrada em `10-conhecimentos-bancarios.md` | Aguardar autoria/importação futura de conteúdo |
| 11 | Contabilidade de Custos | 10 | [x] concluída | 30/30 seções lidas; 120 cartões; 8 diagramas; 41 edições em 16 seções reconciliadas no banco; visual 39/39 renders OK; saneamento Onda 1 aplicado e reconciliado (visual 167/167) | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 12 | Contabilidade Geral e Avançada | 32 | [x] concluída | 142/142 seções lidas; 120 cartões; 24 diagramas; 42 edições em 29 seções reconciliadas no banco; visual 231/231 renders OK | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 13 | Contabilidade Pública | 5 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 5 tópicos vazios registrada em `13-contabilidade-publica.md` | Aguardar autoria/importação futura de conteúdo |
| 14 | Controle Externo | 8 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 8 tópicos vazios registrada em `14-controle-externo.md` | Aguardar autoria/importação futura de conteúdo |
| 15 | Direito Administrativo | 25 | [~] parcial | 184/184 seções lidas; 729 cartões; 20 diagramas; 249 edições em 92 seções reconciliadas no banco; visual 84/84 renders OK | Conferir cobertura dos tópicos macro vazios e registrar cada decisão. |
| 16 | Direito Ambiental | 10 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 10 tópicos vazios registrada em `16-direito-ambiental.md` | Aguardar autoria/importação futura de conteúdo |
| 17 | Direito Civil | 12 | [x] concluída | 130/130 seções lidas; 298 cartões; 26 diagramas; 81 edições em 40 seções reconciliadas no banco; visual 78/78 renders OK | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 18 | Direito Constitucional | 16 | [x] concluída | 105/105 seções lidas; +2 seção(ões) adicionada(s); 433 cartões; 9 diagramas; 72 edições em 29 seções reconciliadas no banco; visual 33/33 renders OK; saneamento Onda 4 aplicado e reconciliado | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 19 | Direito da Pessoa com Deficiência | 4 | [x] concluída | 12/12 seções lidas; 0 cartões; 2 diagramas; 10 edições em 4 seções reconciliadas no banco; visual 6/6 renders OK | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 20 | Direito do Trabalho | 15 | [x] concluída | 50/50 seções lidas; 0 cartões; 19 diagramas; 21 edições em 15 seções reconciliadas no banco; visual 60/60 renders OK | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 21 | Direito Eleitoral | 9 | [x] concluída | 58/58 seções lidas; 0 cartões; 8 diagramas; 32 edições em 24 seções reconciliadas no banco; visual 42/42 renders OK | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 22 | Direito Empresarial | 3 | [x] concluída | 29/29 seções lidas; 0 cartões; 2 diagramas; 8 edições em 6 seções reconciliadas no banco; visual 12/12 renders OK | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 23 | Direito Penal | 7 | [x] concluída | Art. 8º corrigido e quatro tópicos preenchidos. Sete tópicos e 108 seções reconciliados em produção. | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 24 | Direito Penal Militar | 4 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 4 tópicos vazios registrada em `24-direito-penal-militar.md` | Aguardar autoria/importação futura de conteúdo |
| 25 | Direito Previdenciário | 21 | [x] concluída | Correções aplicadas e reconciliadas em produção em 21/11/2026 | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 26 | Direito Processual Civil | 17 | [x] concluída | Correções aplicadas e reconciliadas em produção em 21/11/2026 | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 27 | Direito Processual do Trabalho | 7 | [x] concluída | Correções aplicadas e reconciliadas em produção em 21/11/2026 | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 28 | Direito Processual Penal | 19 | [x] concluída | Correções aplicadas e reconciliadas em produção em 21/11/2026 | Aceite da versão publicada no catálogo. Reabrir quando houver alteração de conteúdo ou de referência. |
| 29 | Direito Processual Penal Militar | 4 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 4 tópicos vazios registrada em `29-direito-processual-penal-militar.md` | Aguardar autoria/importação futura de conteúdo |
| 30 | Direito Tributário | 23 | [x] concluída | Duas adições com 21 seções publicadas. Reconciliação integral de 23 tópicos e 327 seções com os respectivos IDs de revisão. Aceite em fbcee37. | Reabrir em caso de alteração no conteúdo ou nos editais da matriz. |
| 31 | Direitos Humanos | 9 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 9 tópicos vazios registrada em `31-direitos-humanos.md` | Aguardar autoria/importação futura de conteúdo |
| 32 | Enfermagem | 5 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 5 tópicos vazios registrada em `32-enfermagem.md` | Aguardar autoria/importação futura de conteúdo |
| 33 | Engenharia Florestal | 2 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 2 tópicos vazios registrada em `33-engenharia-florestal.md` | Aguardar autoria/importação futura de conteúdo |
| 34 | Estatística | 4 | [x] concluída | Oito seções corrigidas e três acrescentadas; quatro tópicos e onze seções reconciliados; 66/66 verificações locais nos três temas e duas larguras. | Aceite da versão publicada; relatório 34 e recibos preparacao-20261123-v2. |
| 35 | Ética no Serviço Público | 4 | [ ] não iniciada | Fotografia coletada (19 seções, 0 cartões, 5 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 36 | Finanças Públicas | 1 | [ ] não iniciada | Fotografia coletada (7 seções, 0 cartões, 4 diagramas) | Executar Onda 7 (ciclo D02–D08) |
| 37 | Física | 9 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 9 tópicos vazios registrada em `37-fisica.md` | Aguardar autoria/importação futura de conteúdo |
| 38 | Geografia | 10 | [~] parcial | Fotografia coletada; 0 seções ativas no acervo; matriz de 10 tópicos vazios registrada em `38-geografia.md` | Aguardar autoria/importação futura de conteúdo |
| 39 | Informática | 15 | [~] parcial | 49/52 seções publicadas; dez tópicos integrais, Sistemas de Informação 1/1. Aceite final de seis combinações, 49 testes e reconciliação 15/52; demais 51 revisões preservadas. Restam 3 seções e três lacunas em dry-run. | Somente Transformação Digital 01–03; preservar lotes publicados. Ver relatório 39. |
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

R01–R09 registram a iteração 015. R10 acompanha o fechamento editorial atualizado.

| ID | Escopo / tarefa | Saída e critério de aceite |
|---|---|---|
| R01 | Ambas: reconciliar trabalho concorrente e a 015 | **Concluída (015):** arquivos reconciliados e versionados em `propostas-iteracao-015/` e `evidencias-iteracao-015/`. |
| R02 | Ambas: salvar revalidação corrigida | **Concluída (015):** `recibo-comparacao-arm-afo-2026-11-17.json` salvo com SHA-256 e `missingInLocalPayload`, preservando `estado-atual-2026-11-17.json`. |
| R03 | AFO: tratar os dois problemas internos identificados | **Concluída e aplicada (015 / `f48ec8e`):** flashcard índice 1 de `despesa-publica-sec-05` (`CERTO` → `ERRADO` via CAS) e nota ¹ de `receita-publica-sec-09` corrigidos e reconciliados no banco. |
| R04 | Ambas: verificar as 197 alegações | **Concluída (015):** `censo-197-achados.json` com verificação cega integral (77 confirmados, 4 parciais, 116 refutados, 0 inconclusivos; 42/42 trechos localizados manualmente). |
| R05 | ARM: cálculos/coerência; AFO: rastreabilidade normativa | **Concluída (015):** `registro-81-secoes.json` e `auditar_propostas_015.mjs` (81/81 seções lidas, 96 nós KaTeX com 0 erros e 0 caracteres de controle, cálculos e normas 2025/2026 conferidos). |
| R06 | Ambas: cobertura dos oito tópicos vazios e omissões internas | **Concluída e aplicada (`f48ec8e`):** `matriz-8-topicos-vazios.json` com os 8 IDs exatos + 2 pacotes (`01-arm-movimentacao-e-transporte-de-materiais` e `02-afo-lei-de-responsabilidade-fiscal-lrf-lc-101`) aplicados e reconciliados no banco. |
| R07 | Visual | Validação local registrada em `evidencias-iteracao-015/resultados-brutos-015.json`. Sessão de aluno dispensada. |
| R08 | Ambas: preparar delta e validar | **Concluída (015):** `delta-completo-antes-depois.json` (62 edições), pré-imagens/manifestos SHA-256, dry-runs `import-batch --preserve-flashcards` e `atualizar-flashcard-cirurgico.mjs` aprovados. |
| R09 | Ambas: aplicar delta autorizado e reconciliar | **Concluída e reconciliada (`f48ec8e`):** após autorização do usuário para execução autônoma integral, aplicado delta completo (`aplicacao-015-antes.json` → `aplicacao-015-reconciliacao.json`) com `exactParityWithApprovedProposal: true` e `personalPreserved: true`. |
| R10 | Encerrar por disciplina | **Concluída em 23/11:** aceites individuais 01/02 e `iteracao-016-arm-afo/ACEITE_20261123.md`; 116/116 refutações tratadas e 84 seções reconciliadas. |

Tópicos vazios na fotografia anterior à aplicação da iteração 015: ARM `gestao-de-estoques-e-reposicao`, `movimentacao-e-transporte-de-materiais`; AFO `creditos-adicionais`, `despesa-publica-etapas-e-estagios`, `lei-de-responsabilidade-fiscal-lrf-lc-101`, `planejamento-e-leis-orcamentarias-ppa-ldo-loa`, `principios-orcamentarios`, `receita-publica-classificacoes-e-estagios`.

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
| D06 — validação | Validar contrato/JSON, dry-runs e componentes afetados; testar o visual local e registrar a conferência com sessão autorizada quando aplicável ou sua dispensa. | Resultados reais e cobertura por combinação de tema/viewport; limites declarados. |
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
| Visual/funcional | Evidência das combinações de tema/viewport exigidas e controles; evidência local e resultado da conferência autenticada quando aplicável ou registro da dispensa. |
| Aplicação | Se houver correção em produção: delta autorizado, pré-imagem, validações, reconciliação e conferência do resultado. Caso contrário, “não necessária”. |
| Rastreabilidade | Relatório vigente, versão/hash, fontes, cobertura, riscos, pendências, checkpoint e próximo passo. |

Manter `[~]` enquanto faltar verificação necessária, mesmo que correções anteriores estejam publicadas. `[x]` vale para versão/escopo registrados, não para alterações futuras. Depois de encerrar ARM/AFO, iniciar Administração Geral e seguir a fila alfabética. Antecipar outra disciplina com pendência impeditiva exige decisão explícita de prioridade; não converter bloqueio em conclusão.

## 10. Contrato de relatório e passagem de contexto

Cada relatório começa pelo estado vigente e registra disciplina/IDs, iteração, versão/hash, executor, população, cobertura, fontes, achados, antes/depois, validações, autorização aplicável, banco/Git/deploy, riscos e tarefas restantes. Achado: ID estável, gravidade, componente/seção, trecho/contexto, evidência, proposta e aceite. Atualizar achados existentes sem duplicar contagens.

Ao concluir uma unidade, atualizar o relatório, as linhas deste plano e disciplinas.txt, CHANGELOG.md e o espelho no site; conferir contagens e igualdade. Preservar histórico, inclusive falhas metodológicas.

Passagem obrigatória para outro agente: checkpoint; arquivos alterados/reservados; tarefas concluídas/em execução/bloqueadas; evidências não verificadas; próxima ação segura; condições de autorização; prompt autocontido. Nenhum agente deve depender do chat para entender o escopo ou o progresso.

## 11. Prompt de retomada do orquestrador

```text
Retome C:\PRO\revisoes-resumos. Confira Git, a seção 3, disciplinas.txt, o relatório da disciplina e o último recibo correspondente. Identifique lotes em execução antes de reservar arquivos. Use os checkpoints de ARM/AFO, dos tópicos macro e da Onda 7. Quando houver reconciliação posterior, utilize a mais recente para aquela disciplina.

Execute D01–D08 para o próximo lote pendente. Registre fontes primárias e data, seções e componentes examinados, achados confirmados ou refutados, omissões, correções, visual e reconciliação. Preserve a pré-imagem e confira a versão em produção antes de cada escrita. Atualize a fila, o parecer, o plano e seu espelho. Entregue o prompt para a próxima iteração.
```
