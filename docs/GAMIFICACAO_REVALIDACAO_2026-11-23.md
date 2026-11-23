# Questões e gamificação — revalidação de 23/11/2026

## Escopo e origem

Verificação da entrega existente em `4830b5c60cf144d80b7ed17b6f56a9b2b4bc790d`, na worktree `C:\PRO\worktrees\questoes-experiencia-20261122`. A branch do checkout principal `C:\PRO\site` (`docs/plano-gamificacao-antigravity`, `6763280`) é uma origem histórica, não a versão atual da main. Suas alterações locais foram preservadas.

Nenhuma migration foi reaplicada, nenhum dado remoto foi alterado e nenhuma funcionalidade foi acrescentada. O corpus de leis não foi revisado. A conferência com conta de aluno foi dispensada pelo usuário.

## Evidência de produção

Leituras realizadas em 23/11/2026, aproximadamente às 10:59 UTC (07:59 em São Paulo):

- `git fetch origin main`: `origin/main` em `4830b5c60cf144d80b7ed17b6f56a9b2b4bc790d`.
- API administrativa da Netlify: site `proresumos`, domínio `https://proconcursos.com.br`, deploy publicado `6b03709d34e5f5de846850e8`, estado `ready`, mesmo commit, publicação em `2026-11-22T22:47:39.642Z`.
- As tabelas `user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions` e `study_routine_session_activities` responderam sem erro. Contagens agregadas: 1, 1, 0 e 0, respectivamente. A existência das tabelas confirma disponibilidade no catálogo; não substitui uma nova auditoria remota de privilégios, triggers ou RPCs.
- A seção ativa `orcamento-publico-constituicao-federal-e-lei-4-320-sec-05` foi encontrada. A Constituição `cf-88` e sua versão corrente estão publicadas e contêm `cf-88.art-165.paragrafo-5`. A questão `pdf:dpf14_009_01:071` está `published`.
- `GET https://proconcursos.com.br/resumos/api/study-routine`, sem sessão: HTTP 401, mensagem de sessão ausente ou expirada. O endpoint não expôs estado pessoal.

Foram usadas apenas consultas de leitura para essas verificações. Nenhuma credencial, identidade de aluno ou conteúdo pessoal integra este recibo.

## Verificação local

| Comando | Resultado |
| --- | --- |
| `npm.cmd run test:questions` | 32 aprovados; 0 falhas; 0 ignorados |
| `npm.cmd run test:gamification` | 34 aprovados; 0 falhas; 0 ignorados |
| `node --test tests/question-filters-and-review.test.mjs` | 3 aprovados; 0 falhas; 0 ignorados |

A suíte de gamificação terminou com código 0. Inclui PostgreSQL real com múltiplas conexões e contenção de locks, transição de fuso, isolamento entre usuários, atomicidade, rollback/restauração e coexistência das fixtures 026/052 com a migration 053. A mensagem de erro `42501` durante o caso negativo de autorização foi esperada; o teste correspondente passou.

Os testes de filtros/revisão verificam contratos de código e SQL; não equivalem a executar a fila pessoal de um aluno no PostgREST remoto. Lint, build e inspeção visual não foram repetidos neste incremento exclusivamente documental.

## Comportamento conferido e limites

- A rotina semanal permanece baseada em sessões de Resumos. O painel oferece revisão opcional de até cinco questões cuja última tentativa da conta foi incorreta há pelo menos 24 horas. O SQL exclui questões ocultadas mesmo quando o filtro de ocultas é solicitado.
- O percurso LOA só aparece com rotina ativa e seção no catálogo visível. O componente consulta a norma publicada e a questão pelo cliente autenticado; indisponibilidade dos destinos impede a exibição do percurso.
- Os links usam os controles existentes de cada módulo. Resolver uma questão ou ler a lei não conclui automaticamente uma sessão de Resumos nem acrescenta um dia à meta semanal. Transformar esses percursos em sessões multicomponente exige decisão de produto e implementação própria; não é uma validação pendente desta entrega.
- A leitura administrativa de disponibilidade não comprova acesso por todos os entitlements. Não houve nova sessão autenticada, teste visual nos três temas/larguras ou teste remoto com dois usuários neste incremento. Os testes locais de isolamento passaram.
- Não foi identificado motivo para reaplicar a migration 053 ou alterar o código neste escopo. As referências antigas a migration pendente no documento de implementação ficam preservadas como histórico, subordinadas ao adendo atual.

## Próxima iteração

Retomar em `origin/main` e reler `C:\PRO\AGENTS.md`, este recibo e `docs/GAMIFICACAO_IMPLEMENTACAO.md`. Revalidar o deploy e os contratos antes de qualquer escrita. Preservar alterações locais. Não reaplicar 053 apenas por uma pendência histórica. Novas missões, conclusão integrada e mudança na ordem de expansão dependem da decisão prévia do usuário. Em correção futura que afete interface, validar os três temas e desktop/celular; em autorização ou persistência, repetir negativos locais e testes remotos proporcionais, sem expor dados pessoais. A dispensa de conferência com conta de aluno permanece válida no programa atual.
