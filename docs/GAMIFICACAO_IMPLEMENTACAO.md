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
  - `src/lib/gamification/server.ts`: reexporta os adaptadores de `repository.mjs`, expõe `getApiContentAccess`, ordenação canônica (`sortRoutineTopics`), hidratação compartilhada (`hydrateDashboardRecommendationIfNeeded`), loader de configurações com suporte explícito ao fallback dev (`loadSettingsRoutineStatus`) e loaders de estado (`hydrateRoutineTopicsByIds`, `loadDashboardRoutineState`, `loadStudyTopicRoutineState`). No modo `STUDY_ROUTINE_DEV_FALLBACK=1` (`NODE_ENV !== "production"`), opera sobre `createDevFallbackRepository()` mantendo preferências, planos, sessões, conclusões e `completedContentUnitIds` exclusivamente em memória (`mergeDevFallbackCompletedUnitIds`), sem executar mutações (`insert`, `update`, `upsert`, `delete` ou RPCs de escrita) no Supabase.
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
- **Limitações do modo demonstrativo (`STUDY_ROUTINE_DEV_FALLBACK=1`)**: ativo apenas quando `NODE_ENV !== "production"` e a variável `STUDY_ROUTINE_DEV_FALLBACK="1"` está presente no processo do servidor local. Todas as preferências, planos semanais, sessões e conclusões decorrentes da rotina demonstrativa permanecem exclusivamente na memória global do processo Node (descartadas ao reiniciar o servidor) e **não gravam progresso no Supabase** (o progresso anterior existente em `user_progress` é apenas consultado por `SELECT` e combinado em memória via `mergeDevFallbackCompletedUnitIds` para avançar a próxima recomendação, sem executar `upsert` nem apagar dados reais). Essa garantia limita-se à rotina demonstrativa (`/api/study-routine` em fallback) e não altera nem impede ações convencionais de estudo realizadas fora da rotina demonstrativa (como marcar ou desmarcar seções manualmente na página de estudo via `useSectionProgress`, criar notas ou aplicar realces). Quando ativo, a interface exibe aviso discreto de demonstração temporária, e seus resultados validam apenas fluxo de interface local, **não** comprovando RLS, triggers, RPCs ou persistência no Supabase.

---

## 3A. Dependências de Teste Versionadas (`devDependencies`)

- **Motivo**: tornar reproduzível via `npm ci` / `npm install` a execução real da migration `053`, dos triggers/RLS em PGlite (`@electric-sql/pglite@^0.5.16`) e da validação de contenção real de locks em PostgreSQL multi-conexão (`pg@^8.13.1`, sem fila sequencial em JS), eliminando a dependência temporária não versionada anteriormente em `tmp/pg-validation`.
- **Alternativa sem dependência**: depender apenas de mocks em memória (incapaz de validar PL/pgSQL, `pg_advisory_xact_lock`, `CONSTRAINT TRIGGER DEFERRABLE` e RLS real) ou de invocação externa via shell ao `psql` (frágil para `Promise.all` concorrente e observação em `pg_locks`).
- **Impacto no bundle**: zero no código de produção (`dependencies` inalterado; pacotes adicionados exclusivamente em `devDependencies` e importados apenas por `tests/gamification-postgres.test.mjs`).
- **Comando de instalação utilizado**: `npm.cmd install --save-dev @electric-sql/pglite@^0.5.16 pg@^8.13.1`
- **Arquivos afetados**: `package.json`, `package-lock.json` e `tests/gamification-postgres.test.mjs`.

---

## 3B. Diferenças entre Fallback, PostgreSQL Isolado e Supabase Remoto / Homologação

