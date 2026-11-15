# Diagnóstico da Fase 0 — Gamificação (PRO Resumos)

Data da inspeção: 14/11/2026.
Branch inspecionada: `docs/plano-gamificacao-antigravity` (`b5591b9`, rastreando `origin/docs/plano-gamificacao-antigravity`, ancestral comum `d837eb1` com `main`).
Branch principal de produção/referência no repositório: `main` (`f6febbd` local / `e7ae73a` em `origin/main`), que contém migrations `026` a `051` (incluindo `026_create_study_planner.sql` e o módulo de Questões `029`–`051`).

> [!IMPORTANT]
> Este diagnóstico distingue explicitamente o que **existe no código desta branch**, o que **existe na branch `main` ou no repositório `C:\PRO\legis`**, o que **existe no banco Supabase compartilhado** (verificado por consulta somente-leitura via Service Role em `.env.local` em 14/11/2026) e o que **está publicado e acessível**. Nenhuma migration remota foi aplicada nem houve alteração em produção neste estágio.

---

## 1. Matriz obrigatória de diagnóstico

| Item | Existe no código (branch atual) | Existe no código (`main` ou outro projeto) | Existe no banco compartilhado (14/11/2026) | Publicado e acessível ao aluno | Consequência para o MVP |
| --- | --- | --- | --- | --- | --- |
| **Resumos** | Sim: `src/app/dashboard/page.tsx`, `src/app/(study)/[topicId]/page.tsx`, `src/app/(study)/[topicId]/study-page-client.tsx`, `src/hooks/use-section-progress.ts`, `src/lib/topic-order.ts`, `supabase/migrations/022_add_stable_content_units.sql`. | Sim (mesma base de Resumos). | `topics`: 547 totais (`543` com `archived_at IS NULL`); `sections`: 2.340 totais (`2.008` com `archived_at IS NULL`); `user_progress`: 7 linhas; `user_dashboard_preferences`: 6 linhas. | Sim: 543 tópicos e 2.008 seções ativas (exigindo sessão Google + entitlement ativo / admin AAL2). | **Fonte principal do MVP.** Reaproveitar `content_unit_id` (UUID permanente), `section_id`, `topic_id` e atualização aditiva em `user_progress`, sem converter checkboxes antigos em sessões retroativas e sem desmarcar seção concluída ao revisar. |
| **Leis (PRO Legis)** | Schema nas migrations `010`–`017` e tipos em `src/types/database.ts`; link `/legis` em `src/components/navigation/dashboard-navigation.tsx`. | Sim: o leitor completo pertence ao projeto separado `C:\PRO\legis` (`src/app/[lawSlug]/page.tsx`, `src/app/[lawSlug]/integral/page.tsx`, `src/app/api/progress/route.ts`). | `laws`: 15 totais (`5` com `status = 'published'`: `cf-88`, `codigo-tributario-nacional`, `codigo-civil`, `codigo-penal`, `lei-de-responsabilidade-fiscal`; `10` em `draft`); `law_versions`: 17; `legal_fragments`: 27.233; `user_law_progress`: 13 linhas. | Parcial (no app separado `C:\PRO\legis` sob `/legis`, 5 leis publicadas). Sem código do leitor neste repositório `C:\PRO\site`. | **Fora da seleção direta neste incremento.** Não copiar o leitor de `C:\PRO\legis` para este checkout nem criar missão/botão órfão para Leis; manter o tipo `law` previsto no schema para integração futura (Fase 4). |
| **Questões** | Apenas especificação documental em `docs/PLANO_PROJETO_MODULO_QUESTOES.md`. | Sim: implementado na branch `main` (migrations `029` a `051` e rotas do módulo de Questões). | `questions`: 2.085 totais (`2.050` com `status = 'published'`); `disciplines`: 56; `question_explanations`: 2.085 (`2.085` com `status = 'published'`); `user_question_attempts`: 7 linhas. | Não existe rota de Questões no código desta branch `docs/plano-gamificacao-antigravity`. | **Fora do MVP das Fases 1 e 2.** Não construir revisão de erros (Fase 3) nem missão de questões neste checkout; registrar lacuna de fronteira entre branches. |
| **Flashcards** | Nos Resumos: JSONB em `sections.flashcards` renderizado por `src/components/study/flashcard-deck.tsx` (estado puramente local em React, sem ID persistente por cartão e sem tabela de respostas). Para Leis: tabela `law_flashcards` e RPC `answer_law_flashcard` na migration `010`. | Leitor de flashcards de leis em `C:\PRO\legis/src/app/api/flashcards/answer/route.ts`. | `law_flashcards`: 5 totais (`0` com `status = 'published'`); `user_law_flashcard_answers`: 0 linhas. Flashcards de Resumos permanecem sem histórico individual no banco. | Flashcards de Resumos são exibidos inline dentro da seção; `law_flashcards` publicados: `0`. | **Não contabilizar virar ou responder flashcard embutido como conclusão automática no MVP.** Manter tipo `flashcard` apenas previsto no domínio para evolução futura. |
| **Relações entre módulos** | Schema `topic_legal_fragment_relations` na migration `010` e tipos em `src/types/database.ts`. | Relações `topic_discipline_relations`, `question_discipline_relations` e `question_topic_relations` criadas nas migrations `029`+ da branch `main`. | `topic_legal_fragment_relations`: `0` linhas; `topic_discipline_relations`: 547; `question_discipline_relations`: 2.085; `question_topic_relations`: 2.085. | Vínculos Resumo–Lei vazios (`0`). Vínculos de Questões existem no banco, porém sem módulo consumidor nesta branch. | Não associar módulos por título. Manter o MVP determinístico restrito às unidades ativas de Resumos (`sections.content_unit_id` e `topics.topic_id`). |
| **Conta e acesso** | `src/lib/content-access.ts` (`requireContentAccess`), `src/lib/auth/google-only.mjs`, `src/app/dashboard/layout.tsx`, `src/app/dashboard/conta/page.tsx`, `src/app/api/privacy-requests/route.ts`, `supabase/migrations/009`, `024`, `025`. | Mesmo sistema compartilhado de autenticação Google OAuth, MFA AAL2 admin e entitlement. | `user_entitlements` + `payment_access_blocks` com guarda `private.has_active_content_access()`. | Ativo em produção conforme `CHANGELOG.md` e `scripts/test-rls-two-users.mjs`. | Todo dado de rotina pertence a `auth.uid()` (derivado no servidor), protegido por RLS + `has_active_content_access()`. Em contas compartilhadas, métricas são explicitamente identificadas como **da conta**. |
| **Infraestrutura** | Next.js `16.3.4`, React `19.2.4`, Zod `4.4.3`, Tailwind v4 (`src/app/globals.css`), `lucide-react`, `node --test` (`test:*` em `package.json`), `scripts/test-rls-two-users.mjs`, migrations `001`–`025`. | Na `origin/main` (`7395ebb`), migrations canônicas vão até `052` (incluindo `026_create_study_planner.sql` com `study_plans`/`study_plan_items` e `052_create_launch_interests.sql`). | Tabelas do planner `study_plans` (`1`) e `study_plan_items` (`7`) presentes no banco remoto; tabelas de rotina/gamificação ainda não existem. | Build/CI e deploy Netlify configurados para `C:\PRO\site`. | **Prevenção obrigatória de colisão:** reconciliar a nova migration para `053_create_study_routine_gamification.sql` (acima de `052_create_launch_interests.sql` na `origin/main`) e adotar `user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions` e `study_routine_session_activities`. |

