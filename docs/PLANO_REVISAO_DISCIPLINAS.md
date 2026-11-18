# Plano operacional de revisão — orquestração por agentes IA

Versão 2 — atualização documental de 17/11/2026. Público exclusivo: agentes de orquestração, execução e verificação. Este documento é o ponto de entrada para retomar o programa sem acesso ao chat. Não certifica a qualidade integral do acervo.

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

**54 disciplinas, 543 tópicos na coleta de 15/11/2026; 0 revisões integrais encerradas, 2 parciais e 52 não iniciadas.** As contagens de seções/componentes de ARM/AFO são das evidências já registradas, sem nova consulta nesta atualização.

| Frente | Estado sustentado | Limite / próximo trabalho |
|---|---|---|
| ARM | Correções anteriores conferidas em 15/11; 11 tópicos, 33 seções, 14 diagramas, zero cartões na fotografia. | Fontes, cálculos, coerência, visual e cobertura ainda precisam de encerramento. |
| AFO | Correções anteriores aplicadas em 17/11; 12 tópicos, 48 seções, 24 diagramas e 100 cartões. Reconciliação de cinco mudanças às 13h11. | Novos achados da 014 não foram aplicados; revisão integral não encerrada. |
| Publicação anterior | Registro de AFO em main no commit `949c636`, deploy confirmado em 17/11 às 13h13. | Publicação anterior não comprova aplicação de propostas posteriores. Commit apenas documental não altera o banco. |
| Iteração 014 | Commit local `0dd4fe4`; 197 propostas: 89 ARM e 108 AFO; quatro críticas, 56 altas e 137 de outras gravidades. | Não são 197 erros comprovados. Os 36 conjuntos de verificação independente falharam; fontes não foram reabertas pelo consolidador. |
| Evidência textual da 014 | 155 trechos localizados, 42 não localizados; 325 referências declaradas. | Existência literal não prova erro; referência declarada não comprova consulta ou vigência. |
| Dois problemas internos | Cartão índice 1 de `despesa-publica-sec-05` e nota ¹ de `receita-publica-sec-09`. | Contradição/erro redacional identificados; preparar correção fundamentada. Não há delta homologado da 014. |
| Recibo de comparação | `estado-atual-2026-11-17.json` preserva as 33 falsas divergências de ARM causadas por campos ausentes na proposta. Reexecução corrigida foi relatada sem recibo novo salvo. | Salvar novo recibo, sem sobrescrever o original. Campo ausente significa não comparável por essa proposta, não identidade certificada. |
| Separação ARM/AFO | Vínculos estruturais conferidos; sem topic_id compartilhado. stable_key repetida em tópicos diferentes não prova defeito. | Conferir escopo da chave composta no schema; vínculo correto não certifica separação semântica do conteúdo. |
| Omissões | Oito tópicos sem seções: dois ARM e seis AFO. | Matriz de cobertura não concluída; procurar conteúdo correspondente em outros tópicos antes de adicionar. |
| Visual | AFO possui evidências anteriores de amostra visual, DOM e interação local; a 014 não fez nova inspeção. | Não extrapolar amostra. ARM e conferência autenticada permanecem pendentes conforme evidência registrada. |
| Trabalho não homologado | Arquivos não rastreados em `evidencias-iteracao-015/` e novos auxiliares em `iteracao-014/`. | Existência de código não comprova teste concluído. Conferir executor ativo e novos resultados; preservar arquivos alheios. |

Ler: `iteracao-014/ESTADO_ITERACAO_014.md`, `iteracao-014/resultados_revisao_bruto.json`, `iteracao-014/resultados_verificacao_bruto.json`, `iteracao-014/achados_trecho_nao_localizado.json`, `revalidar-arm-afo.mjs`, `APLICACAO_AFO_2026-11-17.md` e `aplicacao-afo-reconciliacao.json`.

## 4. Fila completa e progresso por disciplina

Legenda: `[ ]` não iniciada; `[~]` parcial; `[x]` encerrada conforme seção 9. Quantidades de tópicos: coleta de 15/11/2026. “Não iniciada” significa ausência de revisão formal comprovada neste programa, não ausência de conteúdo.

