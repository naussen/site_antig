-- Garante que os triggers de validação editorial executem como owner (SECURITY DEFINER)
-- e que o service_role possa dispará-los sem erro de permissão no schema private.

ALTER FUNCTION private.validate_published_question_trigger() SECURITY DEFINER;
ALTER FUNCTION private.validate_questions_for_topic_discipline() SECURITY DEFINER;

GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.validate_published_question_trigger() TO service_role;
GRANT EXECUTE ON FUNCTION private.validate_questions_for_topic_discipline() TO service_role;
