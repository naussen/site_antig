import type { MetadataRoute } from "next";
import { SITE_HOME_URL } from "@/lib/seo.mjs";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/resumos/api",
        "/resumos/auth",
        "/resumos/dashboard",
      ],
    },
    sitemap: `${SITE_HOME_URL}sitemap.xml`,
  };
}
