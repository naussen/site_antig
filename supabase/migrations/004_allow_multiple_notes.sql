-- =============================================================================
-- Migration 004: Allow Multiple Notes per Section
-- =============================================================================

-- Remover a chave primária composta antiga
ALTER TABLE user_notes DROP CONSTRAINT IF EXISTS user_notes_pkey;

-- Adicionar nova coluna de ID único como chave primária
ALTER TABLE user_notes ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Criar índice para otimização das consultas por usuário e seção
CREATE INDEX IF NOT EXISTS idx_notes_user_section ON user_notes(user_id, section_id);
