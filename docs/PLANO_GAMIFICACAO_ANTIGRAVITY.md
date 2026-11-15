# Plano de gamificação — execução pelo Antigravity

Data: 14/11/2026. Status: especificação proposta para implementação incremental; nenhuma funcionalidade implementada por este documento.

## 1. Missão e resultado esperado

Implementar uma rotina de estudo curta, flexível e útil para estudantes de concursos com pouco tempo. A experiência deve responder: quanto tempo tenho, o que estudar agora e o que preciso retomar?

Conectar progressivamente resumos, leis e questões, sem confundir participação com aprendizagem ou aprovação. Usar o Duolingo como referência de sessões curtas, feedback e metas; adaptar a constância para semanas flexíveis.

Hipótese de público: pessoas que conciliam estudos, trabalho e responsabilidades. Validar a hipótese com usuários; não presumir que todos desejam o mesmo ritmo.

## 2. Mandato para o Antigravity

1. Ler AGENTS.md canônico e instruções vigentes. Inspecionar git status e git diff antes de alterar arquivos; preservar trabalho preexistente.
2. Identificar a branch e a versão canônica atual do site antes de implementar. Este checkout documental não comprova o estado atual da produção.
3. Executar a fase 0 e registrar evidências. Depois implementar e verificar o MVP das fases 1 e 2 em pequenas unidades. Não encerrar apenas com outro plano.
4. Tratar fases 3 a 5 como evolução posterior, fora do primeiro incremento. Não implementá-las automaticamente junto ao MVP.
5. Não aplicar migrations remotas, publicar conteúdo, fazer merge ou deploy com base apenas neste documento. Preparar artefatos e validação local; seguir a autorização operacional vigente para ações externas.
6. Não reescrever conteúdo jurídico, alterar contratos dos importadores, enfraquecer RLS ou modificar credenciais.
7. Ler a documentação local de Next.js instalada antes de alterar páginas, rotas ou APIs. Usar padrões, tokens e dependências existentes.
8. Versionar apenas os próprios arquivos, atualizar changelog e registrar commit/push conforme instruções vigentes. Não incluir alterações de terceiros.

## 3. Diagnóstico obrigatório — fase 0

A inspeção limitada que originou este plano encontrou progresso por seção em src/hooks/use-section-progress.ts, dashboard em src/app/dashboard/page.tsx e tipos em src/types/database.ts. São pistas de investigação, não uma auditoria nem um contrato de implementação.

Produzir docs/GAMIFICACAO_DIAGNOSTICO.md com:

| Item | Evidência necessária | Consequência |
| --- | --- | --- |
| Resumos | Rotas, identidade estável, ordem, acesso e persistência do progresso | Reaproveitar progresso sem duplicá-lo |
| Leis | Projeto proprietário, leitor, conteúdo publicado e permissões | Habilitar somente conteúdo disponível ao aluno |
| Questões | Rotas/RPCs, respostas, histórico, status editorial e taxonomia | Não construir revisão sobre dados inexistentes |
| Flashcards | Disponibilidade, interação e eventual histórico individual | Não interpretar virar cartão como acerto |
| Relações entre módulos | IDs e vínculos existentes e qualidade editorial | Não associar conteúdo por título apenas |
| Conta e acesso | Sessão, entitlement, contas compartilhadas e RLS | Progresso pertence à conta, não identifica pessoas em conta compartilhada |
| Infraestrutura | Migrations, tipos, scripts de testes e flags existentes | Reusar padrões; não criar serviço separado |

Distinguir explicitamente: existe no código, existe no banco, está publicado e está acessível em produção. Não apresentar contagens sem fonte, data e critério. Se não houver acesso remoto, registrar como não verificado e continuar o trabalho local independente.

Saída da fase: lista de arquivos a alterar, riscos, modelo de dados proposto, adaptações justificadas e matriz de funcionalidades disponíveis. Se os módulos estiverem em outro projeto autorizado, documentar a fronteira; não copiar uma implementação paralela para este checkout.

## 4. Escopo do MVP

Inclui:

- Meta semanal pessoal de 1 a 7 dias; sugestão inicial de 3 dias, confirmada pelo aluno.
- Sessões com orçamento estimado de 5, 15 ou 30 minutos.
- Ação principal: continuar estudo; alternativa: escolher conteúdo disponível.
- Registro persistente da sessão e de sua atividade, com conclusão explícita.
- Progresso semanal e resumo final discreto.
- Histórico básico de sessões e retomada de sessão interrompida.
- Controle para ocultar estímulos de gamificação, mantendo acesso ao estudo.