| Ordem | Disciplina | Tópicos | Revisão | Progresso documentado | Próxima ação |
|---|---|---|---|---|---|
| 01 | Administração de Recursos Materiais | 11 | [~] parcial | 33 seções; 14 diagramas; 0 cartões; 89 propostas da 014 | R01–R10; fontes, cálculos, omissões e visual |
| 02 | Administração Financeira e Orçamentária | 12 | [~] parcial | 48 seções; 24 diagramas; 100 cartões; 108 propostas da 014 | R01–R10; dois problemas internos, fontes, cobertura e visual |
| 03 | Administração Geral | 13 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Próxima nova disciplina; iniciar após critérios de transição |
| 04 | Administração Pública | 15 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 05 | Agências Reguladoras e Regulação | 5 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 06 | Análise de Balanços | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 07 | Arquivologia | 16 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 08 | Atualidades | 8 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 09 | Auditoria | 24 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 10 | Conhecimentos Bancários | 10 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 11 | Contabilidade de Custos | 10 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 12 | Contabilidade Geral e Avançada | 32 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 13 | Contabilidade Pública | 5 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 14 | Controle Externo | 8 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 15 | Direito Administrativo | 25 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 16 | Direito Ambiental | 10 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 17 | Direito Civil | 12 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 18 | Direito Constitucional | 16 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 19 | Direito da Pessoa com Deficiência | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 20 | Direito do Trabalho | 15 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 21 | Direito Eleitoral | 9 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 22 | Direito Empresarial | 3 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 23 | Direito Penal | 7 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 24 | Direito Penal Militar | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 25 | Direito Previdenciário | 21 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 26 | Direito Processual Civil | 17 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 27 | Direito Processual do Trabalho | 7 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 28 | Direito Processual Penal | 19 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 29 | Direito Processual Penal Militar | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 30 | Direito Tributário | 21 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 31 | Direitos Humanos | 9 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 32 | Enfermagem | 5 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 33 | Engenharia Florestal | 2 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 34 | Estatística | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 35 | Ética no Serviço Público | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 36 | Finanças Públicas | 1 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 37 | Física | 9 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 38 | Geografia | 10 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 39 | Informática | 15 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 40 | Legislação Aduaneira | 5 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 41 | Legislação Aplicada à EBSERH | 7 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 42 | Legislação de Trânsito | 11 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 43 | Legislação do SUS | 10 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 44 | Legislação Municipal | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 45 | Legislação Penal Especial | 36 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 46 | Língua Inglesa | 6 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 47 | Macroeconomia | 1 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 48 | Matemática | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 49 | Matemática Financeira | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 50 | Microeconomia | 1 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 51 | Português | 10 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 52 | Raciocínio Lógico | 4 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 53 | Relações Humanas e Atendimento | 6 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |
| 54 | Vendas e Negociação | 8 | [ ] não iniciada | Sem revisão formal comprovada neste programa | Executar ciclo D01–D08 quando chegar sua vez |

## 5. Tarefas imediatas de recuperação e encerramento

Todos os itens permanecem abertos neste plano até aceite documentado. Trabalhar ARM antes de AFO, com saídas separadas; antecipação de erro crítico de AFO exige prioridade explícita registrada. Não repetir workflows inteiros sem examinar saídas existentes.

| ID | Escopo / tarefa | Saída e critério de aceite |
|---|---|---|
| R01 | Ambas: reconciliar trabalho concorrente e a possível 015 | Executor e arquivos reservados identificados; últimos resultados lidos; nenhuma duplicação ou incorporação cega de trabalho alheio. |
| R02 | Ambas: salvar revalidação corrigida | Novo recibo datado, com hash, diferenças e campos não comparáveis; identidades contra pré-imagem adequada; snapshot original preservado. |
| R03 | AFO: tratar os dois problemas internos identificados | Contexto completo e fontes conferidos; veredito e correção local mínima quando confirmada. Não adiar correção verificada apenas para formar lote maior. |
| R04 | Ambas: verificar as 197 alegações | Livro de achados com veredito individual e evidência; críticos/altos primeiro; resolver os 42 trechos não localizados. Amostragem não encerra o censo. |
| R05 | ARM: cálculos/coerência; AFO: rastreabilidade normativa | Todas as seções/componentes com leitura e verificação diferenciadas; exemplos recalculados e fontes atuais, com dispositivo e âmbito. |
| R06 | Ambas: cobertura dos oito tópicos vazios e omissões internas | Matriz distingue conteúdo já coberto, insuficiente e ausente; referência de escopo explícita; adições fundamentadas e separadas. |
| R07 | Ambas: visual local e produção | Evidências por tema/viewport: tabelas, fórmulas, overflow, diagramas e controles. Distinguir DOM, imagem inspecionada, interação e sessão real. |
| R08 | Ambas: preparar delta e validar | Antes/depois, fontes, IDs preservados, proposta separada do payload aceito e dry-runs reais. Correção de cartão com fluxo que efetivamente o atualize. |
| R09 | Ambas: aplicar delta autorizado e reconciliar | Pré-imagem e reversão, revalidação imediata de concorrência, aplicação delimitada e comparação posterior; cartões não envolvidos e dados pessoais preservados. |
| R10 | Encerrar cada disciplina e liberar próxima | Critérios da seção 9 atendidos ou pendências impeditivas explícitas; relatório, fila e plano atualizados; passagem executável. |

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