> Nota sobre ambiente remoto de produção web: os testes locais de código e a consulta somente-leitura ao banco confirmaram os contratos e contagens acima em `14/11/2026`. Não foi executado deploy nem smoke autenticado no domínio de produção HTTP neste diagnóstico, pois a implementação do MVP e a aplicação remota da migration `053` ocorrem separadamente.

---

## 2. Estado real da worktree antes da implementação

Alterações preexistentes do usuário preservadas integralmente (não modificadas e não incluídas nos commits da gamificação):
- Tracked modificadas/excluídas: `ADMINISTRACAO_CONTEUDO.md`, `docs/PLANO_REVISAO_VISUAL_CONTEUDO_RESUMOS.md`, `public/brand/pro-concursos-logo-transparent.png`, `src/app/globals.css`, `src/components/study/mermaid-viewer.tsx`.
- Untracked: `.next-corrompido-20260812/`, `.worktrees/`, `AGENTS.md`, `CLAUDE.md`, `public/questions/`, `src/lib/mermaid/render-queue.mjs`, `supabase/migrations/037_create_missing_disciplines_and_topics.sql`, `tests/mermaid-render-queue.test.mjs`.

---

## 3. Adaptações justificadas do plano para este incremento

1. **Escopo operacional do MVP sobre Resumos**: como `topic_legal_fragment_relations` tem `0` vínculos, `law_flashcards` publicados são `0`, o leitor de Leis reside em `C:\PRO\legis` e o módulo de Questões pertence à branch `main`, o MVP nesta branch recomenda e conclui exclusivamente **seções ativas de Resumos** (`sections.content_unit_id` com `archived_at IS NULL` em tópicos com `archived_at IS NULL`). A limitação será comunicada de forma transparente na interface, sem botões mortos nem missões impossíveis.
2. **Namespace e numeração da migration (`053` após reconciliação com `origin/main`)**: embora esta branch contenha localmente apenas `001`–`025`, o histórico canônico atual de `origin/main` (`7395ebb`) contém as migrations `026`–`052` (incluindo `026_create_study_planner.sql` e `052_create_launch_interests.sql`). O diagnóstico inicial registrou `052` antes da entrada de `052_create_launch_interests.sql` na `origin/main`; por isso a migration da rotina foi reconciliada para `053_create_study_routine_gamification.sql` com tabelas próprias (`user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions`, `study_routine_session_activities`).
3. **Resiliência pré-migration remota (`schema_unavailable`)**: como a migration `053` não deve ser aplicada remotamente de forma unilateral antes da revisão/autorização, os pontos de leitura e escrita server-side tratam ausência das novas tabelas/RPCs (`42P01`, `PGRST205`, `42883`, `PGRST202`) sem derrubar `/dashboard` ou `/[topicId]`, exibindo aviso neutro e preservando 100% do estudo convencional.

