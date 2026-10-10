BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(27);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a2600000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'questions-a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b2600000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'questions-b@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c2600000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'questions-c@example.test', '', now(), now(), now());

INSERT INTO public.user_entitlements (user_id, provider, provider_subscription_id, status) VALUES
  ('a2600000-0000-0000-0000-000000000001', 'mercado_pago', 'questions-sub-a', 'active'),
  ('b2600000-0000-0000-0000-000000000002', 'mercado_pago', 'questions-sub-b', 'active');

INSERT INTO public.topics (topic_id, title, discipline)
VALUES ('questions-topic', 'Tópico de questões', 'Disciplina de questões');

INSERT INTO public.disciplines (id, slug, name)
VALUES (
  'd2600000-0000-0000-0000-000000000004',
  'disciplina-de-questoes',
  'Disciplina de questões'
);

INSERT INTO public.topic_discipline_relations (topic_id, discipline_id, is_primary)
VALUES (
  'questions-topic',
  'd2600000-0000-0000-0000-000000000004',
  true
);

INSERT INTO public.questions (
  id, external_id, question_type, statement_markdown, subject, status
) VALUES (
  'e2600000-0000-0000-0000-000000000005',
  'questions-fixture-001',
  'multiple_choice',
  'Qual é a alternativa correta?',
  'Assunto de teste',
  'draft'
);

INSERT INTO public.question_discipline_relations (
  question_id, discipline_id, is_primary
) VALUES (
  'e2600000-0000-0000-0000-000000000005',
  'd2600000-0000-0000-0000-000000000004',
  true
);

INSERT INTO public.question_topic_relations (
  question_id, topic_id, relation_type
) VALUES (
  'e2600000-0000-0000-0000-000000000005',
  'questions-topic',
  'primary'
);

INSERT INTO public.question_options (
  id, question_id, label, body_markdown, sort_order
) VALUES
  ('f2600000-0000-0000-0000-000000000006', 'e2600000-0000-0000-0000-000000000005', 'A', 'Alternativa correta.', 0),
  ('f2600000-0000-0000-0000-000000000007', 'e2600000-0000-0000-0000-000000000005', 'B', 'Alternativa incorreta.', 1);

INSERT INTO public.question_answer_keys (
  question_id, correct_option_id, updated_by
) VALUES (
  'e2600000-0000-0000-0000-000000000005',
  'f2600000-0000-0000-0000-000000000006',
  'a2600000-0000-0000-0000-000000000001'
);

INSERT INTO public.question_explanations (
  question_id, body_markdown, status, reviewed_by, reviewed_at
) VALUES (
  'e2600000-0000-0000-0000-000000000005',
  'A alternativa A corresponde ao gabarito revisado.',
  'published',
  'a2600000-0000-0000-0000-000000000001',
  now()
);

UPDATE public.questions
SET status = 'published', published_at = now()
WHERE id = 'e2600000-0000-0000-0000-000000000005';

SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$SELECT public.list_questions()$$,
  '42501',
  NULL,
  'anon não executa a listagem de questões'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a2600000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1","app_metadata":{}}',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  jsonb_array_length(public.list_questions() -> 'items'),
  1,
  'assinante A recebe a questão publicada'
);
SELECT is(
  (public.list_questions() #> '{items,0}') ? 'correct_option_id',
  false,
  'listagem não expõe o gabarito'
);
SELECT is(
  public.list_questions() #>> '{items,0,disciplines,0,slug}',
  'disciplina-de-questoes',
  'listagem retorna disciplina relacionada'
);
SELECT is(
  public.list_questions() #>> '{items,0,topics,0,topic_id}',
  'questions-topic',
  'listagem retorna tópico relacionado'
);
RESET ROLE;

SELECT is(
  has_table_privilege('authenticated', 'public.question_answer_keys', 'SELECT'),
  false,
  'authenticated não lê tabela de gabarito'
);
SELECT is(
  has_table_privilege('authenticated', 'public.user_question_attempts', 'SELECT'),
  false,
  'authenticated não consulta tentativas diretamente'
);
SELECT is(
  has_table_privilege('authenticated', 'public.question_comments', 'SELECT'),
  false,
  'authenticated não consulta comentários diretamente'
);
SELECT is(
  has_table_privilege('authenticated', 'public.question_comment_aliases', 'SELECT'),
  false,
  'authenticated não consulta aliases diretamente'
);

SET LOCAL ROLE authenticated;
SELECT is(
  (public.submit_question_answer(
    '12600000-0000-0000-0000-000000000008',
    'e2600000-0000-0000-0000-000000000005',
    'f2600000-0000-0000-0000-000000000006',
    1500
  ) ->> 'is_correct')::boolean,
  true,
  'RPC corrige a resposta no servidor'
);
SELECT is(
  (public.submit_question_answer(
    '12600000-0000-0000-0000-000000000008',
    'e2600000-0000-0000-0000-000000000005',
    'f2600000-0000-0000-0000-000000000006',
    1500
  ) ->> 'replayed')::boolean,
  true,
  'repetição da mesma submission é idempotente'
);
SELECT is(
  (public.get_question_stats() ->> 'total_attempts')::integer,
  1,
  'replay não duplica a tentativa'
);
SELECT throws_ok(
  $$SELECT public.submit_question_answer(
    '12600000-0000-0000-0000-000000000008',
    'e2600000-0000-0000-0000-000000000005',
    'f2600000-0000-0000-0000-000000000007',
    1500
  )$$,
  '23505',
  NULL,
  'submission id não pode ser reutilizado para outra resposta'
);
SELECT is(
  (public.set_question_preference(
    'e2600000-0000-0000-0000-000000000005', true, true, 'not_relevant'
  ) ->> 'hidden')::boolean,
  true,
  'usuário oculta a própria questão'
);
SELECT is(
  jsonb_array_length(public.list_questions() -> 'items'),
  0,
  'listagem padrão exclui questão ocultada'
);
SELECT is(
  jsonb_array_length(public.list_questions(20, NULL, NULL, NULL, NULL, true) -> 'items'),
  1,
  'listagem administrativa do usuário inclui questão ocultada'
);
SELECT is(
  (public.set_question_preference(
    'e2600000-0000-0000-0000-000000000005', NULL, true, NULL
  ) ->> 'marked_for_review')::boolean,
  true,
  'usuário marca questão para revisão'
);
SELECT is(
  (public.get_question_stats() ->> 'latest_correct')::integer,
  1,
  'estatística de A registra o acerto mais recente'
);
SELECT is(
  (public.get_question_stats() ->> 'hidden_questions')::integer,
  1,
  'estatística de A registra questão ocultada'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"b2600000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1","app_metadata":{}}',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  public.list_questions() #> '{items,0,latest_attempt}',
  'null'::jsonb,
  'usuário B não recebe a tentativa de A'
);
SELECT is(
  (public.get_question_stats() ->> 'total_attempts')::integer,
  0,
  'estatísticas de B não incluem tentativa de A'
);
SELECT is(
  (public.submit_question_answer(
    '22600000-0000-0000-0000-000000000009',
    'e2600000-0000-0000-0000-000000000005',
    'f2600000-0000-0000-0000-000000000007',
    NULL
  ) ->> 'is_correct')::boolean,
  false,
  'resposta incorreta de B é calculada no servidor'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a2600000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1","app_metadata":{}}',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (public.get_question_stats() ->> 'total_attempts')::integer,
  1,
  'tentativa de B não altera estatísticas de A'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"c2600000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal1","app_metadata":{}}',
  true
);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.list_questions()$$,
  '42501',
  NULL,
  'usuário sem entitlement não lista questões'
);
RESET ROLE;

SELECT is(
  (SELECT count(*) FROM public.topic_discipline_relations WHERE topic_id = 'questions-topic'),
  1::bigint,
  'tópico mantém vínculo canônico com disciplina'
);
SELECT is(
  (SELECT count(*) FROM public.user_question_attempts WHERE user_id = 'a2600000-0000-0000-0000-000000000001'),
  1::bigint,
  'persistência contém somente uma tentativa idempotente de A'
);
SELECT is(
  (SELECT count(*) FROM public.user_question_attempts WHERE user_id = 'b2600000-0000-0000-0000-000000000002'),
  1::bigint,
  'persistência mantém tentativa independente de B'
);

SELECT * FROM finish();
ROLLBACK;
