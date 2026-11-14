# Implementação do MVP de Gamificação — Rotina Semanal e Sessões Curtas (Fases 1 e 2)

Data de registro: 2026-11-14  
Branch: `docs/plano-gamificacao-antigravity`  
Diagnóstico de referência: `docs/GAMIFICACAO_DIAGNOSTICO.md`  
Escopo entregue: Fases 1 e 2 de `docs/PLANO_GAMIFICACAO_ANTIGRAVITY.md` (Fases 3 a 5 fora deste incremento).

---

## 1. Resumo Arquitetural e Endurecimento

O MVP implementa uma rotina semanal flexível (1 a 7 dias por semana) e sessões curtas guiadas (`5`, `15` ou `30` minutos) operando exclusivamente sobre **Resumos ativos** (`archived_at IS NULL`), conforme constatado no diagnóstico da Fase 0 (`topic_legal_fragment_relations = 0`, `law_flashcards` publicados `= 0` e módulos de Questões e PRO Legis fora desta branch).

### Módulos entregues e revisados

- **Domínio puro e calendário (`src/lib/gamification/*`)**:
  - `src/lib/gamification/config.mjs` e `src/lib/gamification/config.d.mts`: constantes, limites e chave operacional `isGamificationOperationalEnabled` controlada por `NEXT_PUBLIC_DISABLE_GAMIFICATION !== "true"`.
  - `src/lib/gamification/calendar.mjs` e `src/lib/gamification/calendar.d.mts`: validação estrita de fuso horário IANA, fronteira semanal segunda-feira `00:00` → segunda seguinte no fuso do aluno, `resolveEffectiveWeeklyPlan` (semana parcial inicial no primeiro acesso e alterações futuras apenas na próxima segunda-feira), `planPreferenceUpdate` (preservando agendamentos `pending_*` em atualizações parciais e não ativando plano quando oculta pré-onboarding) e `previewTimezoneChange`.
  - `src/lib/gamification/session.mjs` e `src/lib/gamification/session.d.mts`: estimativa conservadora sem cortar seção longa, máquina de estados (`in_progress`, `interrupted`, `completed`, `discarded`), idempotência de início/conclusão, `buildStudyRecommendation` restrito a Resumos ativos visíveis e delegação transacional para RPCs quando suportado pelo repositório.
  - `src/lib/gamification/repository.mjs` e `src/lib/gamification/repository.d.mts`: repositório ESM puro conectado exclusivamente a consultas `SELECT` protegidas por RLS e às 6 RPCs transacionais `SECURITY DEFINER`, reutilizado tanto pelo servidor Next.js quanto pela suíte de integração PostgreSQL.
- **Banco de dados reconciliado e endurecido (`053_create_study_routine_gamification.sql`)**:
  - `supabase/migrations/053_create_study_routine_gamification.sql`: reconciliada para `053` após constatação de `052_create_launch_interests.sql` na `origin/main` (`7395ebb`). Define as 4 tabelas (`user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions`, `study_routine_session_activities`), revoga `INSERT`, `UPDATE` e `DELETE` diretos de `PUBLIC`, `anon` e `authenticated`, mantém políticas `FOR SELECT` com `(SELECT auth.uid()) = user_id`, adiciona `trigger_01_rpc_mutation_guard`, triggers de imutabilidade/invariantes de histórico e `CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED` (`trigger_enforce_session_has_activities` / `trigger_enforce_activity_delete_keeps_session_nonempty`), e expõe 6 RPCs `SECURITY DEFINER SET search_path = ''` (`ensure_study_routine_weekly_plan`, `save_study_routine_preferences`, `create_study_routine_session`, `update_study_routine_session_status`, `replace_study_routine_session_activity`, `complete_study_routine_session`).
  - `src/types/database.ts`: interfaces e uniões tipadas para as tabelas e status da rotina.
  - `scripts/test-rls-two-users.mjs`: checagens opcionais atualizadas para `053` validando leitura isolada por RLS, rejeição `42501` de DML direto nas 4 tabelas, criação transacional via RPC autenticada, bloqueio por `chargeback`/entitlement e negativa cruzada entre dois usuários.
