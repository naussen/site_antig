-- Permite escolher o módulo ou a disciplina exibida após o login.
ALTER TABLE public.user_dashboard_preferences
  ADD COLUMN start_module TEXT NOT NULL DEFAULT 'resumos',
  ADD COLUMN start_discipline TEXT DEFAULT NULL,
  ADD CONSTRAINT user_dashboard_preferences_start_module_check
    CHECK (start_module IN ('resumos', 'legis')),
  ADD CONSTRAINT user_dashboard_preferences_start_discipline_check
    CHECK (
      start_discipline IS NULL
      OR (
        start_module = 'resumos'
        AND char_length(start_discipline) BETWEEN 1 AND 100
        AND start_discipline !~ '[[:cntrl:]]'
      )
    );

COMMENT ON COLUMN public.user_dashboard_preferences.start_module IS
  'Módulo inicial após login: resumos ou legis';
COMMENT ON COLUMN public.user_dashboard_preferences.start_discipline IS
  'Disciplina inicial no PRO Resumos; NULL abre a visão geral';