Não inclui no MVP: XP, moedas, loja, ranking, ligas, vidas, mascote, recompensas financeiras, notificações push/e-mail, IA recomendadora, editor de edital, cronograma completo ou revisão espaçada automática.

A primeira versão pode operar com resumos se os outros módulos não tiverem contratos disponíveis. Informar essa limitação; nunca mostrar uma missão impossível ou um botão sem destino funcional.

## 5. Regras funcionais do MVP

### 5.1 Meta e calendário

- Semana: segunda-feira 00h até a segunda seguinte, no fuso de estudo IANA. Inicializar com America/Sao_Paulo e permitir edição.
- Persistir instantes em UTC e a data local atribuída à conclusão, com o fuso usado. Não recalcular o histórico ao trocar de fuso.
- A primeira meta vale para a semana corrente, com indicação de semana parcial. Não presumir fracasso nos dias anteriores à adesão.
- Mudança de meta após ativação vale a partir da próxima semana. Guardar o alvo de cada semana; preservar resultados históricos.
- Mudança de fuso vale na próxima semana; oferecer prévia e não permitir deslocamento retroativo de dias.
- Um dia conta uma única vez, quando uma sessão elegível é concluída. Sessões adicionais permanecem no histórico.
- Meta atingida não bloqueia novas sessões. Semana incompleta não apaga conquistas ou estudo anterior.
- Sem login diário obrigatório, multiplicadores ou punição por ausência.

### 5.2 Sessão e atividade elegível

Estados: planejada, em andamento, interrompida, concluída ou descartada. Retomar uma sessão não cria uma cópia. Falha de rede não equivale a sucesso.

Uma sessão contém uma ou mais atividades com identificador estável, versão/referência disponível e tipo. O orçamento de tempo é estimativa, não prazo ou condição de aprovação.

| Tipo | Critério de conclusão | Limite da evidência |
| --- | --- | --- |
| Resumo | Aluno confirma que estudou uma seção acessível da sessão | Autodeclaração; não comprova compreensão |
| Lei | Aluno confirma estudo do trecho oficial acessível | Autodeclaração; somente quando integração existir |
| Questão | Backend confirma envio de resposta válida a questão elegível | Resposta comprova prática, não domínio |
| Flashcard | Futuramente, interação de resposta definida e registrada | Não contabilizar simples abertura ou virada |

No MVP, concluir exige ao menos uma atividade elegível e confirmação final. Não exigir acerto para contar estudo. Não exigir permanência mínima nem usar aba aberta, scroll ou cronômetro como prova.

Reestudo pode contar em outro dia. Repetir ou desmarcar/remarcar a mesma atividade no mesmo dia não cria dias adicionais nem recompensas. O progresso legado e o histórico de sessão têm funções distintas: uma revisão não deve desmarcar uma seção já estudada.

Sem eventos retroativos artificiais: não converter checkboxes antigos em sessões nem inventar datas de estudo.

### 5.3 Seleção de conteúdo

Prioridade inicial determinística: sessão interrompida, próximo trecho de conteúdo escolhido e alternativa de seleção manual. Permitir trocar a sugestão sem penalidade.

Sem histórico, pedir uma disciplina/conteúdo e recomendar um trecho disponível. Não afirmar que a sugestão cobre o edital do aluno.

Estimar tempo de forma conservadora e mostrar “aproximadamente”. Usar orçamento para limitar a sugestão, sem cortar texto ou obrigar conclusão de uma seção longa. Permitir parar e retomar. Revisar estimativas antes de sofisticar o algoritmo.

Se o conteúdo for removido, arquivado, alterado ou perder acesso: preservar histórico mínimo, indicar indisponibilidade e oferecer substituição elegível sem revelar conteúdo restrito.

### 5.4 Interface

Entrada no dashboard: cartão “Meu estudo de hoje”, disponibilidade de tempo, ação principal e indicador “2 de 3 dias nesta semana”. Não substituir a navegação existente.

Durante o estudo: contexto de sessão discreto, sair/retomar e concluir. Não cobrir conteúdo ou App Dock.

Fechamento: atividades realizadas, progresso semanal e opção de encerrar ou continuar. Exemplo: “Você estudou uma seção. Sua semana está em 2 de 3 dias.”

