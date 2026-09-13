export { RequestBodyError } from "../request-body.mjs";
export const MAX_WEBHOOK_BODY_BYTES: number;
export function readWebhookJson(request: Request): Promise<unknown>;
