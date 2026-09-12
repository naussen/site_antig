import sharp from "sharp";
import {
  ALLOWED_NOTE_IMAGE_TYPES,
  MAX_NOTE_IMAGE_DIMENSION,
  MAX_NOTE_IMAGE_OUTPUT_BYTES,
  detectNoteImageType,
} from "./note-images.mjs";

export class NoteImageValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "NoteImageValidationError";
  }
}

async function encodeWebp(bytes, width, quality) {
  return sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

export async function processNoteImage(bytes, declaredType) {
  const normalizedType = declaredType?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_NOTE_IMAGE_TYPES.has(normalizedType)) {
    throw new NoteImageValidationError("Formato de imagem não permitido.");
  }

  const detectedType = detectNoteImageType(bytes);
  if (!detectedType || detectedType !== normalizedType) {
    throw new NoteImageValidationError("O conteúdo do arquivo não corresponde ao formato declarado.");
  }

  let metadata;
  try {
    metadata = await sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new NoteImageValidationError("A imagem está inválida ou corrompida.");
  }

  if (
    !metadata.width || !metadata.height ||
    metadata.width > MAX_NOTE_IMAGE_DIMENSION || metadata.height > MAX_NOTE_IMAGE_DIMENSION ||
    metadata.pages && metadata.pages > 1
  ) {
    throw new NoteImageValidationError("As dimensões ou o número de quadros da imagem excedem o permitido.");
  }

  try {
    let output = await encodeWebp(bytes, 4_096, 82);
    if (output.byteLength > MAX_NOTE_IMAGE_OUTPUT_BYTES) {
      output = await encodeWebp(bytes, 2_560, 65);
    }
    if (output.byteLength > MAX_NOTE_IMAGE_OUTPUT_BYTES) {
      throw new NoteImageValidationError("A imagem processada excede o limite permitido.");
    }
    return output;
  } catch (error) {
    if (error instanceof NoteImageValidationError) throw error;
    throw new NoteImageValidationError("Não foi possível processar a imagem.");
  }
}
