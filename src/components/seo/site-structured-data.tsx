import { serializeJsonLd } from "@/lib/json-ld.mjs";
import {
  BRAND_LOGO_URL,
  SITE_HOME_URL,
  SITE_NAME,
} from "@/lib/seo.mjs";

const SITE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_HOME_URL}#organization`,
      name: SITE_NAME,
      alternateName: "PRO Resumos",
      url: SITE_HOME_URL,
      logo: BRAND_LOGO_URL,
      description:
        "Plataforma digital de estudos e revisão para concursos públicos.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_HOME_URL}#website`,
      url: SITE_HOME_URL,
      name: SITE_NAME,
      alternateName: "PRO Resumos",
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_HOME_URL}#organization` },
    },
  ],
};

export function SiteStructuredData() {
  return (
    <script type="application/ld+json">
      {serializeJsonLd(SITE_STRUCTURED_DATA)}
    </script>
  );
}