---

## 4. Modelo de dados proposto (`053_create_study_routine_gamification.sql`)

Todas as tabelas pertencem ao **Grupo A (dados pessoais por usuário)**, com `user_id NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, RLS habilitada, privilégios revogados de `anon` e escrita direta revogada de `authenticated` (`SELECT` por `(SELECT auth.uid()) = user_id` e mutações exclusivas por RPCs `SECURITY DEFINER SET search_path = ''`):

1. `public.user_study_routine_preferences`
   - `user_id` (PK, FK `auth.users(id) ON DELETE CASCADE`)
   - `target_days` (`SMALLINT` entre `1` e `7`, default `3`)
   - `timezone_iana` (`TEXT`, default `'America/Sao_Paulo'`)
   - `default_budget_minutes` (`SMALLINT` em `(5, 15, 30)`, default `15`)
   - `preferred_discipline` (`TEXT NULL`)
   - `hide_gamification` (`BOOLEAN NOT NULL DEFAULT false`)
   - `pending_target_days` (`SMALLINT NULL` entre `1` e `7`)
   - `pending_timezone_iana` (`TEXT NULL`)
   - `pending_effective_week_start` (`DATE NULL`, segunda-feira ISO)
   - `onboarding_completed_at` (`TIMESTAMPTZ NULL`)
   - `created_at`, `updated_at`
2. `public.study_routine_weekly_plans`
   - `id` (`UUID PK`)
   - `user_id` (`UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`)
   - `week_start_date` (`DATE NOT NULL`, `EXTRACT(ISODOW FROM week_start_date) = 1`)
   - `week_end_date` (`DATE NOT NULL`, `week_end_date = week_start_date + 6`)
   - `target_days` (`SMALLINT NOT NULL` entre `1` e `7`)
   - `timezone_iana` (`TEXT NOT NULL`)
   - `is_partial_first_week` (`BOOLEAN NOT NULL DEFAULT false`)
   - `created_at`, `updated_at`
   - `UNIQUE (user_id, week_start_date)` e `UNIQUE (id, user_id)` (FK composta para a sessão)
3. `public.study_routine_sessions`
   - `id` (`UUID PK`)
   - `user_id` (`UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`)
   - `weekly_plan_id` (`UUID NOT NULL`, FK composta `(weekly_plan_id, user_id)` -> `study_routine_weekly_plans(id, user_id) ON DELETE CASCADE`)
   - `status` (`TEXT` em `('planned', 'in_progress', 'interrupted', 'completed', 'discarded')`)
   - `budget_minutes` (`SMALLINT` em `(5, 15, 30)`)
   - `estimated_minutes` (`SMALLINT` entre `1` e `180`)
   - `selection_mode` (`TEXT` em `('recommended', 'manual', 'resumed')`)
   - `idempotency_key` (`TEXT NOT NULL`)
   - `completion_idempotency_key` (`TEXT NULL`)
   - `started_at` (`TIMESTAMPTZ NOT NULL DEFAULT now()`)
   - `last_activity_at` (`TIMESTAMPTZ NOT NULL DEFAULT now()`)
   - `completed_at` (`TIMESTAMPTZ NULL`)
   - `completed_local_date` (`DATE NULL`)
   - `completed_week_start_date` (`DATE NULL`)
   - `completed_timezone_iana` (`TEXT NULL`)
   - `created_at`, `updated_at`
   - Índices únicos por `(user_id, idempotency_key)`, `(user_id, completion_idempotency_key)` parcial e índice parcial de uma sessão ativa/em andamento por usuário (`status IN ('planned', 'in_progress', 'interrupted')`) quando aplicável ou controle transacional no serviço.
4. `public.study_routine_session_activities`
   - `id` (`UUID PK`)
   - `session_id` (`UUID NOT NULL`, FK composta `(session_id, user_id)` -> `study_routine_sessions(id, user_id) ON DELETE CASCADE`)
   - `user_id` (`UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`)
   - `order_index` (`SMALLINT NOT NULL >= 0`)
   - `activity_type` (`TEXT` em `('summary', 'law', 'question', 'flashcard')`)
   - `status` (`TEXT` em `('pending', 'completed', 'skipped', 'unavailable')`)
   - `topic_id` (`TEXT NULL`)
   - `topic_title` (`TEXT NOT NULL`)
   - `discipline` (`TEXT NOT NULL`)
   - `section_id` (`TEXT NULL`)
   - `content_unit_id` (`UUID NULL`, referência lógica estável à unidade de seção sem `ON DELETE CASCADE` destrutivo no histórico caso arquivada)
   - `activity_title` (`TEXT NOT NULL`)
   - `estimated_minutes` (`SMALLINT NOT NULL`)
   - `evidence_kind` (`TEXT` em `('self_declared', 'server_verified')`)
   - `completed_at` (`TIMESTAMPTZ NULL`)
   - `created_at`, `updated_at`

Triggers e restrições no banco (`SECURITY DEFINER`, `SET search_path = ''`):
- Revogação de `INSERT`, `UPDATE` e `DELETE` diretos para `PUBLIC`, `anon` e `authenticated`, combinada a `trigger_01_rpc_mutation_guard` para exigir escrita via RPCs autorizadas;
- Imutabilidade dos planos semanais (`study_routine_weekly_plans`) e proteção contra exclusão enquanto o usuário existir;
- Validação de transições de `status` em `study_routine_sessions` (`completed` e `discarded` são terminais), validação de `completed_at`, `completed_local_date`, `completed_week_start_date` e `completed_timezone_iana` coerentes com o plano e o fuso, e verificação de atividade de resumo elegível;
- `CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED` garantindo que nenhuma sessão seja persistida sem ao menos uma atividade no `COMMIT`.

---

## 5. Riscos identificados e mitigações

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Migration `053` ainda não aplicada no Supabase remoto | Erro de consulta/gravação em `/dashboard`, `/[topicId]` e `/api/study-routine` | Detecção explícita via `isRoutineSchemaError` com degradação graciosa (`503` controlado na API e aviso discreto sem quebrar estudo convencional) e fallback local apenas em dev explícito. |
| Colisão de merge futuro com `main` (migrations `026`–`052`) | Conflito de numeração ou nomes de tabela | Migration reconciliada para `053_create_study_routine_gamification.sql` (após `052_create_launch_interests.sql` na `origin/main`) e tabelas com prefixo `study_routine_` / `user_study_routine_`. |
| Duplo clique, múltiplas abas ou resposta perdida após commit | Duplicação de sessão ou de conclusão no mesmo dia | Chaves de idempotência (`idempotency_key` e `completion_idempotency_key`), trava transacional `pg_advisory_xact_lock`, criação atômica via `create_study_routine_session` + índice único de 1 sessão ativa por usuário. |
| Conteúdo arquivado/removido ou perda de entitlement | Erro ou vazamento de conteúdo restrito ao retomar sessão | Validação server-side via `requireContentAccess()`, guarda `has_active_content_access()` nas RPCs e verificação de `archived_at IS NULL` antes de iniciar/substituir/concluir. |
| Troca de fuso horário ou estudo atravessando meia-noite | Deslocamento retroativo de histórico ou perda de meta da semana | Persistência imutável de `completed_at` (`now()` do servidor), `completed_local_date` e `completed_timezone_iana` na sessão; mudanças de meta/fuso entram como `pending_*` e são preservadas em atualizações parciais. |

---

## 6. Lista prevista de arquivos para as Fases 1 e 2

- Diagnóstico e documentação:
  - `docs/GAMIFICACAO_DIAGNOSTICO.md`
  - `docs/GAMIFICACAO_IMPLEMENTACAO.md`
  - `CHANGELOG.md`
- Banco de dados e tipos:
  - `supabase/migrations/053_create_study_routine_gamification.sql`
  - `src/types/database.ts`
- Domínio puro e adaptador server-side:
  - `src/lib/gamification/config.mjs` e `src/lib/gamification/config.d.mts`
  - `src/lib/gamification/calendar.mjs` e `src/lib/gamification/calendar.d.mts`
  - `src/lib/gamification/session.mjs` e `src/lib/gamification/session.d.mts`
  - `src/lib/gamification/repository.mjs` e `src/lib/gamification/repository.d.mts`
  - `src/lib/gamification/server.ts`
- API e UI:
  - `src/app/api/study-routine/route.ts`
  - `src/components/gamification/today-study-card.tsx`
  - `src/components/gamification/study-session-bar.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/(study)/[topicId]/page.tsx`
  - `src/app/(study)/[topicId]/study-page-client.tsx`
  - `src/app/dashboard/configuracoes/page.tsx`
- Testes e scripts:
  - `tests/gamification-calendar.test.mjs`
  - `tests/gamification-session.test.mjs`
  - `tests/gamification-ui.test.mjs`
  - `tests/gamification-postgres.test.mjs`
  - `scripts/test-rls-two-users.mjs`
  - `package.json`

---

## 7. Matriz de funcionalidades disponíveis vs. futuras

| Funcionalidade | Situação no MVP (Fases 1 e 2) | Evolução posterior (Fases 3 a 5) |
| --- | --- | --- |
| Meta semanal flexível (1–7 dias, sugestão 3) e semana parcial | **Disponível** | — |
| Fuso horário IANA (`America/Sao_Paulo` padrão, efeito futuro e prévia) | **Disponível** | — |
| Orçamento de tempo (5, 15, 30 min) e estimativa conservadora | **Disponível** | Calibração empírica após coleta de métricas operacionais |
| Sessão de estudo em Resumos (iniciar, pausar, retomar, concluir, descartar) | **Disponível** | — |
| Seleção manual alternativa sem penalidade e troca de conteúdo indisponível | **Disponível** | — |
| Ocultar/reexibir estímulos sem perda de dados | **Disponível** | — |
| Revisão de erros de Questões | **Fora do MVP (Fase 3)** — módulo de Questões reside na `main` | Fase 3 |
| Missões integradas Resumo + Lei + Questão | **Fora do MVP (Fase 4)** — `topic_legal_fragment_relations` = `0` | Fase 4 |
| Conquistas opcionais / XP | **Fora do MVP (Fase 5)** | Fase 5 |

---

## 8. Reconciliação do Banco Remoto, Publicação e Auth Local — 15/11/2026

> [!NOTE]
> Verificação estritamente somente-leitura realizada em 15/11/2026 sobre `origin/main` (`a46c3b4`), o projeto Supabase vinculado `wbre***.supabase.co` (`C:\PRO\site\.env.local` e `supabase/.temp/project-ref` apontam para o mesmo projeto), a publicação `https://proconcursos.com.br/resumos` e a prévia local em `http://localhost:3000` (`STUDY_ROUTINE_DEV_FALLBACK=1` apenas no processo). Nenhuma migration remota foi aplicada nem houve alteração de credenciais, configuração OAuth ou dados de produção.