Evitar: “dominado”, “aprovação garantida”, “você perdeu tudo”, alertas de culpa e contagem regressiva. Separar estudado, praticado e revisado quando houver dados; não fabricar indicadores vazios.

Compatibilidade obrigatória: Light, Dark, Sepia, teclado, leitor de tela, redução de movimento, mobile e ausência de overflow horizontal. Nenhuma celebração bloqueia a leitura. Ocultar gamificação não apaga dados nem impede estudo.

## 6. Arquitetura e dados

Usar o Supabase compartilhado e os guardas de acesso existentes. Antes de criar tabelas, verificar se já há estruturas reutilizáveis.

Modelo conceitual, sujeito ao diagnóstico:

| Entidade | Responsabilidade |
| --- | --- |
| Preferência de rotina | Alvo futuro, fuso e visibilidade dos estímulos |
| Plano semanal | Alvo e fuso congelados para a semana |
| Sessão | Proprietário, estado, orçamento, início, conclusão e chave de idempotência |
| Atividade de sessão | Referência estável, tipo, estado e evidência mínima |

Derivar dias concluídos das sessões válidas. Não criar contadores independentes sem necessidade demonstrada. Garantir uma interpretação única de semana entre frontend, backend e SQL.

Requisitos:

- UUID do proprietário obtido da sessão no servidor; nunca confiar em user_id do navegador.
- RLS e autorização de conteúdo em leitura e escrita. Usuário A não lê nem altera dados de B.
- Mutação autenticada, validação de origem conforme padrão local e validação estrutural no servidor.
- Conclusão atômica e idempotente: múltiplos cliques, abas e retries retornam o mesmo resultado persistido.
- Transições de estado validadas no servidor; timestamp de conclusão confiável, sem aceitar data arbitrária do cliente.
- Resposta perdida após commit deve permitir recuperar o estado sem duplicar registro.
- Não enviar texto integral, respostas privadas ou conteúdo jurídico para telemetria.
- Não criar nova dependência, cron ou serviço externo sem necessidade demonstrada.
- Toda alteração de schema exige migration canônica em supabase/migrations e atualização de src/types/database.ts. Conferir numeração na base atual.
- Migração aditiva; sem apagar progresso legado ou alterar contratos de importação.
- Criar rollback operacional que desative a interface e preserve dados. Não propor DROP TABLE como rollback de rotina.
- Exclusão de conta e política de retenção devem abranger os novos dados conforme os fluxos existentes.

Não afirmar resistência a fraude de leitura: a conclusão de resumo é autodeclarada. Como não há prêmio econômico ou ranking, não introduzir vigilância invasiva.

## 7. Etapas de implementação e aceite

### Fase 1 — Domínio e persistência

Entregar regras de calendário, preferências, sessão, validação de transições e migrations locais. Testar idempotência e isolamento antes de conectar UI.

Aceite: calendário consistente; alvo histórico preservado; duas requisições concorrentes não duplicam conclusão; usuário sem sessão rejeitado; usuário B sem acesso a registros de A; dados legados intactos.

### Fase 2 — Experiência completa do MVP

Integrar dashboard, iniciar/retomar sessão, seleção de conteúdo, conclusão, progresso semanal e ocultação dos estímulos. Usar leitura confirmada para feedback de sucesso; em falha, mostrar mensagem e tentativa segura.

Aceite: novo aluno conclui uma sessão de ponta a ponta; recarregar mantém estado; parar e retomar funciona; meta atingida permite continuar; semana nova inicia sem alterar histórico; ocultar gamificação preserva o estudo convencional; acesso vencido não permite consultar conteúdo protegido.

Entregar o MVP com as fases 1 e 2 verificadas. Dependências remotas pendentes devem aparecer como pendências, nunca como funcionalidade publicada.

### Fase 3 — Revisão de erros

Somente após validar histórico de respostas. Apresentar fila pequena, permitir adiar e não acumular dívida punitiva. Rever em outro dia não significa erro corrigido definitivamente. Questões anuladas, arquivadas ou sem revisão editorial elegível ficam fora.

Começar com regra de agendamento simples, documentada e testável; validar intervalos com uso real antes de introduzir algoritmo sofisticado. Não prometer memória ou domínio com base na conclusão da fila.

### Fase 4 — Missões integradas

Conectar resumo, dispositivo legal e questão usando relações explícitas e auditáveis. Não usar coincidência de título ou geração por IA como autorização editorial. Se um elo faltar, oferecer uma sessão válida mais simples.

