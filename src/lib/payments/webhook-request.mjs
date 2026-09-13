import { readJsonBodyLimited } from "../request-body.mjs";

export { RequestBodyError } from "../request-body.mjs";

export const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;

/** @param {Request} request */
export function readWebhookJson(request) {
  return readJsonBodyLimited(request, MAX_WEBHOOK_BODY_BYTES);
}
