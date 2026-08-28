-- Normaliza topic_id fragmentados sem perder vínculos pessoais ou editoriais.
-- Os aliases antigos permanecem registrados para redirecionamento HTTP 308.

CREATE TABLE public.topic_id_redirects (
  old_topic_id TEXT PRIMARY KEY CHECK (old_topic_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  new_topic_id TEXT NOT NULL CHECK (new_topic_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (old_topic_id <> new_topic_id)
);

COMMENT ON TABLE public.topic_id_redirects IS
  'Aliases permanentes de topic_id antigos para URLs canônicas do PRO Resumos';

ALTER TABLE public.topic_id_redirects ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.topic_id_redirects FROM anon, authenticated;
GRANT SELECT ON TABLE public.topic_id_redirects TO authenticated;

CREATE POLICY topic_id_redirects_select_authenticated
  ON public.topic_id_redirects FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.topic_id_redirects (old_topic_id, new_topic_id) VALUES
  ('am-ost-rag-em', 'amostragem'),
  ('au-dit-oria-int-ern-a-n-b-c-ti-01', 'auditoria-auditoria-interna-nbc-ti-01'),
  ('co-n-co-rdan-cia-co-m-os-te-rm-os-n-b-c-ta-2-10', 'concordancia-com-os-termos-nbc-ta-210'),
  ('co-ntroles-inte-rn-os', 'controles-internos'),
  ('do-cum-ent-acao-de-au-di-to-ria-p-apei-s-de-t-rab-alho-n-b-c-t-a-230', 'documentacao-de-auditoria-papeis-de-trabalho-nbc-ta-230'),
  ('erro-e-frau-de-n-b-c-t-a-240-ti-01', 'erro-e-fraude-nbc-ta-240-nbc-ti-01'),
  ('esti-mat-ivas-co-nt-ab-eis-n-b-c-t-a-5-40', 'estimativas-contabeis-nbc-ta-540'),
  ('eve-ntos-sub-se-qu-ente-s-nb-c-t-a-56-0', 'eventos-subsequentes-nbc-ta-560'),
  ('evi-de-n-ci-as-de-au-dit-oria', 'evidencias-de-auditoria'),
  ('indep-en-den-ci-a', 'independencia'),
  ('mat-eriali-dade-e-re-lev-an-cia', 'materialidade-e-relevancia'),
  ('obje-tivo-s-ge-rais-do-au-dito-r-i-n-de-p-en-de-nte', 'objetivos-gerais-do-auditor-independente'),
  ('pe-ri-ci-a-co-ntabi-l-ap-en-as-it-ens-ge-rais', 'auditoria-pericia-contabil-apenas-itens-gerais'),
  ('plan-ejame-nto-da-au-dit-oria-nb-c-ta-300', 'auditoria-planejamento-da-auditoria-nbc-ta-300'),
  ('re-quisi-tos-p-ara-o-ex-erci-cio-da-au-ditoria-prin-ci-pios-eti-cos-1-integridade-honestidade', 'requisitos-para-o-exercicio-da-auditoria-principios-eticos'),
  ('res-pon-sabili-dade-do-au-dit-or-e-da-admi-nist-racao', 'responsabilidade-do-auditor-e-da-administracao'),
  ('ris-co-de-au-dito-ri-a', 'risco-de-auditoria'),
  ('sup-erv-isao-e-con-tro-le-de-qu-ali-dade-da-au-dito-ri-a-das-dcs', 'supervisao-e-controle-de-qualidade-da-auditoria-das-dcs'),
  ('te-cni-cas-p-ro-ce-dimen-tos-de-au-di-t-ori-a', 'tecnicas-e-procedimentos-de-auditoria'),
  ('test-es-e-m-are-as-e-spe-ci-fi-cas', 'testes-em-areas-especificas'),
  ('trans-acao-co-m-p-art-es-re-lacio-nadas-n-b-c-t-a-5-50', 'transacoes-com-partes-relacionadas-nbc-ta-550'),
  ('cu-stei-o-a-bc-a-cti-vi-ty-ba-sed-co-sti-n-g', 'custeio-abc-activity-based-costing'),
  ('cu-stei-o-di-r-eto-ou-va-r-i-av-el', 'custeio-direto-ou-variavel'),
  ('cu-stei-o-p-o-r-a-bso-r-ca-o', 'custeio-por-absorcao'),
  ('cu-sto-p-a-d-ra-o', 'custo-padrao'),
  ('d-ef-in-i-co-es-e-ti-p-o-s-d-e-g-a-sto-s', 'definicoes-e-tipos-de-gastos'),
  ('d-ep-a-r-ta-m-en-ta-li-za-ca-o', 'departamentalizacao'),
  ('mar-g-em-d-e-co-n-tri-bu-i-cao', 'margem-de-contribuicao'),
  ('p-o-n-to-d-e-eq-ui-l-i-bri-o', 'ponto-de-equilibrio'),
  ('p-r-o-du-ca-o-co-n-ju-n-ta', 'producao-conjunta');

CREATE TEMP TABLE section_id_corrections ON COMMIT DROP AS
SELECT
  section.section_id AS old_section_id,
  redirect.new_topic_id
    || substring(section.section_id FROM char_length(redirect.old_topic_id) + 1)
    AS new_section_id,
  redirect.old_topic_id,
  redirect.new_topic_id
FROM public.sections AS section
JOIN public.topic_id_redirects AS redirect
  ON redirect.old_topic_id = section.topic_id;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.topic_id_redirects) <> 30 THEN
    RAISE EXCEPTION 'Mapa de correção deve conter exatamente 30 topic_id';
  END IF;

  IF (
    SELECT count(*)
    FROM public.topics AS topic
    JOIN public.topic_id_redirects AS redirect
      ON redirect.old_topic_id = topic.topic_id
  ) <> 30 THEN
    RAISE EXCEPTION 'Nem todos os 30 topic_id antigos foram encontrados';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.topic_id_redirects
    GROUP BY new_topic_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Mapa de correção contém topic_id de destino duplicado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.topics AS topic
    JOIN public.topic_id_redirects AS redirect
      ON redirect.new_topic_id = topic.topic_id
  ) THEN
    RAISE EXCEPTION 'Um topic_id de destino já existe';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM section_id_corrections AS correction
    JOIN public.sections AS section
      ON section.section_id = correction.new_section_id
  ) THEN
    RAISE EXCEPTION 'Um section_id de destino já existe';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM section_id_corrections
    WHERE old_section_id !~ ('^' || old_topic_id || '-sec-[0-9]{2,}$')
  ) THEN
    RAISE EXCEPTION 'Há section_id fora do prefixo canônico esperado';
  END IF;

  IF (SELECT count(*) FROM section_id_corrections) <> 89 THEN
    RAISE EXCEPTION 'A correção deve alcançar exatamente 89 section_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint AS constraint_row
    WHERE constraint_row.contype = 'f'
      AND constraint_row.confrelid IN (
        'public.topics'::regclass,
        'public.sections'::regclass
      )
      AND constraint_row.conrelid NOT IN (
        'public.sections'::regclass,
        'public.user_progress'::regclass,
        'public.user_notes'::regclass,
        'public.user_text_highlights'::regclass,
        'public.topic_legal_fragment_relations'::regclass
      )
  ) THEN
    RAISE EXCEPTION 'Há uma FK não mapeada apontando para topics ou sections';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.topic_legal_fragment_relations AS relation
    JOIN public.topic_id_redirects AS redirect
      ON redirect.old_topic_id = relation.topic_id
    LEFT JOIN section_id_corrections AS correction
      ON correction.old_section_id = relation.section_id
    WHERE relation.section_id IS NOT NULL
      AND correction.old_section_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Há relação editorial com section_id fora do mapa';
  END IF;
