-- =============================================================================
-- Migration 005: Preferências de disciplinas visíveis no Dashboard
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  user_id             UUID PRIMARY KEY,
  visible_disciplines TEXT[] DEFAULT NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_dashboard_preferences IS 'Preferências pessoais de exibição do Dashboard';
COMMENT ON COLUMN user_dashboard_preferences.visible_disciplines IS 'NULL mostra todas; array restringe às disciplinas selecionadas';

ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_preferences_select_own"
  ON user_dashboard_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "dashboard_preferences_insert_own"
  ON user_dashboard_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dashboard_preferences_update_own"
  ON user_dashboard_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dashboard_preferences_delete_own"
  ON user_dashboard_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER trigger_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON user_dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
