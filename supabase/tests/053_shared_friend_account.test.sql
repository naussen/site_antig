-- Executar somente no banco de testes, após aplicar migrations. Tudo é revertido.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT plan(15);

INSERT INTO auth.users(id, email, encrypted_password, raw_app_meta_data)
VALUES ('f5300000-0000-0000-0000-000000000001', 'amigos@acesso.proconcursos.invalid', 'initial',
  '{"shared_account":true,"rotation_nonce":"initial"}');
SELECT throws_ok($$INSERT INTO auth.users(id,email,raw_app_meta_data)
  VALUES ('f5300000-0000-0000-0000-000000000002','amigos@acesso.proconcursos.invalid','{"shared_account":true}')$$,
  '23505', NULL, 'segunda identidade compartilhada rejeitada');
SELECT throws_ok($$UPDATE auth.users SET encrypted_password='changed'
  WHERE id='f5300000-0000-0000-0000-000000000001'$$,
  'P0001', 'Credenciais compartilhadas são gerenciadas pelo servidor', 'convidado não troca senha');
SELECT throws_ok($$UPDATE auth.users SET email_change='attacker@example.test'
  WHERE id='f5300000-0000-0000-0000-000000000001'$$,
  'P0001', 'Credenciais compartilhadas são gerenciadas pelo servidor', 'convidado não inicia troca de email');
SELECT lives_ok($$UPDATE auth.users SET encrypted_password='rotated',
  raw_app_meta_data=raw_app_meta_data || '{"rotation_nonce":"new"}'::jsonb
  WHERE id='f5300000-0000-0000-0000-000000000001'$$, 'rotação administrativa aceita');
SELECT throws_ok($$UPDATE auth.users SET raw_app_meta_data=raw_app_meta_data || '{"role":"admin"}'::jsonb
  WHERE id='f5300000-0000-0000-0000-000000000001'$$,
  'P0001', 'Identidade compartilhada inválida', 'conta Amigos não recebe papel admin');
SELECT throws_ok($$INSERT INTO auth.mfa_factors(id,user_id,factor_type,status)
  VALUES (gen_random_uuid(),'f5300000-0000-0000-0000-000000000001','totp','unverified')$$,
  'P0001', 'Conta compartilhada não permite segundo fator', 'MFA bloqueado');
SELECT ok(NOT has_table_privilege('authenticated','public.shared_friend_account','SELECT'), 'usuário não lê controle');
SELECT ok(NOT has_table_privilege('authenticated','public.shared_friend_account','UPDATE'), 'usuário não modifica controle');
SELECT ok(NOT has_function_privilege('authenticated','public.claim_shared_friend_rotation()','EXECUTE'), 'usuário não dispara rotação');
SELECT ok(NOT has_function_privilege('anon','public.claim_shared_friend_rotation()','EXECUTE'), 'anônimo não dispara rotação');

UPDATE public.shared_friend_account SET lease_until=NULL, rotated_at=NULL, delivered_at=NULL;
SELECT is((SELECT count(*)::int FROM public.claim_shared_friend_rotation()),1,'primeira execução recebe lease');
SELECT is((SELECT count(*)::int FROM public.claim_shared_friend_rotation()),0,'execução concorrente recusada');
UPDATE public.shared_friend_account SET lease_until=NULL, rotated_at=now(), delivered_at=now();
SELECT is((SELECT count(*)::int FROM public.claim_shared_friend_rotation()),0,'não renova antes de 15 dias');
UPDATE public.shared_friend_account SET rotated_at=now()-interval '15 days';
SELECT is((SELECT count(*)::int FROM public.claim_shared_friend_rotation()),1,'renova após 15 dias');
UPDATE public.shared_friend_account SET lease_until=NULL, rotated_at=now(), delivered_at=NULL;
SELECT is((SELECT count(*)::int FROM public.claim_shared_friend_rotation()),1,'entrega pendente pode repetir');
SELECT * FROM finish();
ROLLBACK;