END;
$$;

INSERT INTO public.topics (topic_id, title, created_at, discipline, sort_order)
SELECT
  redirect.new_topic_id,
  topic.title,
  topic.created_at,
  topic.discipline,
  topic.sort_order
FROM public.topics AS topic
JOIN public.topic_id_redirects AS redirect
  ON redirect.old_topic_id = topic.topic_id;

INSERT INTO public.sections (
  section_id,
  topic_id,
  title,
  content_markdown,
  callouts,
  mnemonics,
  flashcards,
  mermaid_mindmap,
  sort_order,
  created_at
)
SELECT
  correction.new_section_id,
  correction.new_topic_id,
  section.title,
  section.content_markdown,
  section.callouts,
  section.mnemonics,
  section.flashcards,
  section.mermaid_mindmap,
  section.sort_order,
  section.created_at
FROM public.sections AS section
JOIN section_id_corrections AS correction
  ON correction.old_section_id = section.section_id;

-- A troca técnica do identificador não representa edição do dado do usuário.
ALTER TABLE public.user_progress DISABLE TRIGGER trigger_user_progress_updated_at;
ALTER TABLE public.user_notes DISABLE TRIGGER trigger_user_notes_updated_at;
ALTER TABLE public.user_text_highlights DISABLE TRIGGER trigger_user_text_highlights_updated_at;

