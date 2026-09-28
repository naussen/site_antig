-- Executa os constraint triggers enquanto a funcao SECURITY DEFINER ainda esta
-- ativa. Assim, o service_role nao precisa receber USAGE no schema private.
DO $$
DECLARE
  function_definition TEXT;
  final_return TEXT := '  RETURN jsonb_build_object(' || chr(10) ||
    '    ''batch_id'', batch_id,';
BEGIN
  SELECT pg_get_functiondef('public.import_questions_batch(jsonb)'::regprocedure)
  INTO function_definition;

  function_definition := replace(
    function_definition,
    final_return,
    '  SET CONSTRAINTS ALL IMMEDIATE;' || chr(10) || chr(10) || final_return
  );

  IF function_definition NOT LIKE '%SET CONSTRAINTS ALL IMMEDIATE;%' THEN
    RAISE EXCEPTION 'could not add immediate constraint validation to import_questions_batch';
  END IF;

  EXECUTE function_definition;
END;
$$;
