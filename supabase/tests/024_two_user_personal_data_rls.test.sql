BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(18);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'rls-a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b2000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'rls-b@example.test', '', now(), now(), now());

INSERT INTO public.topics (topic_id, title, discipline)
VALUES ('rls-two-users-topic', 'Fixture RLS', 'Teste');
INSERT INTO public.sections (section_id, content_unit_id, stable_key, topic_id, title)
VALUES (
  'rls-two-users-section',
  'c3000000-0000-0000-0000-000000000003',
  'rls-two-users-section',
  'rls-two-users-topic',
  'Fixture RLS'
);

INSERT INTO public.user_notes (user_id, section_id, content_unit_id, content) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'rls-two-users-section', 'c3000000-0000-0000-0000-000000000003', 'nota-a'),
  ('b2000000-0000-0000-0000-000000000002', 'rls-two-users-section', 'c3000000-0000-0000-0000-000000000003', 'nota-b');
INSERT INTO public.user_progress (user_id, section_id, content_unit_id, completed) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'rls-two-users-section', 'c3000000-0000-0000-0000-000000000003', true),
  ('b2000000-0000-0000-0000-000000000002', 'rls-two-users-section', 'c3000000-0000-0000-0000-000000000003', false);
INSERT INTO public.user_dashboard_preferences (user_id, visible_disciplines) VALUES
  ('a1000000-0000-0000-0000-000000000001', ARRAY['A']),
  ('b2000000-0000-0000-0000-000000000002', ARRAY['B']);
INSERT INTO public.user_entitlements (user_id, provider, provider_subscription_id, status) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'mercado_pago', 'rls-sub-a', 'active'),
  ('b2000000-0000-0000-0000-000000000002', 'mercado_pago', 'rls-sub-b', 'pending');
INSERT INTO public.privacy_requests (user_id, contact_email, request_type, message) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'rls-a@example.test', 'access', 'solicitacao do usuario a'),
  ('b2000000-0000-0000-0000-000000000002', 'rls-b@example.test', 'deletion', 'solicitacao do usuario b');

SELECT set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1","app_metadata":{}}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.user_notes), 1::bigint, 'A lê somente a própria nota');
SELECT is((SELECT content FROM public.user_notes), 'nota-a', 'A não recebe conteúdo da nota de B');
SELECT is((SELECT count(*) FROM public.user_progress), 1::bigint, 'A lê somente o próprio progresso');
SELECT is((SELECT count(*) FROM public.user_dashboard_preferences), 1::bigint, 'A lê somente a própria preferência');
SELECT is((SELECT count(*) FROM public.user_entitlements), 1::bigint, 'A lê somente o próprio entitlement');
SELECT is((SELECT count(*) FROM public.privacy_requests), 1::bigint, 'A lê somente a própria solicitação LGPD');
SELECT throws_ok(
  $$INSERT INTO public.user_notes (user_id, section_id, content_unit_id, content)
    VALUES ('b2000000-0000-0000-0000-000000000002', 'rls-two-users-section', 'c3000000-0000-0000-0000-000000000003', 'indevida')$$,
  '42501', NULL, 'A não cria nota em nome de B'
);
SELECT throws_ok(
  $$INSERT INTO public.user_progress (user_id, section_id, content_unit_id, completed)
    VALUES ('b2000000-0000-0000-0000-000000000002', 'rls-two-users-section', 'c3000000-0000-0000-0000-000000000003', true)$$,
  '42501', NULL, 'A não cria progresso em nome de B'
);
UPDATE public.user_notes SET content = 'alterada-por-a'
WHERE user_id = 'b2000000-0000-0000-0000-000000000002';
UPDATE public.user_dashboard_preferences SET visible_disciplines = ARRAY['INDEVIDA']
WHERE user_id = 'b2000000-0000-0000-0000-000000000002';
SELECT throws_ok(
  $$UPDATE public.user_entitlements SET status = 'active'
    WHERE user_id = 'a1000000-0000-0000-0000-000000000001'$$,
  '42501', NULL, 'browser não altera nem o próprio entitlement'
);
SELECT throws_ok(
  $$INSERT INTO public.privacy_requests (user_id, contact_email, request_type, message)
    VALUES ('a1000000-0000-0000-0000-000000000001', 'rls-a@example.test', 'access', 'bypass direto')$$,
  '42501', NULL, 'browser não contorna o canal LGPD server-side'
);
RESET ROLE;
SELECT is((SELECT content FROM public.user_notes WHERE user_id = 'b2000000-0000-0000-0000-000000000002'), 'nota-b', 'A não altera nota de B');
SELECT is((SELECT visible_disciplines FROM public.user_dashboard_preferences WHERE user_id = 'b2000000-0000-0000-0000-000000000002'), ARRAY['B']::text[], 'A não altera preferência de B');

SELECT set_config('request.jwt.claims', '{"sub":"b2000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1","app_metadata":{}}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.user_notes), 1::bigint, 'B lê somente a própria nota');
SELECT is((SELECT content FROM public.user_notes), 'nota-b', 'B não recebe conteúdo da nota de A');
SELECT is((SELECT count(*) FROM public.user_progress), 1::bigint, 'B lê somente o próprio progresso');
SELECT is((SELECT count(*) FROM public.user_dashboard_preferences), 1::bigint, 'B lê somente a própria preferência');
SELECT is((SELECT count(*) FROM public.user_entitlements), 1::bigint, 'B lê somente o próprio entitlement');
SELECT is((SELECT count(*) FROM public.privacy_requests), 1::bigint, 'B lê somente a própria solicitação LGPD');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
