export const PUBLIC_CDN_CACHE_CONTROL =
  "public, durable, s-maxage=300, stale-while-revalidate=3600";

export function applyPublicCachePolicy(headers) {
  headers.set("CDN-Cache-Control", PUBLIC_CDN_CACHE_CONTROL);
}
