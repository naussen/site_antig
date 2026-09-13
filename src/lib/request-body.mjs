export class RequestBodyError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "RequestBodyError";
    this.status = status;
  }
}

/** @param {Request} request */
export async function readBodyLimited(request, maximumBytes) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new RequestBodyError("Payload excede o limite permitido.", 413);
  }
  if (!request.body) throw new RequestBodyError("Payload ausente.", 400);

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyError("Payload excede o limite permitido.", 413);
    }
    chunks.push(value);
  }

  if (total === 0) throw new RequestBodyError("Payload ausente.", 400);

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

/** @param {Request} request */
export async function readJsonBodyLimited(request, maximumBytes) {
  const mediaType = request.headers.get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    throw new RequestBodyError("Content-Type deve ser application/json.", 415);
  }
  let bytes;
  try {
    bytes = await readBodyLimited(request, maximumBytes);
  } catch (error) {
    if (error instanceof RequestBodyError && error.status === 400) {
      throw new RequestBodyError("Payload JSON ausente.", 400);
    }
    throw error;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new RequestBodyError("Payload JSON inválido.", 400);
  }
}
