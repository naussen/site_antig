import { withSiteBasePath } from "./site-paths.mjs";

export const NOTE_IMAGE_BUCKET = "note-images";
export const MAX_NOTE_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_NOTE_IMAGE_OUTPUT_BYTES = 2 * 1024 * 1024;
export const MAX_NOTE_IMAGE_DIMENSION = 8_000;
export const MAX_NOTE_IMAGES_PER_NOTE = 5;
export const MAX_NOTE_LENGTH = 12_000;

const UUID_SOURCE = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const UUID_PATTERN = new RegExp(`^${UUID_SOURCE}$`, "i");
const STORED_IMAGE_PATTERN = new RegExp(
  `${withSiteBasePath("/api/note-images/").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(${UUID_SOURCE})(?=[)#?\\s\"']|$)`,
  "gi"
);

export const ALLOWED_NOTE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isValidNoteImageId(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function detectNoteImageType(bytes) {
  if (!(bytes instanceof Uint8Array)) return null;

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) return "image/webp";

  return null;
}

export function noteImageStoragePath(userId, imageId) {
  if (!isValidNoteImageId(userId) || !isValidNoteImageId(imageId)) {
    throw new TypeError("Identificador de imagem inválido.");
  }
  return `${userId}/${imageId}.webp`;
}

export function noteImageUrl(imageId) {
  if (!isValidNoteImageId(imageId)) throw new TypeError("Identificador de imagem inválido.");
  return withSiteBasePath(`/api/note-images/${imageId}`);
}

export function pendingNoteImageSource(imageId) {
  if (!isValidNoteImageId(imageId)) throw new TypeError("Identificador de imagem inválido.");
  return `note-image-pending:${imageId}`;
}

export function extractStoredNoteImageIds(content) {
  if (typeof content !== "string") return [];
  const ids = new Set();
  STORED_IMAGE_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(STORED_IMAGE_PATTERN)) ids.add(match[1].toLowerCase());
  return [...ids];
}
