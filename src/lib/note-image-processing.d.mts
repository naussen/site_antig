export class NoteImageValidationError extends Error {}
export function processNoteImage(bytes: Uint8Array, declaredType: string | null): Promise<Buffer>;