### 8.1. Matriz de reconciliação: esperado (`053_create_study_routine_gamification.sql`) × encontrado no banco remoto (`wbre***.supabase.co`)

| Objeto / Camada | Esperado na migration `053` | Encontrado no banco remoto (15/11/2026) | Divergência | Impacto operacional |
| --- | --- | --- | --- | --- |
| **Histórico `supabase_migrations.schema_migrations`** | Versão `053` (`create_study_routine_gamification`) registrada após `052` | Contém `001`–`050` e `052` (`create_launch_interests`); `051` e `053` ausentes | `053` não consta aplicada | Banco remoto ainda não recebeu a `053` |
| **4 tabelas em `public`** | `user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions`, `study_routine_session_activities` | `0/4` encontradas em `pg_class` (`SELECT COUNT(*)` retorna `ERROR: 42P01`) | Ausentes no PostgreSQL remoto | Toda leitura/escrita da rotina cai no tratamento `RoutineSchemaUnavailableError` |
| **7 índices (`idx_study_routine_*`)** | `idx_study_routine_weekly_plans_user_week`, `idx_study_routine_sessions_completion_key`, `idx_study_routine_sessions_one_active`, `idx_study_routine_sessions_user_week_completed`, `idx_study_routine_sessions_user_recent`, `idx_study_routine_activities_session`, `idx_study_routine_activities_user_unit` | `0/7` em `pg_indexes` | Ausentes | Dependentes da aplicação da `053` |
| **Constraints (`PK`, `FK`, `UNIQUE`, `CHECK`)** | Chaves primárias/estrangeiras compostas e invariantes de status/fuso nas 4 tabelas | `0` em `pg_constraint` | Ausentes | Dependentes da aplicação da `053` |
| **13 triggers nas 4 tabelas** | `4` `*_updated_at`, `4` `trigger_01_rpc_mutation_guard`, `3` triggers de imutabilidade/transições/integridade e `2` `CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED` (`trigger_enforce_session_has_activities`, `trigger_enforce_activity_delete_keeps_session_nonempty`) | `0/13` em `pg_trigger` | Ausentes | Dependentes da aplicação da `053` |
| **4 políticas RLS e privilégios** | `4` políticas `FOR SELECT TO authenticated` (`user_study_routine_preferences_select_own`, `study_routine_weekly_plans_select_own`, `study_routine_sessions_select_own`, `study_routine_activities_select_own`), `REVOKE ALL` de `PUBLIC`/`anon`/`authenticated`, `SELECT` para `authenticated`, DML para `service_role` | `0/4` em `pg_policies` | Ausentes | Dependentes da aplicação da `053` |
| **11 funções `private.*` (guards / helpers)** | `require_authenticated_routine_access`, `validate_routine_timezone`, `acquire_study_routine_user_lock`, `get_study_routine_session_json`, `enforce_study_routine_rpc_mutation_guard`, `enforce_study_routine_weekly_plan_immutability`, `enforce_study_routine_session_transitions`, `enforce_study_routine_activity_integrity`, `enforce_study_routine_session_row_has_activities`, `enforce_study_routine_activity_delete_keeps_session`, `sync_user_study_routine_week` | `0/11` em `pg_proc` | Ausentes | Dependentes da aplicação da `053` |
| **6 RPCs `public.*` (`SECURITY DEFINER`, `SET search_path = ''`)** | `ensure_study_routine_weekly_plan`, `save_study_routine_preferences`, `create_study_routine_session`, `update_study_routine_session_status`, `replace_study_routine_session_activity`, `complete_study_routine_session` (`GRANT EXECUTE TO authenticated, service_role`, validando acesso/entitlement) | `0/6` em `pg_proc` | Ausentes | Chamadas às RPCs retornam schema/função ausente |
| **Exposição e cache OpenAPI PostgREST (`/rest/v1/`)** | 4 definições/caminhos de tabela + 6 endpoints `/rpc/*` expostos após reload de schema | HTTP `200` com `26` RPCs de migrations anteriores; `0` tabelas da rotina e `0` `/rpc/*` da rotina | Não expostas porque não existem no `pg_catalog` | `GET /rest/v1/<table>` retorna `PGRST205` (`404`) |

