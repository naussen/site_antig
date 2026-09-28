-- A funcao da migration 031 usa nomes de variaveis iguais aos de colunas.
-- Recompila o corpo com uma diretiva local; nao altera configuracao global.
DO $$
DECLARE
  function_definition TEXT;
BEGIN
  SELECT pg_get_functiondef('public.import_questions_batch(jsonb)'::regprocedure)
  INTO function_definition;

  function_definition := replace(
    function_definition,
    'AS $function$' || chr(10),
    'AS $function$' || chr(10) || '#variable_conflict use_variable' || chr(10)
  );

  IF function_definition NOT LIKE '%#variable_conflict use_variable%' THEN
    RAISE EXCEPTION 'could not patch import_questions_batch variable resolution';
  END IF;

  EXECUTE function_definition;
END;
$$;
