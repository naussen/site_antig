-- Persiste o tema visual na conta do usuário.
ALTER TABLE public.user_dashboard_preferences
  ADD COLUMN theme TEXT NOT NULL DEFAULT 'light',
  ADD CONSTRAINT user_dashboard_preferences_theme_check
    CHECK (theme IN ('light', 'dark', 'sepia'));

COMMENT ON COLUMN public.user_dashboard_preferences.theme IS
  'Tema visual da conta: light, dark ou sepia';