| Camada | Escopo real validado | O que **comprova** | O que **não comprova** |
| --- | --- | --- | --- |
| **1. Fallback demonstrativo (`STUDY_ROUTINE_DEV_FALLBACK=1`)** | Estado exclusivamente em memória global do processo Node local (`repository.mjs`) | Contratos de UI/API em ambiente sem `053` aplicada, aviso discreto de demonstração e avanço da recomendação em memória sem gravar `user_progress` | Não comprova persistência entre reinícios, RLS, triggers, concorrência PostgreSQL nem schema remoto |
| **2. PostgreSQL isolado (`PGlite` + PostgreSQL 18 nativo)** | Execução real da migration `053`, coexistência com fixtures versionadas de `026` e `052` (sem dependência de `origin/main`, `.git` ou rede), 6 RPCs `SECURITY DEFINER`, triggers, `pg_locks` multi-conexão e `REVOKE`/`GRANT` | Integridade DDL/DML, bloqueio `42501` sem RPC, isolamento entre `USER_A`/`USER_B`, contenção concorrente real, rollback e coexistência de objetos/RLS com as fixtures versionadas de `026` e `052` (não valida integralmente o histórico canônico `001`–`052`) | Não exercita GoTrue real, PostgREST (`/rest/v1/*`) com cache HTTP nem cookies SSR de produção |
| **3. Supabase / PostgREST (homologação ou destino)** | Projeto Supabase gerenciado com `001`–`052` + `053`, GoTrue OAuth Google, PostgREST e script `scripts/test-rls-two-users.mjs` | Persistência real end-to-end, cache de schema PostgREST após `NOTIFY pgrst, 'reload schema';`, RLS com tokens JWT reais e smoke autenticado sem fallback | Neste workspace local não há Docker Supabase nem projeto de homologação separado configurado; produção não deve ser usada como ambiente de teste |

## 3C. Fixtures SQL Versionadas e Status da Homologação Supabase

- **Reprodutibilidade sem `origin/main` nem `.git`**: `tests/gamification-postgres.test.mjs` lê fixtures SQL versionadas no repositório e valida o digest SHA-256 (após normalização de fim de linha LF para neutralidade de checkout Windows/Linux), sem `git show`, acesso à rede ou repositório Git ativo.
- **Escopo explícito do teste**: comprova exclusivamente coexistência de DDL, tabelas, funções, triggers e políticas RLS da migration `053` com as fixtures `026` e `052`; **não** comprova validação integral de todas as migrations canônicas (`001`–`052`).

| Fixture versionada | Origem na `origin/main` (`7395ebb8c131fa4462713236a13e319084bf3c0b`) | Commit canônico do arquivo | Bytes (LF) | SHA-256 (LF) |
| --- | --- | --- | --- | --- |
| `tests/fixtures/migrations/026_create_study_planner.sql` | `supabase/migrations/026_create_study_planner.sql` | `ac25c00332a955b0d4272979e3867ba9a85f5ecc` | `7562` | `7eb374d01bd527f95c10501bd4e0c5febacb2115855a7915780f1719a85a9256` |
| `tests/fixtures/migrations/052_create_launch_interests.sql` | `supabase/migrations/052_create_launch_interests.sql` | `779982e8fceff0125a77e45ce382cd37df91e02a` | `640` | `fdb3933d300b7b0ab56cdb7f0885f080f3dbe9ad818338f2eeba854465f074e0` |

- **Status do ambiente Supabase de homologação**: indisponível localmente nesta máquina (`npx.cmd supabase status` retorna erro por ausência do daemon Docker `//./pipe/docker_engine`, apenas `.env.local` existe entre os arquivos `.env*` e não há projeto Supabase de homologação separado configurado no ambiente local). A aplicação remota e o smoke via PostgREST/GoTrue SSR permanecem pendentes de ambiente de homologação autorizado.

