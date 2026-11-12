-- Uma única identidade compartilhada, sem privilégios de administração.
CREATE UNIQUE INDEX auth_users_single_shared_account
  ON auth.users ((true))
  WHERE raw_app_meta_data ->> 'shared_account' = 'true';

CREATE FUNCTION private.protect_shared_account_credentials()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.raw_app_meta_data ->> 'shared_account' = 'true'
     AND (NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.email_change IS DISTINCT FROM OLD.email_change
       OR NEW.phone IS DISTINCT FROM OLD.phone
       OR NEW.phone_change IS DISTINCT FROM OLD.phone_change)
     AND (NEW.raw_app_meta_data ->> 'rotation_nonce') IS NOT DISTINCT FROM
         (OLD.raw_app_meta_data ->> 'rotation_nonce') THEN
    RAISE EXCEPTION 'Credenciais compartilhadas são gerenciadas pelo servidor';
  END IF;
  IF NEW.raw_app_meta_data ->> 'shared_account' = 'true'
     AND (NEW.email <> 'amigos@acesso.proconcursos.invalid'
       OR COALESCE(NEW.raw_app_meta_data ->> 'role', '') = 'admin') THEN
    RAISE EXCEPTION 'Identidade compartilhada inválida';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.protect_shared_account_credentials() FROM PUBLIC;
CREATE TRIGGER protect_shared_account_credentials BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.protect_shared_account_credentials();

CREATE FUNCTION private.prevent_shared_account_mfa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id
    AND raw_app_meta_data ->> 'shared_account' = 'true') THEN
    RAISE EXCEPTION 'Conta compartilhada não permite segundo fator';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.prevent_shared_account_mfa() FROM PUBLIC;
CREATE TRIGGER prevent_shared_account_mfa BEFORE INSERT ON auth.mfa_factors
  FOR EACH ROW EXECUTE FUNCTION private.prevent_shared_account_mfa();

CREATE TABLE public.shared_friend_account (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  rotation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  rotated_at timestamptz,
  delivered_at timestamptz,
  lease_until timestamptz
);
ALTER TABLE public.shared_friend_account ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shared_friend_account FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.shared_friend_account TO service_role;
INSERT INTO public.shared_friend_account(singleton) VALUES (true);

CREATE FUNCTION public.claim_shared_friend_rotation()
RETURNS SETOF public.shared_friend_account
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  UPDATE public.shared_friend_account
  SET lease_until = now() + interval '5 minutes',
      rotation_id = CASE WHEN delivered_at IS NOT NULL THEN gen_random_uuid() ELSE rotation_id END,
      rotated_at = CASE WHEN delivered_at IS NOT NULL THEN NULL ELSE rotated_at END,
      delivered_at = NULL
  WHERE singleton
    AND (lease_until IS NULL OR lease_until < now())
    AND (delivered_at IS NULL OR rotated_at <= now() - interval '15 days')
  RETURNING *;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_shared_friend_rotation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_shared_friend_rotation() TO service_role;