UPDATE public.user_progress AS progress
SET section_id = correction.new_section_id
FROM section_id_corrections AS correction
WHERE progress.section_id = correction.old_section_id;

UPDATE public.user_notes AS note
SET section_id = correction.new_section_id
FROM section_id_corrections AS correction
WHERE note.section_id = correction.old_section_id;

UPDATE public.user_text_highlights AS highlight
SET section_id = correction.new_section_id
FROM section_id_corrections AS correction
WHERE highlight.section_id = correction.old_section_id;

UPDATE public.topic_legal_fragment_relations AS relation
SET
  topic_id = redirect.new_topic_id,
  section_id = correction.new_section_id
FROM public.topic_id_redirects AS redirect, section_id_corrections AS correction
WHERE relation.topic_id = redirect.old_topic_id
  AND relation.section_id = correction.old_section_id
  AND correction.old_topic_id = redirect.old_topic_id;

UPDATE public.topic_legal_fragment_relations AS relation
SET topic_id = redirect.new_topic_id
FROM public.topic_id_redirects AS redirect
WHERE relation.topic_id = redirect.old_topic_id
  AND relation.section_id IS NULL;

ALTER TABLE public.user_progress ENABLE TRIGGER trigger_user_progress_updated_at;
ALTER TABLE public.user_notes ENABLE TRIGGER trigger_user_notes_updated_at;
ALTER TABLE public.user_text_highlights ENABLE TRIGGER trigger_user_text_highlights_updated_at;

DELETE FROM public.topics AS topic
USING public.topic_id_redirects AS redirect
WHERE topic.topic_id = redirect.old_topic_id;

ALTER TABLE public.topic_id_redirects
  ADD CONSTRAINT topic_id_redirects_new_topic_id_fkey
  FOREIGN KEY (new_topic_id)
  REFERENCES public.topics(topic_id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

CREATE INDEX idx_topic_id_redirects_new_topic_id
  ON public.topic_id_redirects(new_topic_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.topics AS topic
    JOIN public.topic_id_redirects AS redirect
      ON redirect.old_topic_id = topic.topic_id
  ) THEN
    RAISE EXCEPTION 'A correção deixou topic_id antigo em topics';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.topic_id_redirects AS redirect
    LEFT JOIN public.topics AS topic
      ON topic.topic_id = redirect.new_topic_id
    WHERE topic.topic_id IS NULL
  ) THEN
    RAISE EXCEPTION 'A correção não criou todos os topic_id de destino';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM section_id_corrections AS correction
    LEFT JOIN public.sections AS section
      ON section.section_id = correction.new_section_id
      AND section.topic_id = correction.new_topic_id
    WHERE section.section_id IS NULL
  ) THEN
    RAISE EXCEPTION 'A correção não criou todos os section_id de destino';
  END IF;
END;
$$;