### 8.2. Causa exata da discrepância observada entre "4 tabelas acessíveis" e "6 RPCs ausentes no OpenAPI"

- Verificações anteriores via `@supabase/supabase-js` usando `.from(table).select("*", { count: "exact", head: true })` enviavam requisições HTTP `HEAD /rest/v1/<table>?select=*`.
- Quando a tabela não existe no schema cache, o PostgREST responde ao `HEAD` com **HTTP `404` e corpo vazio (`""`)** (sem payload JSON). Como `@supabase/postgrest-js` não recebe JSON de erro no corpo da resposta `HEAD`, ele retorna `{ data: null, count: null, error: null }` — falso positivo reproduzível inclusive para nomes inexistentes arbitrários como `nonexistent_table_xyz_123`.
- Em contrapartida, uma requisição `GET` (`admin.from(table).select("*").limit(1)`) recebe o JSON real de erro `{"code":"PGRST205","message":"Could not find the table 'public.user_study_routine_preferences' in the schema cache"}` para todas as 4 tabelas.
- Portanto, **não houve aplicação parcial da migration `053` nem falha isolada de cache ou `GRANT` nas 6 RPCs**: a migration `053` ainda não foi aplicada no banco remoto (`0/4` tabelas, `0/13` triggers, `0/11` funções `private.*` e `0/6` RPCs no catálogo do PostgreSQL).

