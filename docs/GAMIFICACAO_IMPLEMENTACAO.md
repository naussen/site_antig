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
  - `src/lib/gamification/calendar.mjs` e `src/lib/gamification/calendar.d.mts`: validação estrita de fuso horário IANA, fronteira semanal segunda-feira `00:00` → segunda seguinte no fuso do aluno, `resolveEffectiveWeeklyPlan` (semana parcial inicial no primeiro acesso, alterações futuras apenas na próxima segunda-feira e preservação da semana anterior na janela de transição para fusos a oeste via `waitingForPendingTimezone`), `planPreferenceUpdate` (preservando agendamentos `pending_*` em atualizações parciais e não ativando plano quando oculta pré-onboarding) e `previewTimezoneChange`.
  - `src/lib/gamification/session.mjs` e `src/lib/gamification/session.d.mts`: estimativa conservadora sem cortar seção longa, máquina de estados (`in_progress`, `interrupted`, `completed`, `discarded`), idempotência de início/conclusão, `buildStudyRecommendation` restrito a Resumos ativos visíveis e delegação transacional para RPCs quando suportado pelo repositório.
  - `src/lib/gamification/repository.mjs` e `src/lib/gamification/repository.d.mts`: repositório ESM puro conectado exclusivamente a consultas `SELECT` protegidas por RLS e às 6 RPCs transacionais `SECURITY DEFINER`, reutilizado tanto pelo servidor Next.js quanto pela suíte de integração PostgreSQL.
- **Banco de dados reconciliado e endurecido (`053_create_study_routine_gamification.sql`)**:
  - `supabase/migrations/053_create_study_routine_gamification.sql`: reconciliada para `053` após constatação de `052_create_launch_interests.sql` na `origin/main` (`7395ebb`). Define as 4 tabelas (`user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions`, `study_routine_session_activities`), revoga `INSERT`, `UPDATE` e `DELETE` diretos de `PUBLIC`, `anon` e `authenticated`, mantém políticas `FOR SELECT` com `(SELECT auth.uid()) = user_id`, adiciona `trigger_01_rpc_mutation_guard`, triggers de imutabilidade/invariantes de histórico e `CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED` (`trigger_enforce_session_has_activities` / `trigger_enforce_activity_delete_keeps_session_nonempty`), e expõe 6 RPCs `SECURITY DEFINER SET search_path = ''` (`ensure_study_routine_weekly_plan`, `save_study_routine_preferences`, `create_study_routine_session`, `update_study_routine_session_status`, `replace_study_routine_session_activity`, `complete_study_routine_session`), incluindo sincronização semanal (`private.sync_user_study_routine_week`) sem congelamento prematuro durante transições para fusos mais a oeste.
  - `src/types/database.ts`: interfaces e uniões tipadas para as tabelas e status da rotina.
  - `scripts/test-rls-two-users.mjs`: checagens opcionais atualizadas para `053` validando leitura isolada por RLS, rejeição `42501` de DML direto nas 4 tabelas, criação transacional via RPC autenticada, bloqueio por `chargeback`/entitlement e negativa cruzada entre dois usuários.
