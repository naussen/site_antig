import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";
import {
  MAX_NOTE_IMAGE_BYTES,
  detectNoteImageType,
  extractStoredNoteImageIds,
  isValidNoteImageId,
  noteImageStoragePath,
  noteImageUrl,
} from "../src/lib/note-images.mjs";
import {
  NoteImageValidationError,
  processNoteImage,
} from "../src/lib/note-image-processing.mjs";
import { RequestBodyError, readBodyLimited } from "../src/lib/request-body.mjs";

const IMAGE_ID = "123e4567-e89b-42d3-a456-426614174000";
const USER_ID = "01890b2d-7558-4bfe-a866-03e29749e041";

test("reconhece apenas ids e URLs internas válidas", () => {
  assert.equal(isValidNoteImageId(IMAGE_ID), true);
  assert.equal(isValidNoteImageId("../segredo"), false);
  assert.equal(noteImageUrl(IMAGE_ID), `/resumos/api/note-images/${IMAGE_ID}`);
  assert.equal(noteImageStoragePath(USER_ID, IMAGE_ID), `${USER_ID}/${IMAGE_ID}.webp`);
  assert.deepEqual(
    extractStoredNoteImageIds(
      `![a](/resumos/api/note-images/${IMAGE_ID})\n![b](/resumos/api/note-images/${IMAGE_ID}?v=1)\n![x](https://evil.test/${IMAGE_ID})`
    ),
    [IMAGE_ID]
  );
});

test("detecta assinaturas PNG, JPEG e WebP e rejeita SVG", () => {
  assert.equal(detectNoteImageType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(detectNoteImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xdb])), "image/jpeg");
  assert.equal(detectNoteImageType(new TextEncoder().encode("RIFFxxxxWEBP")), "image/webp");
  assert.equal(detectNoteImageType(new TextEncoder().encode("<svg><script/></svg>")), null);
});

test("decodifica e recodifica imagem válida para WebP sem metadados", async () => {
  const source = await sharp({
    create: { width: 32, height: 24, channels: 4, background: "#663399" },
  }).png().withMetadata({ exif: { IFD0: { Artist: "dado-pessoal" } } }).toBuffer();

  const output = await processNoteImage(source, "image/png");
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 32);
  assert.equal(metadata.height, 24);
  assert.equal(metadata.exif, undefined);
});

test("rejeita MIME falso, SVG e dimensão excessiva", async () => {
  const png = await sharp({
    create: { width: 4, height: 4, channels: 3, background: "white" },
  }).png().toBuffer();
  await assert.rejects(() => processNoteImage(png, "image/jpeg"), NoteImageValidationError);
  await assert.rejects(
    () => processNoteImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>") , "image/svg+xml"),
    NoteImageValidationError
  );

  const tooWide = await sharp({
    create: { width: 8_001, height: 1, channels: 3, background: "white" },
  }).png().toBuffer();
  await assert.rejects(() => processNoteImage(tooWide, "image/png"), NoteImageValidationError);
});

test("leitor interrompe corpo acima do limite declarado ou efetivo", async () => {
  const declared = new Request("https://example.test/upload", {
    method: "POST",
    headers: { "Content-Length": String(MAX_NOTE_IMAGE_BYTES + 1) },
    body: new Uint8Array([1]),
  });
  await assert.rejects(
    () => readBodyLimited(declared, MAX_NOTE_IMAGE_BYTES),
    (error) => error instanceof RequestBodyError && error.status === 413
  );

  const streamed = new Request("https://example.test/upload", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(3));
        controller.enqueue(new Uint8Array(3));
        controller.close();
      },
    }),
    duplex: "half",
  });
  await assert.rejects(
    () => readBodyLimited(streamed, 5),
    (error) => error instanceof RequestBodyError && error.status === 413
  );
});

test("rota autentica antes de ler e não usa service role", async () => {
  const source = await readFile(new URL("../src/app/api/note-images/route.ts", import.meta.url), "utf8");
  assert.ok(source.indexOf("authorizeNoteImageRequest") < source.indexOf("readBodyLimited(request"));
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
  assert.match(source, /isSameOriginRequest/);
  assert.match(source, /processNoteImage/);
});

test("migration cria bucket privado, RLS e limites no banco", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/021_secure_note_images.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /'note-images'[\s\S]*false[\s\S]*ARRAY\['image\/webp'\]/);
  assert.match(migration, /ALTER TABLE public\.user_note_images ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /storage\.foldername\(name\)/);
  assert.match(migration, /reserve_user_note_image/);
  assert.match(migration, /char_length\(btrim\(content\)\) BETWEEN 1 AND 12000/);
  assert.match(migration, /regexp_count[\s\S]*<= 5/);
  assert.match(migration, />= 500/);
});

test("cliente não converte mais imagens em Base64", async () => {
  const panel = await readFile(new URL("../src/components/study/notes-panel.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(panel, /readAsDataURL|data:image|base64/i);
  assert.match(panel, /uploadNoteImage/);
  assert.match(panel, /MAX_NOTE_IMAGES_PER_NOTE/);
  assert.match(panel, /maxLength=\{MAX_NOTE_LENGTH\}/);
});
