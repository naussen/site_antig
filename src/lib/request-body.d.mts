export class RequestBodyError extends Error { status: number; }
export function readBodyLimited(request: Request, maximumBytes: number): Promise<Uint8Array>;
export function readJsonBodyLimited(request: Request, maximumBytes: number): Promise<unknown>;
