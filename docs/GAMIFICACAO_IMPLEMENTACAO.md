# Implementação do MVP de Gamificação — Rotina Semanal e Sessões Curtas (Fases 1 e 2)

Data de registro: 2026-11-14  
Branch: `docs/plano-gamificacao-antigravity`  
Diagnóstico de referência: `docs/GAMIFICACAO_DIAGNOSTICO.md` (`3de41a7`)  
Escopo entregue: Fases 1 e 2 de `docs/PLANO_GAMIFICACAO_ANTIGRAVITY.md` (Fases 3 a 5 fora deste incremento).

---

## 1. Resumo Arquitetural

O MVP implementa uma rotina semanal flexível (1 a 7 dias por semana) e sessões curtas guiadas (`5`, `15` ou `30` minutos) operando exclusivamente sobre **Resumos ativos** (`archived_at IS NULL`), conforme constatado no diagnóstico da Fase 0 (`topic_legal_fragment_relations = 0`, `law_flashcards` publicados `= 0` e módulos de Questões e PRO Legis fora desta branch).

### Módulos entregues

- **Domínio puro e calendário (Fase 1 — commit `bb755ba`)**:
  - `src/lib/gamification/config.mjs` e `src/lib/gamification/config.d.mts`: constantes, limites e chave operacional `isGamificationOperationalEnabled` controlada por `NEXT_PUBLIC_DISABLE_GAMIFICATION !== "true"`.
  - `src/lib/gamification/calendar.mjs` e `src/lib/gamification/calendar.d.mts`: validação estrita de fuso horário IANA, fronteira semanal segunda-feira `00:00` → segunda seguinte no fuso do aluno, `resolveEffectiveWeeklyPlan` (semana parcial inicial no primeiro acesso e alterações futuras apenas na próxima segunda-feira) e `previewTimezoneChange` (preservando histórico sem deslocamento retroativo).
  - `src/lib/gamification/session.mjs` e `src/lib/gamification/session.d.mts`: estimativa conservadora sem cortar seção longa, máquina de estados (`in_progress`, `interrupted`, `completed`, `discarded`), idempotência de início/conclusão e `buildStudyRecommendation` restrito a Resumos ativos visíveis.
  - `supabase/migrations/052_create_study_routine_gamification.sql`: tabelas `user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions` e `study_routine_session_activities`, função RPC `complete_study_routine_session`, índices únicos parciais, triggers e políticas RLS para `authenticated` (`auth.uid() = user_id`).
  - `src/types/database.ts`: interfaces e uniões tipadas para as tabelas e status da rotina.
  - `scripts/test-rls-two-users.mjs`: extensão com verificações opcionais da migration `052` (ignora apenas quando o schema remoto ainda não possui as tabelas da `052`).

- **Adaptador servidor, API e UI (Fase 2 — commit `73733b5`)**:
  - `src/lib/gamification/server.ts`: repositório Supabase autenticado (`createSupabaseRoutineRepository`), `RoutineSchemaUnavailableError`, `getApiContentAccess`, `isRoutineSchemaError`, `logRoutineServerError`, ordenação canônica (`sortRoutineTopics`) e carregamento com hidratação sob demanda (`hydrateRoutineTopicsByIds`, `loadDashboardRoutineState`, `loadStudyTopicRoutineState`), evitando baixar o Markdown completo de todas as seções no Dashboard.
  - `src/app/api/study-routine/route.ts`: endpoints `GET` e `POST` com `Cache-Control: no-store` e schema Zod `.strict()` discriminado pelas ações `save_preferences`, `start_session`, `update_session_status`, `replace_unavailable_activity` e `complete_session`.
  - `src/components/gamification/today-study-card.tsx`: card `Estudo de hoje` integrado em `src/app/dashboard/page.tsx`, com configuração de meta semanal/orçamento/fuso, opção de ocultar/reativar, continuação de sessão e substituição explícita de conteúdo arquivado.
  - `src/components/gamification/study-session-bar.tsx`: barra guiada em `src/app/(study)/[topicId]/study-page-client.tsx` (carregada por `src/app/(study)/[topicId]/page.tsx`) com âncoras `#section-{id}`, marcação de conclusão idempotente, estado parcial sem sucesso falso e atualização local via `markSectionsCompletedLocally` em `src/hooks/use-section-progress.ts`.
  - `src/app/dashboard/configuracoes/page.tsx`: bloco de configuração/visibilidade da rotina (`config-rotina-titulo`) sincronizado com as preferências do usuário.

---

## 2. Garantias de Negócio, Segurança e Isolamento

1. **Autenticação, autorização e origem**: todas as chamadas de `/api/study-routine` passam por `getApiContentAccess`; mutações `POST` exigem `isSameOriginRequest`, corpo JSON limitado a `32 * 1024` bytes (`readJsonBodyLimited`) e validação Zod `.strict()`.
2. **Isolamento de dados e zero uso de `service_role` no cliente**: RLS na migration `052` restringe leitura/escrita ao proprietário (`auth.uid() = user_id`), e `SUPABASE_SERVICE_ROLE_KEY` não aparece nos módulos de gamificação do cliente ou do adaptador autenticado.
3. **Integridade de histórico e concorrência**:
   - `completed_local_date` único por usuário/data local impede duplicidade de crédito diário na semana;
   - chaves `idempotencyKey` (início) e `completionIdempotencyKey` (conclusão) evitam sessões ou conclusões duplicadas em duplo clique ou abas simultâneas;
   - falha antes da persistência preserva a sessão sem falso sucesso;
   - conclusão é aditiva ao progresso granular (`user_progress`) e desmarcar seção posteriormente não apaga histórico de sessão concluída.