### 8.3. Estado da publicação (`https://proconcursos.com.br/resumos`)

- `GET https://proconcursos.com.br/resumos/api/health`: responde `200 OK` (`status: "ok"`, checks `database: "ok"` e `payment_reconciliation: "ok"`).
- `GET https://proconcursos.com.br/resumos/api/study-routine` (sem sessão): responde `401 Unauthorized` (`{"error":"Sessão ausente ou expirada. Entre novamente com Google."}`, `Cache-Control: no-store`). Isso comprova que o código integrado na `origin/main` (`a46c3b4`) está publicado em produção no Netlify.
- **Comportamento com sessão em produção enquanto a migration `053` não for aplicada**: como `NODE_ENV === "production"` impede `STUDY_ROUTINE_DEV_FALLBACK` e o banco remoto retorna `PGRST205`/`42P01`, `/resumos/dashboard` captura `RoutineSchemaUnavailableError` e degrada com segurança (`persistenceAvailable: false`), enquanto `/resumos/api/study-routine` responde HTTP `503` controlado (`code: "schema_unavailable"`), sem quebrar leitura de Resumos, Questões ou Planner.

### 8.4. Diagnóstico forense do login local (`/resumos/login?error=auth`)

- **Sessão pública × `localhost`**: os cookies SSR da sessão Google emitidos em `https://proconcursos.com.br` pertencem ao domínio público (`Secure`, `SameSite=Lax`) e nunca são enviados pelo navegador para `http://localhost:3000` ou `http://127.0.0.1:3000`.
- **Evidências em `auth.flow_state`, `auth.sessions` e `.next/dev/trace`**:
  1. Os redirects `http://localhost:3000/resumos/auth/callback` e `http://127.0.0.1:3000/resumos/auth/callback` são aceitos pela allowlist de URLs de retorno do GoTrue no projeto vinculado.
  2. Nas 3 tentativas locais registradas (`2026-11-14 22:28:29Z` em `127.0.0.1:3000`, `2026-11-15 04:16:46Z` em `localhost:3000` e `2026-11-15 04:21:34Z` em `localhost:3000`), a autenticação Google gerou `auth_code` válido (`auth_code_issued_at` preenchido e `user_linked = true`) e o callback `/resumos/auth/callback?code=...` foi atingido no servidor local.
  3. Diferentemente dos logins bem-sucedidos em produção (onde `exchangeCodeForSession` consome a linha de `auth.flow_state` e grava nova linha em `auth.sessions`), nas 3 tentativas locais o `auth_code` permaneceu **não consumido** (`auth_code IS NOT NULL`) em `auth.flow_state`, nenhuma sessão correspondente foi criada em `auth.sessions` e `src/app/auth/callback/route.ts` redirecionou para `/resumos/login?error=auth` (e não `?error=google_required`).
  4. Em PKCE (`@supabase/ssr` `0.12.0` + `@supabase/auth-js` `2.110.0`), `createBrowserClient` grava o verificador no cookie `sb-<ref>-auth-token-code-verifier` em `document.cookie` (`path: "/"`, `sameSite: "lax"`) na origem onde o botão "Continuar com Google" é clicado, e `exchangeCodeForSession(code)` no callback exige esse mesmo cookie na mesma origem (`localhost` × `localhost`, não `127.0.0.1` × `localhost`, nem fluxos concluídos em outro contexto/navegador sem o cookie PKCE).
