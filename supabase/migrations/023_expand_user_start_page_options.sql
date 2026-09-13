-- Limita a página inicial às quatro áreas principais do produto.
ALTER TABLE public.user_dashboard_preferences
  DROP CONSTRAINT IF EXISTS user_dashboard_preferences_start_module_check,
  ADD CONSTRAINT user_dashboard_preferences_start_module_check
    CHECK (start_module IN ('resumos', 'legis', 'notas', 'configuracoes'));

COMMENT ON COLUMN public.user_dashboard_preferences.start_module IS
  'Página inicial após login: resumos, legis, notas ou configuracoes';