| Dimensão | Ambiente isolado (`PGlite` + PostgreSQL 18.7) | Supabase remoto de destino (`wbre***.supabase.co`) | Impacto operacional |
| --- | --- | --- | --- |
| **Autenticação e claims** | Schema `auth` mínimo e `request.jwt.claims` simulados via `set_config` | GoTrue gerenciado com Google OAuth (`provider = 'google'`) e MFA `aal2` para admins | O fluxo completo de sessão OAuth + cookies SSR depende de login Google válido |
| **Histórico de migrations** | Bootstrap das tabelas pré-requisito + fixtures versionadas `026`/`052` + 2x `053` no banco `gamification_test` (sem `051`) | Histórico remoto atual contém `001`–`050` e `052` (`create_launch_interests`); `051` e `053` ausentes | `053` não depende de `051`; não executar `supabase db push` cego por coexistirem `051_normalize_boards_and_review_filter.sql` e `051_rollback.sql` na pasta |
| **Camada HTTP / PostgREST** | Chamadas SQL diretas às tabelas/RPCs pelo adaptador de teste | Exposição via PostgREST (`/rest/v1/*`) com cache de schema | Após aplicar a `053`, recarregar cache com `NOTIFY pgrst, 'reload schema';` e confirmar via `GET` (não `HEAD`) |
| **Permissões gerenciadas** | Papel `authenticated` criado localmente para simular usuário logado | Papéis `anon`, `authenticated`, `service_role` e triggers do projeto | Executar `npm run test:rls-two-users` após a `053` para validar no ambiente real |

### Estado da análise `051` × `053` e pré-requisitos reais verificados no remoto (`wbre***.supabase.co`)

- **Ausência da `051` sem impacto sobre `053`**: a migration `051_normalize_boards_and_review_filter.sql` altera `public.questions`, `public.list_questions_filtered_v2` e `public.list_question_filters` (módulo de Questões) e tem arquivo irmão `051_rollback.sql` no mesmo diretório `supabase/migrations/`. A migration `053_create_study_routine_gamification.sql` não referencia nenhum desses objetos e foi validada integralmente no PGlite isolado sem `051` (`to_regclass('public.questions') IS NULL`, criando `4` tabelas, `7` índices, `13` triggers, `4` políticas RLS, `11` funções `private.*` e `6` RPCs `public.*`).
- **100% dos pré-requisitos reais da `053` confirmados no catálogo remoto (`pg_catalog` / `pg_attribute`)**: `auth.users`, `auth.uid()`, `public.update_updated_at_column()`, `private.has_active_content_access()`, `public.topics` (`topic_id`, `discipline`, `title`, `sort_order`, `archived_at`), `public.sections` (`section_id`, `topic_id`, `content_unit_id`, `title`, `sort_order`, `archived_at`) e `public.user_progress` (`user_id`, `section_id`, `content_unit_id`, `completed`, `updated_at` e `user_progress_user_content_unit_key`).
- **Autorização pendente antes de escrita remota**: o projeto Supabase vinculado (`wbre***.supabase.co`) atende o ambiente de produção (`https://proconcursos.com.br/resumos`), não havendo projeto de homologação separado configurado neste ambiente local. A aplicação remota da `053` e testes de escrita em conta autorizada aguardam autorização operacional explícita para esse destino.

### Procedimento concreto e transacional de aplicação no ambiente remoto (aguardando autorização explícita para `wbre***.supabase.co`)

1. **Identificação do ambiente (sem expor segredos)**:
   - Confirmar que `supabase/.temp/project-ref` e `NEXT_PUBLIC_SUPABASE_URL` apontam para o projeto vinculado (`wbre***.supabase.co`) e definir a conta/ambiente de validação sem usar dados pessoais de terceiros.
2. **Preflight somente-leitura**:
   - Confirmar em `supabase_migrations.schema_migrations` que `050` e `052` existem e `053` ainda está ausente; confirmar `0` tabelas/RPCs de rotina em `pg_catalog` e presença integral dos pré-requisitos (`topics`, `sections`, `user_progress`, `update_updated_at_column()`, `private.has_active_content_access()`).
