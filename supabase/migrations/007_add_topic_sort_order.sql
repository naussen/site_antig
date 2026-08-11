-- Preserva a ordem editorial originária dos módulos dentro de cada disciplina.
-- NULL mantém compatibilidade com tópicos antigos ou importados individualmente.
ALTER TABLE topics
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

COMMENT ON COLUMN topics.sort_order IS
  'Ordem editorial do módulo na disciplina, derivada do prefixo do arquivo no import-batch';

CREATE INDEX IF NOT EXISTS idx_topics_discipline_sort_order
  ON topics(discipline, sort_order);
