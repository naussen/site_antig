-- Migration 043: Adição das disciplinas de Direito Penal Militar, Processual Penal Militar e tópicos canônicos da campanha 2026-10-30

INSERT INTO public.disciplines (slug, name, status)
VALUES
  ('direito-penal-militar', 'Direito Penal Militar', 'active'),
  ('direito-processual-penal-militar', 'Direito Processual Penal Militar', 'active')
ON CONFLICT (slug) DO UPDATE
SET status = 'active', name = EXCLUDED.name;

INSERT INTO public.topics (topic_id, title, discipline)
VALUES
  ('aritmetica-e-algebra', 'Aritmética e Álgebra', 'Matemática'),
  ('geometria-plana-e-espacial', 'Geometria Plana e Espacial', 'Matemática'),
  ('porcentagem-e-proporcionalidade', 'Porcentagem e Proporcionalidade', 'Matemática'),
  ('proposicoes-e-conectivos-logicos', 'Proposições e Conectivos Lógicos', 'Raciocínio Lógico'),
  ('estruturas-logicas-e-diagramas-logicos', 'Estruturas Lógicas e Diagramas Lógicos', 'Raciocínio Lógico'),
  ('tabelas-verdade-e-equivalencias-logicas', 'Tabelas-Verdade e Equivalências Lógicas', 'Raciocínio Lógico'),
  ('estatistica-descritiva', 'Estatística Descritiva', 'Estatística'),
  ('probabilidade-e-distribuicoes', 'Probabilidade e Distribuições', 'Estatística'),
  ('amostragem-e-inferencia-estatistica', 'Amostragem e Inferência Estatística', 'Estatística'),
  ('juros-simples-e-compostos', 'Juros Simples e Compostos', 'Matemática Financeira'),
  ('sistemas-de-amortizacao', 'Sistemas de Amortização', 'Matemática Financeira'),
  ('taxas-de-juros-e-inflacao', 'Taxas de Juros e Inflação', 'Matemática Financeira'),
  ('aplicacao-da-lei-penal-militar', 'Aplicação da Lei Penal Militar (CPM)', 'Direito Penal Militar'),
  ('crimes-militares-em-tempo-de-paz', 'Crimes Militares em Tempo de Paz', 'Direito Penal Militar'),
  ('crimes-contra-a-autoridade-ou-disciplina-militar', 'Crimes contra a Autoridade ou Disciplina Militar', 'Direito Penal Militar'),
  ('penas-e-medidas-de-seguranca-no-cpm', 'Penas e Medidas de Segurança no CPM', 'Direito Penal Militar'),
  ('processo-penal-militar-inquerito-policial-militar', 'Inquérito Policial Militar (IPM)', 'Direito Processual Penal Militar'),
  ('acao-penal-militar-e-processo-ordinario', 'Ação Penal Militar e Processo Ordinário', 'Direito Processual Penal Militar'),
  ('jurisdicao-e-competencia-da-justica-militar', 'Jurisdição e Competência da Justiça Militar', 'Direito Processual Penal Militar'),
  ('recursos-no-processo-penal-militar', 'Recursos no Processo Penal Militar (CPPM)', 'Direito Processual Penal Militar'),
  ('politicas-publicas-e-abastecimento-agricola-conab', 'Políticas Públicas e Abastecimento Agrícola (CONAB)', 'Administração Pública'),
  ('organizacao-e-legislacao-da-justica-militar-da-uniao', 'Organização e Legislação da Justiça Militar da União', 'Administração Pública'),
  ('regimento-interno-do-superior-tribunal-militar', 'Regimento Interno do Superior Tribunal Militar (STM)', 'Administração Pública')
ON CONFLICT (topic_id) DO NOTHING;

INSERT INTO public.topic_discipline_relations (topic_id, discipline_id, is_primary)
SELECT t.topic_id, d.id, true
FROM public.topics t
JOIN public.disciplines d ON d.name = t.discipline
WHERE t.topic_id IN (
  'aritmetica-e-algebra',
  'geometria-plana-e-espacial',
  'porcentagem-e-proporcionalidade',
  'proposicoes-e-conectivos-logicos',
  'estruturas-logicas-e-diagramas-logicos',
  'tabelas-verdade-e-equivalencias-logicas',
  'estatistica-descritiva',
  'probabilidade-e-distribuicoes',
  'amostragem-e-inferencia-estatistica',
  'juros-simples-e-compostos',
  'sistemas-de-amortizacao',
  'taxas-de-juros-e-inflacao',
  'aplicacao-da-lei-penal-militar',
  'crimes-militares-em-tempo-de-paz',
  'crimes-contra-a-autoridade-ou-disciplina-militar',
  'penas-e-medidas-de-seguranca-no-cpm',
  'processo-penal-militar-inquerito-policial-militar',
  'acao-penal-militar-e-processo-ordinario',
  'jurisdicao-e-competencia-da-justica-militar',
  'recursos-no-processo-penal-militar',
  'politicas-publicas-e-abastecimento-agricola-conab',
  'organizacao-e-legislacao-da-justica-militar-da-uniao',
  'regimento-interno-do-superior-tribunal-militar'
)
ON CONFLICT (topic_id, discipline_id) DO UPDATE
SET is_primary = EXCLUDED.is_primary;