3. **Backup lógico criptografado obrigatório pré-migration**:
   - Executar no root autorizado do repositório (`C:\PRO\site`):
     - `npm run release:preflight:backup`
     - Capturar a saída do backup:
       ```bash
       npm run backup:supabase
       ```
       O script retorna um JSON contendo o caminho do arquivo gerado (`backup_file`, e.g. `backups/supabase/pro-resumos-backup-YYYYMMDD-HHMMSS.probackup`).
       *(Nota: o backup descobre o catálogo de origem via fonte autoritativa — conexão PostgreSQL direta, snapshot verificado ou OpenAPI estrito. Falhas de catálogo como HTTP 401/403/500, timeout ou JSON inválido abortam o processo com erro explícito; tabelas futuras da migration 053 só são classificadas como ausentes mediante comprovação de não existência no catálogo remoto; tabelas que constem no catálogo mas retornem PGRST205 abortam por inconsistência de cache).*
     - Executar a verificação de integridade passando o arquivo exato recém-gerado:
       ```bash
       npm run backup:verify -- --backup "backups/supabase/pro-resumos-backup-YYYYMMDD-HHMMSS.probackup"
       ```
       *(Se utilizada a chave portável com frase, informar também `--recovery-key "backups/supabase/pro-resumos-backup-YYYYMMDD-HHMMSS.key.recovery"` e definir `PRO_BACKUP_RECOVERY_PASSPHRASE`).*
   - Confirmar o resumo de integridade (`verified: true`, contagem de tabelas e linhas conferidas contra hashes SHA-256) antes de executar qualquer DDL.
   - NUNCA executar `npm run backup:verify` sem o argumento `--backup`.
4. **Execução transacional isolada apenas da `053` (sem `supabase db push` cego)**:
   - Não rodar `supabase db push` enquanto `051_normalize_boards_and_review_filter.sql` e `051_rollback.sql` permanecerem pendentes/duplicadas no diretório. Executar somente `supabase/migrations/053_create_study_routine_gamification.sql` envolta em transação única e registrar a versão `053` em `supabase_migrations.schema_migrations` (`version TEXT NOT NULL`, `name TEXT`):
     ```sql
     BEGIN;
     -- Conteúdo integral de supabase/migrations/053_create_study_routine_gamification.sql
     INSERT INTO supabase_migrations.schema_migrations (version, name)
     VALUES ('053', 'create_study_routine_gamification')
     ON CONFLICT (version) DO NOTHING;
     COMMIT;
     NOTIFY pgrst, 'reload schema';
     ```
5. **Pós-checagens obrigatórias (catálogo + HTTP `GET` + isolamento RLS)**:
   - Conferir em `pg_catalog`: `4` tabelas (`user_study_routine_preferences`, `study_routine_weekly_plans`, `study_routine_sessions`, `study_routine_session_activities`), `7` índices `idx_study_routine_*`, `13` triggers não internos, `4` políticas RLS `FOR SELECT TO authenticated`, `11` funções `private.*`, `6` RPCs `public.*` (`SECURITY DEFINER`) e `0` privilégios para `anon` ou DML direto para `authenticated`.
   - Conferir via `GET /rest/v1/user_study_routine_preferences?select=*&limit=1` e `/rest/v1/` OpenAPI que as 4 tabelas e 6 endpoints `/rpc/*` estão expostos sem `PGRST205`/`PGRST202` (nunca validar existência via `HEAD`).
   - Executar smoke automatizado de dois usuários reais (sem `STUDY_ROUTINE_DEV_FALLBACK`):
     `npm run test:rls-two-users`
     Esperado: `rotina: verificada nas 4 tabelas (SELECT RLS + bloqueio DML 42501) e RPCs` e remoção integral das fixtures temporárias.
