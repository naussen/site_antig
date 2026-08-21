const SAFE_HOST = /^[a-z0-9.-]+(?::\d{1,5})?$/i;

/** @param {Request} request */
export function isSameOriginRequest(request) {
  if (request.headers.get("sec-fetch-site") !== "same-origin") return false;

  const originValue = request.headers.get("origin");
  if (!originValue) return false;

  let origin;
  try {
    origin = new URL(originValue);
  } catch {
    return false;
  }

  if (origin.protocol !== "https:" && origin.protocol !== "http:") return false;

  const forwardedHost = singleHeaderValue(request.headers.get("x-forwarded-host"));
  const requestHost = singleHeaderValue(request.headers.get("host"));
  const url = new URL(request.url);
  const expectedHost = forwardedHost ?? requestHost ?? url.host;
  if (!SAFE_HOST.test(expectedHost) || expectedHost.toLowerCase() !== origin.host.toLowerCase()) {
    return false;
  }

  const forwardedProtocol = singleHeaderValue(request.headers.get("x-forwarded-proto"));
  const expectedProtocol = forwardedProtocol ?? url.protocol.replace(":", "");
  return (expectedProtocol === "http" || expectedProtocol === "https")
    && expectedProtocol === origin.protocol.replace(":", "");
}

function singleHeaderValue(value) {
  if (!value || value.includes(",") || /[\s\\/]/.test(value)) return null;
  return value;
}
