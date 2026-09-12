import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/lib/security-headers.mjs";
import { SITE_BASE_PATH } from "./src/lib/site-paths.mjs";
import { TOPIC_ID_REDIRECTS } from "./src/lib/content/topic-id.mjs";

const nextConfig: NextConfig = {
  basePath: SITE_BASE_PATH,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  async redirects() {
    return TOPIC_ID_REDIRECTS.map(({ oldTopicId, newTopicId }) => ({
      source: `/${oldTopicId}`,
      destination: `/${newTopicId}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