6. **Validação ponta a ponta autenticada em conta autorizada (sem fallback)**:
   - Com o deploy atualizado (contendo `docs/reconciliar-ativacao-gamificacao` integrado após aprovação), entrar com conta de teste Google autorizada e validar: onboarding (meta/fuso/disciplina/duração), troca dinâmica `5`/`15`/`30` min, seleção manual, início/pausa/recarregamento/retomada/conclusão de sessão, avanço de recomendação, histórico recente, alteração agendada para segunda-feira, ocultar/reexibir, `/resumos/dashboard/configuracoes`, temas Claro/Escuro/Sépia e viewports desktop (`1280px`) e mobile (`360px`).

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
| `npm.cmd run test:gamification` | 34/34 aprovados, 0 falhas, 0 ignorados | `gamification-calendar.test.mjs`, `gamification-session.test.mjs` (fallback em memória sem mutações Supabase), `gamification-ui.test.mjs` e `gamification-postgres.test.mjs` (PGlite + PostgreSQL 18 multi-conexão + `REVOKE`/`GRANT` + coexistência com fixtures versionadas de `026` e `052` verificadas por SHA-256, sem `origin/main` ou `.git`) |
| Execução em cópia limpa sem `.git` (`node --test tests/gamification-*.test.mjs`) | 34/34 aprovados, 0 falhas, 0 ignorados | Cópia isolada em `%TEMP%` sem `.git` (`git rev-parse --is-inside-work-tree` falha com exit 128), sem `origin/main` e sem rede, usando fixtures SQL versionadas de `026` e `052` |
| `npx.cmd eslint tests/gamification-postgres.test.mjs tests/gamification-ui.test.mjs` | Aprovado (0 erros, 0 warnings) | Executado após a edição final dos testes |
| `npm.cmd run test:content` | 44/44 aprovados, 0 falhas, 0 ignorados | Contrato editorial e importação preservados |
| `npm.cmd run test:api-auth` | 3/3 aprovados, 0 falhas, 0 ignorados | Autenticação admin |
| `npm.cmd run test:auth` | 9/9 aprovados, 0 falhas, 0 ignorados | OAuth Google e guardas |
| `npm.cmd run test:site-paths` | 3/3 aprovados, 0 falhas, 0 ignorados | Prefixos `/resumos` |
| `npm.cmd run test:highlights` | 9/9 aprovados, 0 falhas, 0 ignorados | Realces e same-origin |
| `npm.cmd run test:payments` | 14/14 aprovados, 0 falhas, 0 ignorados | Webhooks e cancelamento |
| Demais 14 suítes em `tests/*.test.mjs` | 37/37 aprovados, 0 falhas, 0 ignorados | `content-import-governance`, `dashboard-navigation-a11y`, `dashboard-preferences-ux`, `gateway-rules`, `import-route-security`, `markdown-mermaid`, `mermaid-render-queue`, `mermaid-transition-labels`, `note-images`, `payment-logging`, `return-paths`, `security-headers`, `user-start-page`, `webhook-body-limit` |
| Varredura estática / contratos em `gamification-ui.test.mjs` | Aprovada | Módulos `src/lib/gamification/*`, `src/app/api/study-routine/*`, `src/components/gamification/*` e `docs/GAMIFICACAO_IMPLEMENTACAO.md` conformes |
| `npx.cmd eslint src scripts tests` | Exit 0 (0 erros, 1 warning preexistente) | Warning preexistente em `scripts/content-admin.mjs:266:31` |
| `npx.cmd tsc --noEmit` | Exit 0 | Tipagem global sem erros |
| `npm.cmd run build -- --webpack` | Exit 0 | Build de produção concluído, `27/27` páginas estáticas e rota `ƒ /api/study-routine` |
| `node --check scripts/test-rls-two-users.mjs` | Exit 0 | Sintaxe validada; `supabase status` sem Docker local nesta estação e sem projeto de homologação separado |
| Inspeção em navegador (`http://127.0.0.1:3000/resumos/dashboard`) | Bloqueada para fluxos autenticados (`AUTH_REQUIRED`) | Servidor local ativo e sem overflow em `/resumos/login` (HTTP 200); sem sessão Google OAuth ativa, todos os fluxos autenticados permaneceram não executados |

### Parecer atual e pendências para liberação