Acervo oficial de leis permanece separado de metadados de gamificação. Não editar official_text, hashes, IDs ou status de publicação. Respeitar revisão humana e regras do PRO Legis.

### Fase 5 — Conquistas opcionais

Introduzir apenas se houver utilidade demonstrada. Exemplos: primeira meta semanal, quatro semanas com participação, primeira revisão posterior. Sem perda de vidas, ranking público ou monetização de desempenho. XP continua opcional e exige especificação própria contra repetição artificial.

## 8. Matriz mínima de testes

| Cenário | Resultado esperado |
| --- | --- |
| Primeiro acesso sem meta | Escolha simples; sem histórico inventado |
| Duplo clique e duas abas | Uma conclusão persistida |
| Resposta perdida após gravação | Retentativa recupera conclusão existente |
| Falha de rede antes da gravação | Sem sucesso falso; tentativa preservada |
| Sessão atravessa meia-noite | Dia atribuído à conclusão no fuso definido |
| Domingo para segunda | Nova semana e alvo correto |
| Troca de meta/fuso | Efeito futuro, histórico estável |
| Releitura em dias diferentes | Pode contar cada dia; sem duplicação diária |
| Desmarcar seção após sessão | Não reescreve histórico da sessão |
| Sessão incompleta | Não conta dia; pode retomar |
| Sem sessão / usuário diferente | Rejeição e isolamento comprovados |
| Conteúdo restrito ou removido | Sem vazamento; alternativa segura |
| Conta compartilhada | Métricas apresentadas como da conta |
| Gamificação oculta | Estudo e preferências funcionam |
| Três temas e telas estreitas | Contraste, foco e dock preservados |

Executar testes unitários significativos de calendário/transições e testes de integração de persistência/concorrência. Executar teste negativo com dois usuários para os novos dados, não apenas mocks de autorização.

Rodar scripts disponíveis e pertinentes após conferir package.json: lint, testes afetados, tsc e build. Mudanças em autenticação/inputs exigem verificações de segurança previstas no AGENTS.md, incluindo test:content, test:api-auth, build com webpack e audit quando aplicáveis. Registrar erros preexistentes separadamente e não declará-los resolvidos.

Fazer smoke autenticado desktop/mobile nos três temas. Não usar credenciais reais em logs, fixtures ou screenshots. Se o ambiente impedir teste, declarar a lacuna e não classificar o aceite correspondente como aprovado.

## 9. Medição e validação do produto

Indicadores iniciais: início e conclusão de sessões, cumprimento de metas escolhidas, retorno após intervalo e uso da retomada. Posteriormente: revisão em dias diferentes e desempenho em novas questões comparáveis, sempre com tamanho de amostra e período.

Instrumentar somente o necessário, preferindo os próprios registros operacionais. Não adotar rastreador externo neste MVP. Não confundir aumento de uso com ganho de aprendizagem.

Após piloto com usuários voluntários, avaliar: conseguem iniciar sem ajuda? as sessões cabem no tempo disponível? as mensagens ajudam ou pressionam? a gamificação distrai? Registrar resultados e ajustes antes de ampliar. Não estabelecer metas numéricas arbitrárias sem linha de base.

## 10. Entrega e checklist do Antigravity

- [ ] Diagnóstico com caminhos e contratos reais, limitações e evidências.
- [ ] Escopo mínimo implementado; fases futuras separadas.
- [ ] Migrations e tipos coerentes; nenhuma aplicação remota presumida.
- [ ] Calendário, idempotência, concorrência e RLS verificados.
- [ ] Estudo legado, notas, progresso, Mermaid e entitlement preservados.
- [ ] Smoke visual e funcional com resultados registrados.
- [ ] docs/GAMIFICACAO_IMPLEMENTACAO.md com decisões, operação, métricas e rollback.
- [ ] CHANGELOG.md atualizado; commits atômicos; push conforme instruções vigentes.
- [ ] Relatório com arquivos, comportamento, comandos e resultados, riscos e próximos passos.

Distinguir no relatório final: código preparado, testes locais, migration remota aplicada, deploy e visibilidade autenticada. Não escrever “concluído em produção” sem verificar todos os passos correspondentes.

## 11. Referências de produto

- Duolingo, sequências e flexibilidade: https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Duolingo, missões e qualidade do tempo de aprendizagem: https://blog.duolingo.com/time-spent-learning-well/

São referências das mecânicas do produto, não evidência de eficácia para concursos. Metas semanais, ausência de punição e execução incremental são decisões propostas para o PRO.