- **Inspeção em navegador local em 15/11/2026 (`a46c3b4`, `STUDY_ROUTINE_DEV_FALLBACK=1`)**: `http://localhost:3000/resumos/dashboard` redirecionou para `http://localhost:3000/resumos/login` (`AUTH_REQUIRED`, `0` cookies ativos, `0` erros de console e `0` overflow horizontal em `1280x800` e `360x780`). A validação visual autenticada da rotina semanal e sessões permanece pendente de login Google válido no mesmo contexto de navegador na origem `http://localhost:3000`.

### 8.5. Análise da ausência da migration `051` e verificação dos pré-requisitos reais de `053`

- **Situação da `051` na pasta e no banco remoto (`wbre***.supabase.co`)**:
  - No diretório `supabase/migrations/` existem dois arquivos com prefixo `051_`: `051_normalize_boards_and_review_filter.sql` (normalização de bancas `Vunesp`/`FCC`/`CEBRASPE` em `public.questions` e inclusão do 11º parâmetro `p_review_filter` em `public.list_questions_filtered_v2`) e `051_rollback.sql` (restauração da assinatura de `050` e `047`).
  - No catálogo remoto `supabase_migrations.schema_migrations` constam versões `001`–`050` e `052` (`create_launch_interests`, tabela com `version TEXT NOT NULL`, `statements TEXT[]`, `name TEXT`); `051` e `053` não constam aplicadas.