- **Adaptador servidor, API e UI**:
  - `src/lib/gamification/server.ts`: reexporta os adaptadores de `repository.mjs`, expõe `getApiContentAccess`, ordenação canônica (`sortRoutineTopics`) e loaders com hidratação sob demanda (`hydrateRoutineTopicsByIds`, `loadDashboardRoutineState`, `loadStudyTopicRoutineState`).
  - `src/app/api/study-routine/route.ts`: endpoints `GET` e `POST` com `Cache-Control: no-store` e schema Zod `.strict()` discriminado pelas ações `save_preferences`, `start_session`, `update_session_status`, `replace_unavailable_activity` e `complete_session`.
  - `src/components/gamification/today-study-card.tsx`: card `Estudo de hoje` integrado em `src/app/dashboard/page.tsx`, sincronizando controles de rascunho (`draftTargetDays`, `draftTimezone`, `draftBudget`, `draftDiscipline`) com o snapshot atualizado.
  - `src/components/gamification/study-session-bar.tsx`: barra guiada em `src/app/(study)/[topicId]/study-page-client.tsx` com âncoras `#section-{id}`, conclusão idempotente e atualização local via `markSectionsCompletedLocally` em `src/hooks/use-section-progress.ts`.
  - `src/app/dashboard/configuracoes/page.tsx`: bloco de configuração/visibilidade da rotina (`config-rotina-titulo`).

---

## 2. Garantias de Negócio, Segurança e Integridade

1. **Autenticação, autorização e origem**: chamadas a `/api/study-routine` passam por `getApiContentAccess`; mutações `POST` exigem `isSameOriginRequest`, corpo JSON limitado a `32 * 1024` bytes e validação Zod `.strict()`.
2. **Escrita direta bloqueada no banco (`REVOKE` + Triggers + RLS)**:
   - O papel `authenticated` tem apenas `SELECT` nas 4 tabelas (isolado por `FOR SELECT TO authenticated` com `(SELECT auth.uid()) = user_id`), e `anon` não possui leitura nem escrita;
   - `SUPABASE_SERVICE_ROLE_KEY` não aparece nos módulos de gamificação do cliente ou do adaptador autenticado;
   - As 6 RPCs `SECURITY DEFINER` validam `auth.uid()` + `private.has_active_content_access()`, serializam concorrência por usuário com `pg_advisory_xact_lock` e gravam carimbos de tempo com `now()` do servidor;
   - Triggers de banco impõem imutabilidade dos planos semanais (`study_routine_weekly_plans`) e sessões encerradas (`completed`/`discarded`), coerência de `completed_local_date`/`completed_week_start_date`/`completed_timezone_iana`, integridade de conteúdo ativo em resumos e proibição de sessão sem atividades no `COMMIT`.
3. **Integridade transacional, idempotência e preservações parciais**:
   - Criação de sessão, descarte opcional da sessão anterior e gravação das atividades ocorrem numa única transação na RPC `create_study_routine_session`, sem criação parcial nem `setTimeout`;
   - Atualizações parciais (`hideGamification`, orçamento ou disciplina preferida sem reenviar meta/fuso) preservam `pending_target_days`, `pending_timezone_iana` e `pending_effective_week_start`, e ocultar antes do onboarding não grava `onboarding_completed_at` nem fabrica plano semanal.
4. **Sanitização e interface**:
   - Chamadas cliente usam `withSiteBasePath("/api/study-routine")`, classes Tailwind e tokens de `src/app/globals.css` (Light, Dark e Sepia), `aria-live`/`role="status"`/`role="alert"` e `motion-reduce:`.

---

## 3. Operação, Degradação Segura e Rollback