- **Parecer atual:** **Apto para validação final** (não declarado concluído para produção enquanto penderem os itens abaixo).
- **Prévia autenticada (ação manual necessária):** entrar com conta Google autorizada e assinatura ativa em `http://127.0.0.1:3000/resumos/login` e validar `/resumos/dashboard`, página de estudo e `/resumos/dashboard/configuracoes` nos temas **Light**, **Dark** e **Sepia** (desktop `1280px` e mobile `360px`).
- **Homologação / aplicação da migration `053`:** aplicar `053_create_study_routine_gamification.sql` em ambiente Supabase de homologação/destino acima de `052_create_launch_interests.sql`, executar `NOTIFY pgrst, 'reload schema';`, rodar `npm.cmd run test:rls-two-users` e concluir smoke autenticado sem `STUDY_ROUTINE_DEV_FALLBACK`.

## Integração sobre a main — 15/11/2026

- Origem do recurso: `docs/plano-gamificacao-antigravity`, commit `6763280`. Integração seletiva das mudanças de gamificação sobre `origin/main` em `7395ebb`, sem integrar os commits antigos e alheios ao recurso da branch de origem.
- Preservados Next.js 16.4.3, dependências de produção, Questões, Planner, navegação, autenticação, testes e histórico documental já presentes na main. Dependências PGlite e pg permanecem somente de desenvolvimento.
- Conflitos resolvidos em package.json/lockfile, tipos do banco, changelog e script RLS. No script, restaurado explicitamente o entitlement pendente da fixture B antes das negativas da rotina, pois os testes atuais da main a deixam com acesso ativo.
- Verificação desta integração: lint sem erros (13 avisos preexistentes); `npm run typecheck` aprovado; `npm run test:release` com 294 testes, 290 aprovados e 4 ignorados por dependerem de credenciais remotas; build webpack aprovado (43 páginas geradas); `npm audit --omit=dev --audit-level=high` sem vulnerabilidades; sintaxe do script RLS e diff sem erros.
- Login Google iniciado pelo navegador com a conta já autenticada no site público: duas tentativas locais retornaram `/resumos/login?error=auth`, inclusive na versão integrada. Não houve bypass nem cópia de cookies/tokens entre origens. Sessão em produção não autentica automaticamente localhost.
- Validação visual autenticada da gamificação permanece não executada. Testes de banco foram realizados em PostgreSQL isolado; quatro testes administrativos remotos não foram executados pelo runner sem credenciais.
- Envio do código para main autorizado expressamente pelo usuário em 15/11/2026. Isso não equivale à ativação do recurso: migration 053 não aplicada remotamente nesta tarefa, persistência Supabase/homologação e deploy autenticado ainda não verificados. Não houve alteração de credenciais ou configuração OAuth.

## Reconciliação da Ativação e Estado Verificado — 15/11/2026

| Camada | Estado verificado em 15/11/2026 | Observações / Evidência |
| --- | --- | --- |
| **Código na `origin/main` (`a46c3b4`) + branch `docs/reconciliar-ativacao-gamificacao`** | Integrado na `main` (`a46c3b4`); ajustes de estado indisponível/rotina não ativada em `docs/reconciliar-ativacao-gamificacao` | `TodayStudyCard` e `StudySessionBar` corrigidos para não exibir `"0 de 3 dias"` antes da ativação e para explicar o bloqueio antes do onboarding; `35/35` em `test:gamification`, `291/295` em `test:release` (`4` ignorados por ausência de credenciais no runner), `lint` `0` erros, `typecheck` exit `0`, `build -- --webpack` `43/43` |
| **Deploy em produção (`https://proconcursos.com.br/resumos`)** | Publicado em `a46c3b4` (Netlify) | `/resumos/api/health` responde `200`; `/resumos/api/study-routine` responde `401` sem sessão; com sessão (teste do Codex), `persistenceAvailable: false`, `needsOnboarding: true`, `currentPlan: null`; navegação, temas Claro/Escuro/Sépia, 360 px, notas e Mermaid operando |
| **Estrutura no banco remoto (`wbre***.supabase.co`)** | **Pendente de aplicação autorizada da `053`** (`053` ausente) | Histórico remoto tem `001`–`050` e `052`; `051` ausente e sem dependência com `053`; 100% dos pré-requisitos reais de `053` confirmados em `pg_catalog`; `0/4` tabelas e `0/6` RPCs no remoto hoje; validação completa sem `051` aprovada em PostgreSQL isolado |
| **Persistência autenticada real e smoke pós-`053`** | **Pendente de execução da `053` autorizada no banco** | Requer execução transacional autorizada de `053_create_study_routine_gamification.sql` + `NOTIFY pgrst, 'reload schema';` + `npm run test:rls-two-users` + smoke autenticado em conta de teste sem fallback |

