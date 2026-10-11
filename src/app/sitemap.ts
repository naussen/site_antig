import type { MetadataRoute } from "next";
import {
  getPublicUrl,
  INDEXABLE_PUBLIC_PATHS,
  SITE_HOME_URL,
} from "@/lib/seo.mjs";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_HOME_URL,
    },
    ...INDEXABLE_PUBLIC_PATHS.map((path) => ({
      url: getPublicUrl(path),
    })),
  ];
}