- **Adaptador servidor, API e UI**:
  - `src/lib/gamification/server.ts`: reexporta os adaptadores de `repository.mjs`, expõe `getApiContentAccess`, ordenação canônica (`sortRoutineTopics`), hidratação compartilhada (`hydrateDashboardRecommendationIfNeeded`), loader de configurações com suporte explícito ao fallback dev (`loadSettingsRoutineStatus`) e loaders de estado (`hydrateRoutineTopicsByIds`, `loadDashboardRoutineState`, `loadStudyTopicRoutineState`). No modo `STUDY_ROUTINE_DEV_FALLBACK=1` (`NODE_ENV !== "production"`), registra `completedContentUnitIds` em memória e tenta sincronizar `user_progress` ao concluir sessão.
  - `src/app/api/study-routine/route.ts`: endpoints `GET` e `POST` com `Cache-Control: no-store` e schema Zod `.strict()` discriminado pelas ações `save_preferences`, `start_session`, `update_session_status`, `replace_unavailable_activity` e `complete_session`.
  - `src/components/gamification/today-study-card.tsx`: card `Estudo de hoje` integrado em `src/app/dashboard/page.tsx`, sincronizando snapshot/rascunhos com `initialSnapshot` atualizado sem `useEffect` (`source: initialSnapshot`) e atualizando dinamicamente as seções sugeridas e estimativa de tempo ao alternar entre `5`, `15` e `30` minutos (`recommendation.optionsByBudget`).
  - `src/components/gamification/study-session-bar.tsx`: barra guiada em `src/app/(study)/[topicId]/study-page-client.tsx` com âncoras `#section-{id}`, estado explícito para sessão pausada (`Sessão pausada` + botão `Retomar sessão` + atalho `Dashboard`), sincronização sem `useEffect` com `initialSnapshot`, conclusão idempotente e atualização local via `markSectionsCompletedLocally` em `src/hooks/use-section-progress.ts`.
  - `src/app/dashboard/configuracoes/page.tsx`: bloco de configuração/visibilidade da rotina (`config-rotina-titulo`) alimentado por `loadSettingsRoutineStatus`.

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
- **Limitações do modo demonstrativo (`STUDY_ROUTINE_DEV_FALLBACK=1`)**: ativo apenas quando `NODE_ENV !== "production"` e a variável `STUDY_ROUTINE_DEV_FALLBACK="1"` está presente no processo do servidor local. Os dados de preferências, planos semanais, sessões e conclusões de rotina ficam apenas em memória global do processo Node (sendo descartados ao reiniciar o servidor) e **não** exercitam RLS, triggers nem RPCs no PostgreSQL/Supabase remoto. O progresso legado de seções (`user_progress`) só persiste no banco se o usuário autenticado tiver linha gravável no Supabase; caso contrário permanece em memória junto com o store demonstrativo.

---

## 3A. Dependências de Teste Versionadas (`devDependencies`)

- **Motivo**: tornar reproduzível via `npm ci` / `npm install` a execução real da migration `053`, dos triggers/RLS em PGlite (`@electric-sql/pglite@^0.5.16`) e da validação de contenção real de locks em PostgreSQL multi-conexão (`pg@^8.13.1`, sem fila sequencial em JS), eliminando a dependência temporária não versionada anteriormente em `tmp/pg-validation`.
- **Alternativa sem dependência**: depender apenas de mocks em memória (incapaz de validar PL/pgSQL, `pg_advisory_xact_lock`, `CONSTRAINT TRIGGER DEFERRABLE` e RLS real) ou de invocação externa via shell ao `psql` (frágil para `Promise.all` concorrente e observação em `pg_locks`).
- **Impacto no bundle**: zero no código de produção (`dependencies` inalterado; pacotes adicionados exclusivamente em `devDependencies` e importados apenas por `tests/gamification-postgres.test.mjs`).
- **Comando de instalação utilizado**: `npm.cmd install --save-dev @electric-sql/pglite@^0.5.16 pg@^8.13.1`
- **Arquivos afetados**: `package.json`, `package-lock.json` e `tests/gamification-postgres.test.mjs`.

---

## 3B. Diferenças entre Ambiente Isolado e Supabase Remoto, Aplicação e Rollback

| Dimensão | Ambiente isolado (`PGlite` + PostgreSQL 18.7) | Supabase remoto de destino | Impacto operacional |
| --- | --- | --- | --- |
| **Autenticação e claims** | Schema `auth` mínimo e `request.jwt.claims` simulados via `set_config` | GoTrue gerenciado com Google OAuth (`provider = 'google'`) e MFA `aal2` para admins | O fluxo completo de sessão OAuth + cookies SSR depende de login Google válido |
| **Histórico de migrations** | Bootstrap das tabelas pré-requisito + 2x `053` no banco `gamification_test` | Histórico `001`–`052` (inclui `026_create_study_planner.sql`, Questões `029`–`051` e `052_create_launch_interests.sql`) | `053` permanece sem colisão de numeração nem de nomes de tabelas/funções |
| **Camada HTTP / PostgREST** | Chamadas SQL diretas às tabelas/RPCs pelo adaptador de teste | Exposição via PostgREST (`/rest/v1/*`) com cache de schema | Após aplicar a `053`, recarregar cache com `NOTIFY pgrst, 'reload schema';` |
| **Permissões gerenciadas** | Papel `authenticated` criado localmente para simular usuário logado | Papéis `anon`, `authenticated`, `service_role` e triggers do projeto | Executar `node scripts/test-rls-two-users.mjs` após a `053` para validar no ambiente real |

