-- =============================================================================
-- Migration 006: Fortalecer isolamento de dados pessoais por usuário
--
-- Objetivos:
-- 1. Adicionar FOREIGN KEY user_id → auth.users(id) nas tabelas pessoais,
--    garantindo que registros pessoais nunca existam sem dono válido no Auth.
--    ON DELETE CASCADE: ao remover conta, todos os dados pessoais são apagados.
-- 2. Adicionar índice composto em user_progress(user_id, section_id) para
--    cobrir o padrão de query: .eq("user_id").in("section_id").
-- 3. Adicionar índice em topics(discipline) para agrupamento eficiente
--    no dashboard.
--
-- ATENÇÃO antes de aplicar:
-- Verificar se há registros com user_id sem correspondência em auth.users:
--   SELECT user_id FROM user_notes
--     WHERE user_id NOT IN (SELECT id FROM auth.users);
--   SELECT user_id FROM user_progress
--     WHERE user_id NOT IN (SELECT id FROM auth.users);
--   SELECT user_id FROM user_dashboard_preferences
--     WHERE user_id NOT IN (SELECT id FROM auth.users);
-- Se houver registros órfãos, removê-los antes de aplicar esta migration.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FK: user_notes → auth.users
-- -----------------------------------------------------------------------------
ALTER TABLE user_notes
  ADD CONSTRAINT fk_user_notes_auth_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 2. FK: user_progress → auth.users
-- -----------------------------------------------------------------------------
ALTER TABLE user_progress
  ADD CONSTRAINT fk_user_progress_auth_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 3. FK: user_dashboard_preferences → auth.users
-- -----------------------------------------------------------------------------
ALTER TABLE user_dashboard_preferences
  ADD CONSTRAINT fk_user_dashboard_preferences_auth_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 4. Índice composto em user_progress para query padrão do hook de progresso
--    (já cobre: .eq("user_id", id).in("section_id", ids))
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_progress_user_section
  ON user_progress(user_id, section_id);

-- -----------------------------------------------------------------------------
-- 5. Índice em topics(discipline) para agrupamento no dashboard
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_topics_discipline
  ON topics(discipline);

-- -----------------------------------------------------------------------------
-- Comentários de documentação
-- -----------------------------------------------------------------------------
COMMENT ON CONSTRAINT fk_user_notes_auth_user ON user_notes
  IS 'Garante que toda nota pertence a um usuário válido no Supabase Auth. Cascade apaga notas ao deletar conta.';

COMMENT ON CONSTRAINT fk_user_progress_auth_user ON user_progress
  IS 'Garante que todo progresso pertence a um usuário válido no Supabase Auth. Cascade apaga progresso ao deletar conta.';

COMMENT ON CONSTRAINT fk_user_dashboard_preferences_auth_user ON user_dashboard_preferences
  IS 'Garante que toda preferência pertence a um usuário válido no Supabase Auth. Cascade apaga preferências ao deletar conta.';
