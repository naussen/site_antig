-- =============================================================================
-- Migration 003: Add Discipline to Topics
-- =============================================================================

ALTER TABLE topics 
ADD COLUMN IF NOT EXISTS discipline TEXT NOT NULL DEFAULT 'Geral';

COMMENT ON COLUMN topics.discipline IS 'Disciplina a qual este tópico pertence';
