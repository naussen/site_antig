import type { NextConfig } from "next";
import { SITE_BASE_PATH } from "./src/lib/site-paths.mjs";

const nextConfig: NextConfig = {
  basePath: SITE_BASE_PATH,
};

export default nextConfig;
