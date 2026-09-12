-- SEG-05: imagens privadas e limites defensivos para anotações.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-images',
  'note-images',
  false,
  2097152,
  ARRAY['image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.user_note_images (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_note_images_path_matches_owner CHECK (
    storage_path = user_id::text || '/' || id::text || '.webp'
  )
);

ALTER TABLE public.user_note_images ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_note_images FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_note_images TO authenticated;

DROP POLICY IF EXISTS note_images_metadata_select_own ON public.user_note_images;
CREATE POLICY note_images_metadata_select_own
  ON public.user_note_images FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.reserve_user_note_image(p_image_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  reserved_path TEXT;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  IF (SELECT count(*) FROM public.user_note_images WHERE user_id = current_user_id) >= 500 THEN
    RAISE EXCEPTION 'note image limit reached';
  END IF;

  reserved_path := current_user_id::text || '/' || p_image_id::text || '.webp';
  INSERT INTO public.user_note_images (id, user_id, storage_path)
  VALUES (p_image_id, current_user_id, reserved_path);
  RETURN reserved_path;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_user_note_image(p_image_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  DELETE FROM public.user_note_images
  WHERE id = p_image_id AND user_id = auth.uid();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_user_note_image(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_user_note_image(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_user_note_image(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_user_note_image(UUID) TO authenticated;

DROP POLICY IF EXISTS note_images_storage_select_own ON storage.objects;
CREATE POLICY note_images_storage_select_own
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS note_images_storage_insert_own ON storage.objects;
CREATE POLICY note_images_storage_insert_own
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1
      FROM public.user_note_images AS image
      WHERE image.user_id = (SELECT auth.uid())
        AND image.storage_path = name
    )
  );

DROP POLICY IF EXISTS note_images_storage_delete_own ON storage.objects;
CREATE POLICY note_images_storage_delete_own
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

ALTER TABLE public.user_notes
  DROP CONSTRAINT IF EXISTS user_notes_content_length;
ALTER TABLE public.user_notes
  ADD CONSTRAINT user_notes_content_length
  CHECK (char_length(btrim(content)) BETWEEN 1 AND 12000) NOT VALID;

ALTER TABLE public.user_notes
  DROP CONSTRAINT IF EXISTS user_notes_image_reference_limit;
ALTER TABLE public.user_notes
  ADD CONSTRAINT user_notes_image_reference_limit
  CHECK (
    regexp_count(
      content,
      '/resumos/api/note-images/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',
      1,
      'i'
    ) <= 5
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.enforce_user_note_count_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 1));
  IF (SELECT count(*) FROM public.user_notes WHERE user_id = NEW.user_id) >= 500 THEN
    RAISE EXCEPTION 'note count limit reached';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_user_note_count_limit ON public.user_notes;
CREATE TRIGGER trigger_user_note_count_limit
  BEFORE INSERT ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_note_count_limit();

REVOKE ALL ON FUNCTION public.enforce_user_note_count_limit() FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.user_note_images IS
  'Reserva imagens privadas de notas por usuário; o arquivo correspondente fica no bucket note-images.';
COMMENT ON CONSTRAINT user_notes_content_length ON public.user_notes IS
  'Limita novas notas e atualizações a 12 mil caracteres; NOT VALID preserva dados legados até inventário.';
COMMENT ON CONSTRAINT user_notes_image_reference_limit ON public.user_notes IS
  'Limita novas notas e atualizações a cinco referências internas de imagem.';