### Procedimento concreto de aplicação e smoke test (aguardando autorização operacional)

1. Confirmar que `supabase/migrations` remoto está em dia até `052_create_launch_interests.sql` e gerar snapshot/backup pré-migration.
2. Aplicar `supabase/migrations/053_create_study_routine_gamification.sql` via Supabase CLI (`supabase db push` ou SQL Editor administrativo em transação).
3. Executar `NOTIFY pgrst, 'reload schema';` para atualizar o catálogo do PostgREST.
4. Verificar existência das 4 tabelas (`user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions`, `study_routine_session_activities`) e das 6 RPCs (`ensure_study_routine_weekly_plan`, `save_study_routine_preferences`, `create_study_routine_session`, `update_study_routine_session_status`, `replace_study_routine_session_activity`, `complete_study_routine_session`), confirmando apenas `SELECT` concedido a `authenticated` e zero privilégios a `anon`.
5. Executar smoke automatizado com dois usuários reais contra o banco atualizado (sem `STUDY_ROUTINE_DEV_FALLBACK`):
   `node scripts/test-rls-two-users.mjs`
   Esperado: saída contendo `rotina: verificada nas 4 tabelas (SELECT RLS + bloqueio DML 42501) e RPCs` e limpeza das fixtures.
6. Subir/acessar a prévia **sem** `STUDY_ROUTINE_DEV_FALLBACK=1`, entrar com conta Google autorizada e percorrer o roteiro completo: onboarding de meta/fuso, troca entre `5`/`15`/`30` min, seleção manual, início/pausa/recarregamento/retomada/conclusão de sessão, avanço da recomendação, histórico recente, alteração agendada de meta/fuso, ocultar/reexibir rotina, `/dashboard/configuracoes`, temas Light/Dark/Sepia e viewports desktop (`1280px`) e mobile (`360px`).

### Rollback operacional preservando 100% dos dados (sem `DROP TABLE`)

- **Nível 1 — Desativação imediata de UI e API:** definir `NEXT_PUBLIC_DISABLE_GAMIFICATION="true"` no deploy; a interface deixa de exibir os blocos de rotina e `/api/study-routine` responde HTTP `503` controlado sem tocar nas tabelas.
- **Nível 2 — Bloqueio de mutações no banco preservando histórico:** revogar `EXECUTE` das 6 RPCs para `authenticated` (as 4 tabelas e o progresso existente em `user_progress` permanecem intactos, e o papel `authenticated` mantém apenas `SELECT`):

```sql
REVOKE EXECUTE ON FUNCTION
  public.ensure_study_routine_weekly_plan(BOOLEAN),
  public.save_study_routine_preferences(SMALLINT, TEXT, SMALLINT, TEXT, BOOLEAN, BOOLEAN),
  public.create_study_routine_session(SMALLINT, TEXT, TEXT, JSONB, BOOLEAN),
  public.update_study_routine_session_status(UUID, TEXT),
  public.replace_study_routine_session_activity(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT),
  public.complete_study_routine_session(UUID, UUID[], TEXT, UUID)
FROM authenticated;
```

- **Restauração das permissões previstas pela migration `053`:** quando o incidente operacional estiver resolvido, restaurar os privilégios exatos da migration para `authenticated` e `service_role`:

```sql
GRANT EXECUTE ON FUNCTION
  public.ensure_study_routine_weekly_plan(BOOLEAN),
  public.save_study_routine_preferences(SMALLINT, TEXT, SMALLINT, TEXT, BOOLEAN, BOOLEAN),
  public.create_study_routine_session(SMALLINT, TEXT, TEXT, JSONB, BOOLEAN),
  public.update_study_routine_session_status(UUID, TEXT),
  public.replace_study_routine_session_activity(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT),
  public.complete_study_routine_session(UUID, UUID[], TEXT, UUID)
TO authenticated, service_role;
```