- **Independência entre `051` e `053`**:
  - A migration `053_create_study_routine_gamification.sql` não consulta, altera nem referencia `public.questions`, `public.list_questions_filtered_v2` ou `public.list_question_filters`.
  - Validado em PGlite isolado (`tests/gamification-postgres.test.mjs`): com `026` e `052` aplicados e **sem `051`** (`to_regclass('public.questions') IS NULL`), `053` aplica integralmente todas as `4` tabelas, `7` índices, `13` triggers, `4` políticas RLS, `11` funções `private.*`, `6` RPCs `public.*` e suas permissões exatas.
- **Pré-requisitos reais de `053` conferidos diretamente em `wbre***.supabase.co` (`pg_catalog` / `pg_attribute`)**:
  - `auth.users` e `auth.uid()` -> existentes;
  - `public.update_updated_at_column()` -> existente;
  - `private.has_active_content_access()` -> existente;
  - `public.topics` (`topic_id`, `discipline`, `title`, `sort_order`, `archived_at`) -> existente;
  - `public.sections` (`section_id`, `topic_id`, `content_unit_id`, `title`, `sort_order`, `archived_at`) -> existente;
  - `public.user_progress` (`user_id`, `section_id`, `content_unit_id`, `completed`, `updated_at` e constraint única `user_progress_user_content_unit_key`) -> existente.
- **Impacto operacional**: todos os pré-requisitos reais de `053` já estão presentes no banco remoto, sem nenhuma dependência de `051`. Em contrapartida, pela coexistência de `051_normalize_boards_and_review_filter.sql` e `051_rollback.sql` em `supabase/migrations/` e por `051` aguardar janela própria do módulo de Questões, **não** se deve executar `supabase db push` cego; a ativação remota deve executar exclusivamente `053_create_study_routine_gamification.sql` em transação atômica e registrar apenas a versão `053` em `supabase_migrations.schema_migrations`.

### 8.6. Teste autenticado em produção (`https://proconcursos.com.br/resumos`) e ajuste de estado indisponível

- **Observado no teste autenticado do Codex em 15/11/2026 (produção com código `a46c3b4`, antes do ajuste de UI)**:
  - `/resumos/dashboard` e `/resumos/dashboard/configuracoes` carregaram autenticados com degradação controlada: `GET /resumos/api/study-routine` retornou `persistenceAvailable: false`, `demoFallbackActive: false`, `needsOnboarding: true`, `currentPlan: null`, `activeSession: null`, `recommendation: null`.
  - Temas Claro/Escuro/Sépia, navegação dashboard → preferências → resumo, notas, Mermaid com zoom e responsividade desktop/mobile (`360 px`) funcionaram sem overflow horizontal e sem alterar notas/progresso existentes.
  - Defeito identificado na UI então publicada: `TodayStudyCard` abria controles de onboarding interativos antes do aviso de bloqueio e `StudySessionBar` exibia `"0 de 3 dias"` como se fosse histórico de rotina ativada.
- **Correção aplicada nesta entrega (branch `docs/reconciliar-ativacao-gamificacao`, pendente de integração em `main`/deploy)**:
  - `TodayStudyCard` e `StudySessionBar` agora exigem `hasActivatedRoutine = persistenceAvailable && !snapshot.needsOnboarding && Boolean(snapshot.currentPlan)` antes de exibir contagem semanal (`X de Y dias`) ou grade de dias;
  - Quando `persistenceAvailable === false`, o aviso de bloqueio aparece no topo antes de qualquer formulário/controle, com acesso direto ao acervo (`#library-title`), sem abrir o onboarding e desabilitando seletores de preferência e orçamento.
