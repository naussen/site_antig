export class RequestBodyError extends Error { status: number; }
export function readJsonBodyLimited(request: Request, maximumBytes: number): Promise<unknown>;