---

## 4. Evidências de Verificação Local (2026-11-14)

Todas as checagens abaixo foram executadas após a última edição da entrega na branch `docs/plano-gamificacao-antigravity`:

| Verificação | Resultado observado | Escopo e observações |
| --- | --- | --- |
| `npm.cmd run test:gamification` | 33/33 aprovados, 0 falhas, 0 ignorados | `gamification-calendar.test.mjs`, `gamification-session.test.mjs` (inclui isolamento em memória do fallback sem mutações Supabase), `gamification-ui.test.mjs` e `gamification-postgres.test.mjs` (PGlite + PostgreSQL 18 multi-conexão + execução real dos blocos `REVOKE`/`GRANT`) |
| `npm.cmd run test:content` | 44/44 aprovados, 0 falhas, 0 ignorados | Contrato editorial e importação preservados |
| `npm.cmd run test:api-auth` | 3/3 aprovados, 0 falhas, 0 ignorados | Autenticação admin |
| `npm.cmd run test:auth` | 9/9 aprovados, 0 falhas, 0 ignorados | OAuth Google e guardas |
| `npm.cmd run test:site-paths` | 3/3 aprovados, 0 falhas, 0 ignorados | Prefixos `/resumos` |
| `npm.cmd run test:highlights` | 9/9 aprovados, 0 falhas, 0 ignorados | Realces e same-origin |
| `npm.cmd run test:payments` | 14/14 aprovados, 0 falhas, 0 ignorados | Webhooks e cancelamento |
| Demais 14 suítes em `tests/*.test.mjs` | 37/37 aprovados, 0 falhas, 0 ignorados | `content-import-governance`, `dashboard-navigation-a11y`, `dashboard-preferences-ux`, `gateway-rules`, `import-route-security`, `markdown-mermaid`, `mermaid-render-queue`, `mermaid-transition-labels`, `note-images`, `payment-logging`, `return-paths`, `security-headers`, `user-start-page`, `webhook-body-limit` |
| Varredura estática / contratos em `gamification-ui.test.mjs` | Aprovada | Módulos `src/lib/gamification/*`, `src/app/api/study-routine/*`, `src/components/gamification/*` sem sinks inseguros ou escrita remota em fallback |
| `npx.cmd eslint src scripts tests` | Exit 0 (0 erros, 1 warning preexistente) | Warning preexistente em `scripts/content-admin.mjs:266:31` |
| `npx.cmd tsc --noEmit` | Exit 0 | Tipagem global sem erros |
| `npm.cmd run build -- --webpack` | Exit 0 | Build de produção concluído, `27/27` páginas estáticas e rota `ƒ /api/study-routine` |
| `node --check scripts/test-rls-two-users.mjs` | Exit 0 | Sintaxe validada; execução contra Supabase remoto pendente da aplicação da `053` |
| Inspeção em navegador (`http://127.0.0.1:3000`) | Parcial / Bloqueada para rotas autenticadas (`AUTH_REQUIRED`) | Nova checagem em `http://127.0.0.1:3000/resumos/dashboard` redirecionou para `/resumos/login` (HTTP 200); sem sessão Google OAuth ativa, os fluxos autenticados não foram executados |

### Pendente de ambiente remoto e inspeção manual autenticada

- Login Google manual na prévia local (`http://127.0.0.1:3000/resumos/dashboard`) para inspeção visual autenticada ponta a ponta nos temas **Light**, **Dark** e **Sepia** (desktop `1280px` e mobile `360px`).
- Aplicação controlada da migration `053_create_study_routine_gamification.sql` no Supabase (acima de `052_create_launch_interests.sql` já presente na `origin/main`).
- Execução real de `scripts/test-rls-two-users.mjs` contra o projeto Supabase remoto após aplicação da `053` e smoke autenticado sem `STUDY_ROUTINE_DEV_FALLBACK`.
