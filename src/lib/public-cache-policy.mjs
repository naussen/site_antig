export const PUBLIC_CDN_CACHE_CONTROL =
  "public, durable, s-maxage=300, stale-while-revalidate=3600";
export const PUBLIC_BROWSER_CACHE_CONTROL =
  "public, max-age=0, must-revalidate";

export function applyPublicCachePolicy(headers) {
  headers.set("Cache-Control", PUBLIC_BROWSER_CACHE_CONTROL);
  headers.set("Netlify-CDN-Cache-Control", PUBLIC_CDN_CACHE_CONTROL);
}
