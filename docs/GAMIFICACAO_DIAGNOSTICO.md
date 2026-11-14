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
| **Infraestrutura** | Next.js `16.3.4`, React `19.2.4`, Zod `4.4.3`, Tailwind v4 (`src/app/globals.css`), `lucide-react`, `node --test` (`test:*` em `package.json`), `scripts/test-rls-two-users.mjs`, migrations `001`–`025`. | Na `main`, migrations vão até `051` (incluindo `026_create_study_planner.sql` com `study_plans` e `study_plan_items`, que também existem no banco remoto: `1` plano e `7` itens). | Tabelas do planner `study_plans` (`1`) e `study_plan_items` (`7`) presentes no banco remoto; tabelas de rotina/gamificação ainda não existem. | Build/CI e deploy Netlify configurados para `C:\PRO\site`. | **Prevenção obrigatória de colisão:** numerar a nova migration como `052_create_study_routine_gamification.sql` e evitar os nomes `study_plans` / `study_plan_items`, adotando `user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions` e `study_routine_session_activities`. |

> Nota sobre ambiente remoto de produção web: os testes locais de código e a consulta somente-leitura ao banco confirmaram os contratos e contagens acima em `14/11/2026`. Não foi executado deploy nem smoke autenticado no domínio de produção HTTP neste diagnóstico, pois a implementação do MVP e a aplicação remota da migration `052` ocorrem separadamente.

---

## 2. Estado real da worktree antes da implementação

Alterações preexistentes do usuário preservadas integralmente (não modificadas e não incluídas nos commits da gamificação):
- Tracked modificadas/excluídas: `ADMINISTRACAO_CONTEUDO.md`, `docs/PLANO_REVISAO_VISUAL_CONTEUDO_RESUMOS.md`, `public/brand/pro-concursos-logo-transparent.png`, `src/app/globals.css`, `src/components/study/mermaid-viewer.tsx`.
- Untracked: `.next-corrompido-20260812/`, `.worktrees/`, `AGENTS.md`, `CLAUDE.md`, `public/questions/`, `src/lib/mermaid/render-queue.mjs`, `supabase/migrations/037_create_missing_disciplines_and_topics.sql`, `tests/mermaid-render-queue.test.mjs`.

---

## 3. Adaptações justificadas do plano para este incremento

1. **Escopo operacional do MVP sobre Resumos**: como `topic_legal_fragment_relations` tem `0` vínculos, `law_flashcards` publicados são `0`, o leitor de Leis reside em `C:\PRO\legis` e o módulo de Questões pertence à branch `main`, o MVP nesta branch recomenda e conclui exclusivamente **seções ativas de Resumos** (`sections.content_unit_id` com `archived_at IS NULL` em tópicos com `archived_at IS NULL`). A limitação será comunicada de forma transparente na interface, sem botões mortos nem missões impossíveis.
2. **Namespace e numeração da migration (`052`)**: embora esta branch contenha localmente apenas `001`–`025`, o banco compartilhado já possui as migrations `026`–`051` vindas de `main` (incluindo `026_create_study_planner.sql`, que cria `study_plans` e `study_plan_items`, e `037`–`051` do módulo de Questões). Portanto, a migration da rotina recebe o número `052_create_study_routine_gamification.sql` e tabelas próprias (`user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions`, `study_routine_session_activities`), evitando conflitos no merge futuro com `main`.
3. **Resiliência pré-migration remota (`schema_unavailable`)**: como a migration `052` não deve ser aplicada remotamente de forma unilateral antes da revisão/autorização, os pontos de leitura e escrita server-side tratam ausência das novas tabelas (`42P01` / `PGRST205` via `isMissingTableError`) sem derrubar `/dashboard` ou `/[topicId]`, exibindo aviso neutro e preservando 100% do estudo convencional.

---

## 4. Modelo de dados proposto (`052_create_study_routine_gamification.sql`)

Todas as tabelas pertencem ao **Grupo A (dados pessoais por usuário)**, com `user_id NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, RLS habilitada, privilégios revogados de `anon` e restrição a `authenticated` com `(SELECT auth.uid()) = user_id`:

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

Triggers no banco (`SECURITY DEFINER`, `SET search_path = ''`):
- Impede alteração retroativa de `target_days` / `timezone_iana` em `study_routine_weekly_plans` após a criação da semana (exceto se explicitamente inicializada antes da primeira conclusão e ainda na janela inicial);
- Valida transições de `status` em `study_routine_sessions` (`completed` e `discarded` são terminais) e exige `completed_at`, `completed_local_date`, `completed_week_start_date` e `completed_timezone_iana` preenchidos quando `status = 'completed'`;
- Impede conclusão da sessão sem ao menos uma atividade elegível com `status = 'completed'`.

---

## 5. Riscos identificados e mitigações

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Migration `052` ainda não aplicada no Supabase remoto | Erro de consulta/gravação em `/dashboard`, `/[topicId]` e `/api/study-routine` | Detecção explícita via `isMissingTableError(..., ...)` com degradação graciosa (aviso discreto sem quebrar estudo convencional) e modo fallback local explícito para testes se configurado. |
| Colisão de merge futuro com `main` (migrations `026`–`051`) | Conflito de numeração ou nomes de tabela | Migration nomeada `052_create_study_routine_gamification.sql` e tabelas com prefixo `study_routine_` / `user_study_routine_`. |
| Duplo clique, múltiplas abas ou resposta perdida após commit | Duplicação de sessão ou de conclusão no mesmo dia | Chaves de idempotência (`idempotency_key` e `completion_idempotency_key`) com índices únicos no banco + trava por chave no serviço + regra de 1 contagem diária por `completed_local_date`. |
| Conteúdo arquivado/removido ou perda de entitlement | Erro ou vazamento de conteúdo restrito ao retomar sessão | Validação server-side via `requireContentAccess()` + verificação de `archived_at IS NULL` antes de iniciar/concluir + troca segura para conteúdo elegível preservando histórico. |
| Troca de fuso horário ou estudo atravessando meia-noite | Deslocamento retroativo de histórico ou perda de meta da semana | Persistência imutável de `completed_at` (UTC), `completed_local_date` e `completed_timezone_iana` na sessão; mudanças de meta/fuso entram como `pending_*` para a próxima segunda-feira. |

---

## 6. Lista prevista de arquivos para as Fases 1 e 2

- Diagnóstico e documentação:
  - `docs/GAMIFICACAO_DIAGNOSTICO.md`
  - `docs/GAMIFICACAO_IMPLEMENTACAO.md`
  - `CHANGELOG.md`
- Banco de dados e tipos:
  - `supabase/migrations/052_create_study_routine_gamification.sql`
  - `src/types/database.ts`
- Domínio puro e adaptador server-side:
  - `src/lib/gamification/config.mjs` e `src/lib/gamification/config.d.mts`
  - `src/lib/gamification/calendar.mjs` e `src/lib/gamification/calendar.d.mts`
  - `src/lib/gamification/session.mjs` e `src/lib/gamification/session.d.mts`
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
