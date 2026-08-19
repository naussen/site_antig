BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

SELECT plan(16);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'legis-a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'legis-b@example.test', '', now(), now(), now());

INSERT INTO public.user_entitlements (user_id, provider, status)
VALUES ('10000000-0000-0000-0000-000000000001', 'test', 'active');

INSERT INTO public.laws (
  id, slug, acronym, name, law_type, jurisdiction, official_source_url
) VALUES (
  '30000000-0000-0000-0000-000000000003', 'lei-publicada', 'LP',
  'Lei publicada', 'law', 'federal', 'https://example.gov.br/lei-publicada'
), (
  '40000000-0000-0000-0000-000000000004', 'lei-rascunho', 'LR',
  'Lei rascunho', 'law', 'federal', 'https://example.gov.br/lei-rascunho'
);

INSERT INTO public.law_versions (
  id, law_id, version_label, source_url, raw_source_hash,
  canonicalization, canonical_content_hash, checked_at, status,
  reviewed_by, reviewed_at, published_by, published_at
) VALUES (
  '50000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000003',
  'publicada', 'https://example.gov.br/publicada.pdf',
  'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'pro-legis.fragment-lines.v1',
  'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  now(), 'draft', NULL, NULL, NULL, NULL
), (
  '60000000-0000-0000-0000-000000000006',
  '40000000-0000-0000-0000-000000000004',
  'rascunho', 'https://example.gov.br/rascunho.pdf',
  'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  'pro-legis.fragment-lines.v1',
  'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
  now(), 'draft', NULL, NULL, NULL, NULL
);

INSERT INTO public.legal_fragments (
  id, law_version_id, stable_key, fragment_type, reference, order_index, official_text
) VALUES (
  '70000000-0000-0000-0000-000000000007',
  '50000000-0000-0000-0000-000000000005',
  'lei-publicada.art-1', 'article', 'Art. 1º', 1, 'Texto publicado.'
), (
  '80000000-0000-0000-0000-000000000008',
  '60000000-0000-0000-0000-000000000006',
  'lei-rascunho.art-1', 'article', 'Art. 1º', 1, 'Texto em rascunho.'
);

UPDATE public.laws
SET current_version_id = '50000000-0000-0000-0000-000000000005', status = 'published'
WHERE id = '30000000-0000-0000-0000-000000000003';

INSERT INTO public.law_flashcards (
  id, legal_fragment_id, statement_markdown, correct_answer,
  explanation_markdown, content_hash, status
) VALUES (
  '90000000-0000-0000-0000-000000000009',
  '70000000-0000-0000-0000-000000000007',
  'O texto está publicado.', true, 'Literalidade do Art. 1º.',
  'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 'draft'
);

UPDATE public.law_flashcards SET status = 'reviewed'
WHERE id = '90000000-0000-0000-0000-000000000009';

UPDATE public.law_versions
SET status = 'reviewed',
    reviewed_by = '10000000-0000-0000-0000-000000000001',
    reviewed_at = now()
WHERE id = '50000000-0000-0000-0000-000000000005';

UPDATE public.law_flashcards SET status = 'published'
WHERE id = '90000000-0000-0000-0000-000000000009';

UPDATE public.law_versions
SET status = 'published',
    published_by = '20000000-0000-0000-0000-000000000002',
    published_at = now()
WHERE id = '50000000-0000-0000-0000-000000000005';

SET LOCAL ROLE anon;
SELECT throws_ok(
  'SELECT count(*) FROM public.laws',
  '42501',
  NULL,
  'anon não recebe privilégio de leitura das leis'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1","app_metadata":{}}',
  true
);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.laws), 0::bigint, 'usuário sem entitlement não lê acervo');
RESET ROLE;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1","app_metadata":{}}',
  true
);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.laws), 1::bigint, 'assinante lê lei publicada');
SELECT is((SELECT count(*) FROM public.law_versions), 1::bigint, 'assinante não lê versão draft');
SELECT is((SELECT count(*) FROM public.legal_fragments), 1::bigint, 'assinante lê somente fragmento publicado');
SELECT is(
  has_column_privilege('authenticated', 'public.law_flashcards', 'statement_markdown', 'SELECT'),
  true,
  'assinante lê o enunciado do flashcard'
);
SELECT is(
  has_column_privilege('authenticated', 'public.law_flashcards', 'correct_answer', 'SELECT'),
  false,
  'assinante não recebe o gabarito por SELECT direto'
);

INSERT INTO public.user_law_progress (
  user_id, legal_fragment_id, reading_status, read_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000007', 'read', now()
);
SELECT is((SELECT count(*) FROM public.user_law_progress), 1::bigint, 'usuário A lê o próprio progresso');
INSERT INTO public.user_legal_notes (user_id, legal_fragment_id, content)
VALUES ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000007', 'Nota privada da fixture');
SELECT is((SELECT count(*) FROM public.user_legal_notes), 1::bigint, 'usuário A lê a própria anotação legal');
SELECT throws_ok(
  $$INSERT INTO public.user_legal_notes (user_id, legal_fragment_id, content)
    VALUES ('20000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000007', 'Tentativa indevida')$$,
  '42501', NULL, 'usuário A não grava anotação em nome do usuário B'
);
SELECT is(
  (public.answer_law_flashcard_v2('90000000-0000-0000-0000-000000000009', true) ->> 'is_correct')::boolean,
  true,
  'RPC calcula a resposta correta no servidor'
);
SELECT throws_ok(
  $$INSERT INTO public.user_law_flashcard_answers (
      user_id, law_flashcard_id, selected_answer, is_correct
    ) VALUES (
      '10000000-0000-0000-0000-000000000001',
      '90000000-0000-0000-0000-000000000009', false, true
    )$$,
  '42501',
  NULL,
  'browser não grava is_correct diretamente'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2","app_metadata":{"role":"admin","legis_permissions":["legis.review"]}}',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM public.law_versions
   WHERE id IN (
     '50000000-0000-0000-0000-000000000005',
     '60000000-0000-0000-0000-000000000006'
   )),
  2::bigint,
  'revisor AAL2 vê os drafts da fixture'
);
SELECT is((SELECT count(*) FROM public.user_law_progress), 0::bigint, 'usuário B não lê progresso do usuário A');
UPDATE public.user_law_progress SET reading_status = 'reading';
RESET ROLE;
SELECT is(
  (SELECT reading_status FROM public.user_law_progress
   WHERE user_id = '10000000-0000-0000-0000-000000000001'),
  'read',
  'usuário B não altera progresso do usuário A'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1","app_metadata":{"role":"admin","legis_permissions":["legis.review"]}}',
  true
);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*) FROM public.law_versions), 0::bigint, 'admin AAL1 não vê drafts');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