4. **Sanitização e interface**:
   - chamadas cliente usam `withSiteBasePath("/api/study-routine")` respeitando `basePath: "/resumos"`;
   - componentes utilizam exclusivamente classes Tailwind e variáveis CSS de `src/app/globals.css` (compatíveis com temas Light, Dark e Sepia), `aria-live`/`role="status"`/`role="alert"` e `motion-reduce:`;
   - varredura estática não identificou `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function` ou `SUPABASE_SERVICE_ROLE_KEY`.

---

## 3. Operação, Degradação Segura e Rollback

- **Antes da aplicação da migration `052`**: `isRoutineSchemaError` converte erros de tabela/função ausente (`RoutineSchemaUnavailableError`), fazendo `GET`/`POST /api/study-routine` responderem HTTP `503` controlado sem mock de dados em produção e mantendo `/dashboard`, `/[topicId]` e `/dashboard/configuracoes` operacionais com estado informativo.
- **Rollback operacional imediato (feature flag)**: configurar `NEXT_PUBLIC_DISABLE_GAMIFICATION="true"` desabilita os fluxos da rotina via `isGamificationOperationalEnabled` sem necessidade de reverter código ou alterar tabelas existentes (`user_progress`, `notes`, `user_highlights`, assinaturas).
- **Aplicação da migration**: `supabase/migrations/052_create_study_routine_gamification.sql` ainda **não** foi aplicada ao banco remoto neste incremento e depende de revisão e execução controlada fora desta entrega.

---

## 4. Evidências de Verificação Local (2026-11-14)

Executado no estado final do código da branch `docs/plano-gamificacao-antigravity` antes da criação deste documento:

| Verificação | Resultado observado | Observações |
| --- | --- | --- |
| `npm.cmd run test:gamification` | 20/20 aprovados, 0 falhas, 0 ignorados | `gamification-calendar.test.mjs`, `gamification-session.test.mjs`, `gamification-ui.test.mjs` |
| `npm.cmd run test:content` | 44/44 aprovados, 0 falhas, 0 ignorados | Contrato editorial e importação preservados |
| `npm.cmd run test:api-auth` | 3/3 aprovados, 0 falhas, 0 ignorados | Autenticação admin |
| `npm.cmd run test:auth` | 9/9 aprovados, 0 falhas, 0 ignorados | OAuth Google e guardas |
| `npm.cmd run test:site-paths` | 3/3 aprovados, 0 falhas, 0 ignorados | Prefixos `/resumos` |
| `npm.cmd run test:highlights` | 9/9 aprovados, 0 falhas, 0 ignorados | Realces e same-origin |
| `npm.cmd run test:payments` | 14/14 aprovados, 0 falhas, 0 ignorados | Webhooks e cancelamento |
| `node --test` (navegação/UX/segurança) | 9/9 aprovados, 0 falhas, 0 ignorados | `dashboard-navigation-a11y`, `dashboard-preferences-ux`, `return-paths`, `security-headers`, `user-start-page` |
| `node --test` (restantes de `tests/*.test.mjs`) | 28/28 aprovados, 0 falhas, 0 ignorados | `content-import-governance`, `gateway-rules`, `import-route-security`, `markdown-mermaid`, `mermaid-render-queue`, `mermaid-transition-labels`, `note-images`, `payment-logging`, `webhook-body-limit` |
| Varredura estática de sinks inseguros (`Select-String`) | `SAFE_SINK_SCAN_CLEAN` (exit 0) | `src/lib/gamification/*`, `src/app/api/study-routine/*`, `src/components/gamification/*` |
| `npx.cmd eslint src scripts tests` | Exit 0 (0 erros, 1 warning preexistente) | Warning preexistente em `scripts/content-admin.mjs:266:31`; `npm run lint` sem diretório varre `.worktrees/` preexistente |
| `npx.cmd tsc --noEmit` | Exit 0 | Tipagem global sem erros |
| `npm.cmd run build -- --webpack` | Exit 0 | `Compiled successfully in 2.2min`, `Finished TypeScript in 32.3s`, `27/27` páginas estáticas, rota `ƒ /api/study-routine` listada |
| `npm.cmd audit --omit=dev` | Exit 1 (10 advisories preexistentes) | `5 low, 3 high, 2 critical` (`dompurify`, `katex`/`mermaid`/`micromark-extension-math`/`remark-math`/`rehype-katex`, `next`, `sharp`, `source-map-js`, `zod`); nenhuma dependência adicionada |
| `node --check scripts/test-rls-two-users.mjs` | Exit 0 (Fase 1) | Sintaxe validada; execução remota contra tabelas da `052` pendente da migration |

### Pendente de ambiente remoto e inspeção manual

- Aplicação controlada da migration `052_create_study_routine_gamification.sql` no Supabase.
- Execução real de `scripts/test-rls-two-users.mjs` validando `user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions`, `study_routine_session_activities` e `complete_study_routine_session` após a `052`.
- Smoke test HTTP autenticado em `/dashboard`, `/[topicId]`, `/dashboard/configuracoes` e `/api/study-routine` após deploy em ambiente com sessão real.
- Conferência visual autenticada em navegador nos temas **Light**, **Dark** e **Sepia** em viewport desktop e mobile.
