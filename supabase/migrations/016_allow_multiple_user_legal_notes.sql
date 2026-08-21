-- Migration 016: permite até dez anotações pessoais por dispositivo legal

ALTER TABLE public.user_legal_notes
  DROP CONSTRAINT IF EXISTS user_legal_notes_user_fragment_key;

CREATE OR REPLACE FUNCTION public.enforce_user_legal_notes_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.user_id::text || ':' || NEW.legal_fragment_id::text, 0)
  );

  IF (
    SELECT count(*)
    FROM public.user_legal_notes
    WHERE user_id = NEW.user_id
      AND legal_fragment_id = NEW.legal_fragment_id
  ) >= 10 THEN
    RAISE EXCEPTION 'user_legal_notes limit exceeded' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_user_legal_notes_limit ON public.user_legal_notes;
CREATE TRIGGER trigger_user_legal_notes_limit
  BEFORE INSERT ON public.user_legal_notes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_legal_notes_limit();

COMMENT ON FUNCTION public.enforce_user_legal_notes_limit() IS
  'Impõe no banco o limite de dez anotações por usuário e dispositivo, inclusive sob concorrência';

REVOKE EXECUTE ON FUNCTION public.enforce_user_legal_notes_limit() FROM PUBLIC, anon, authenticated;