- **Antes da aplicação da migration `053`**: `isRoutineSchemaError` detecta tabelas ou RPCs ausentes (`42P01`, `PGRST205`, `42883`, `PGRST202`), fazendo `GET`/`POST /api/study-routine` responderem HTTP `503` controlado e mantendo `/dashboard`, `/[topicId]` e `/dashboard/configuracoes` operacionais.
- **Rollback operacional imediato (feature flag)**: `NEXT_PUBLIC_DISABLE_GAMIFICATION="true"` desabilita a rotina via `isGamificationOperationalEnabled`.
- **Aplicação da migration**: `supabase/migrations/053_create_study_routine_gamification.sql` ainda **não** foi aplicada ao banco remoto neste incremento e depende de revisão e execução controlada fora desta entrega.

---

## 4. Evidências de Verificação Local (2026-11-14)

Todas as checagens abaixo foram executadas após a última edição da entrega na branch `docs/plano-gamificacao-antigravity`:

| Verificação | Resultado observado | Escopo e observações |
| --- | --- | --- |
| `npm.cmd run test:gamification` | 27/27 aprovados, 0 falhas, 0 ignorados | `gamification-calendar.test.mjs`, `gamification-session.test.mjs`, `gamification-ui.test.mjs` e suíte PostgreSQL real `gamification-postgres.test.mjs` em PGlite local com aplicação dupla/idempotente da migration `053` |
| `npm.cmd run test:content` | 44/44 aprovados, 0 falhas, 0 ignorados | Contrato editorial e importação preservados |
| `npm.cmd run test:api-auth` | 3/3 aprovados, 0 falhas, 0 ignorados | Autenticação admin |
| `npm.cmd run test:auth` | 9/9 aprovados, 0 falhas, 0 ignorados | OAuth Google e guardas |
| `npm.cmd run test:site-paths` | 3/3 aprovados, 0 falhas, 0 ignorados | Prefixos `/resumos` |
| `npm.cmd run test:highlights` | 9/9 aprovados, 0 falhas, 0 ignorados | Realces e same-origin |
| `npm.cmd run test:payments` | 14/14 aprovados, 0 falhas, 0 ignorados | Webhooks e cancelamento |
| Demais 14 suítes em `tests/*.test.mjs` | 37/37 aprovados, 0 falhas, 0 ignorados | `content-import-governance`, `dashboard-navigation-a11y`, `dashboard-preferences-ux`, `gateway-rules`, `import-route-security`, `markdown-mermaid`, `mermaid-render-queue`, `mermaid-transition-labels`, `note-images`, `payment-logging`, `return-paths`, `security-headers`, `user-start-page`, `webhook-body-limit` |
| Varredura estática de sinks inseguros e `service_role` | Limpa | Módulos `src/lib/gamification/*`, `src/app/api/study-routine/*`, `src/components/gamification/*` |
| `npx.cmd eslint src scripts tests` | Exit 0 (0 erros, 1 warning preexistente) | Warning preexistente em `scripts/content-admin.mjs:266:31` |
| `npx.cmd tsc --noEmit` | Exit 0 | Tipagem global sem erros |
| `npm.cmd run build -- --webpack` | Exit 0 | Build de produção concluído, `27/27` páginas estáticas e rota `ƒ /api/study-routine` |
| `node --check scripts/test-rls-two-users.mjs` | Exit 0 | Sintaxe validada; execução contra Supabase remoto pendente da aplicação da `053` |

### Pendente de ambiente remoto e inspeção manual

- Aplicação controlada da migration `053_create_study_routine_gamification.sql` no Supabase (acima de `052_create_launch_interests.sql` já presente na `origin/main`).
- Execução real de `scripts/test-rls-two-users.mjs` contra o projeto Supabase remoto após aplicação da `053`.
- Smoke test HTTP autenticado em `/dashboard`, `/[topicId]`, `/dashboard/configuracoes` e `/api/study-routine` em ambiente com sessão real.
- Conferência visual autenticada em navegador nos temas **Light**, **Dark** e **Sepia** em viewport desktop e mobile.