- **Publicação em produção confirmada (`a46c3b4`)**: `https://proconcursos.com.br/resumos/api/health` responde `200 OK` e `https://proconcursos.com.br/resumos/api/study-routine` responde `401 Unauthorized` sem sessão, confirmando que a integração na `origin/main` (`a46c3b4`) está publicada no Netlify. Com sessão ativa e sem a migration `053`, `/resumos/dashboard` degrada com segurança (`persistenceAvailable: false`) e `/resumos/api/study-routine` responde HTTP `503` controlado (`code: "schema_unavailable"`).
- **Banco remoto reconciliado (`wbre***.supabase.co`, leitura direta no catálogo PostgreSQL)**: `supabase_migrations.schema_migrations` (`version TEXT NOT NULL`, `statements TEXT[]`, `name TEXT`) contém `001`–`050` e `052` (`051` e `053` ausentes), e o catálogo `pg_catalog` confirma `0/4` tabelas, `0/7` índices, `0` constraints, `0/13` triggers, `0/4` políticas RLS, `0/11` funções `private.*` e `0/6` RPCs `public.*` da rotina. Em contrapartida, todos os pré-requisitos reais (`auth.users`, `auth.uid()`, `public.update_updated_at_column()`, `private.has_active_content_access()`, `public.topics`, `public.sections`, `public.user_progress` + `user_progress_user_content_unit_key`) já existem e `053` não depende de `051` (provado também no PGlite sem `public.questions`). O catálogo OpenAPI do PostgREST (`/rest/v1/`) expõe `26` RPCs anteriores e nenhuma tabela ou `/rpc/*` da rotina.
- **Esclarecimento do falso positivo anterior de "4 tabelas acessíveis"**: consultas via `@supabase/supabase-js` com `.select("*", { count: "exact", head: true })` disparam HTTP `HEAD /rest/v1/<table>?select=*`, para o qual o PostgREST devolve HTTP `404` com corpo vazio, fazendo o cliente retornar `{ error: null }` mesmo para tabelas inexistentes. Consultas `GET` retornam `PGRST205` para todas as 4 tabelas, eliminando a hipótese de aplicação parcial da `053` ou defeito isolado de cache das 6 RPCs.
- **Causa forense do `/resumos/login?error=auth` local**: em `auth.flow_state`, as 3 tentativas locais emitiram `auth_code` (`user_linked = true`) e atingiram `/resumos/auth/callback?code=...`, mas o `auth_code` permaneceu não consumido (`auth_code IS NOT NULL`) sem criar sessão em `auth.sessions`, por ausência/divergência do cookie PKCE `sb-<ref>-auth-token-code-verifier` no momento da troca em `exchangeCodeForSession`. Sessões de `https://proconcursos.com.br` não trafegam para `localhost`.
- **Autorização necessária para concluir a ativação**: falta exclusivamente autorização explícita para executar o procedimento transacional da migration `053` no projeto Supabase vinculado (`wbre***.supabase.co`, mesmo banco utilizado por produção em `https://proconcursos.com.br/resumos`) — além de eventual autorização de integração em `main` e deploy após revisão das correções de UI em `docs/reconciliar-ativacao-gamificacao` (detalhes completos nas seções 3C acima e 8 de `docs/GAMIFICACAO_DIAGNOSTICO.md`).
