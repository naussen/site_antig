import { withSiteBasePath } from "./site-paths.mjs";

export const SITE_ORIGIN = "https://proconcursos.com.br";
export const SITE_HOME_URL = `${SITE_ORIGIN}/`;
export const SITE_NAME = "PRO Concursos";

export const INDEXABLE_PUBLIC_PATHS = [
  "/sobre",
  "/metodologia-editorial",
  "/politica-de-ia",
  "/correcoes",
  "/guias",
  "/termos",
  "/privacidade",
  "/suporte",
  "/contato",
];

export function getPublicUrl(path) {
  if (path === "/") return SITE_HOME_URL;

  return new URL(withSiteBasePath(path), SITE_ORIGIN).toString();
}

export const BRAND_LOGO_URL = getPublicUrl(
  "/brand/pro-concursos-logo-dark.png",
);
export const SOCIAL_IMAGE_URL = getPublicUrl(
  "/brand/pro-concursos-social.png",
);

export function createPublicPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}) {
  const url = getPublicUrl(path);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: "PRO Concursos — estudo integrado para concursos públicos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE_URL],
    },
  };
}
