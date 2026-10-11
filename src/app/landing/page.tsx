import { LandingPageContent } from "@/components/landing/landing-page-content";
import { SITE_HOME_URL } from "@/lib/seo.mjs";

export const metadata = {
  title: { absolute: "PRO Concursos — Plataforma de estudos para concursos públicos" },
  description:
    "Resumos jurídicos estruturados, questões comentadas, legislação oficial e ferramentas de estudo em uma única assinatura mensal.",
  alternates: { canonical: SITE_HOME_URL },
};

/**
 * Landing pública do ecossistema PRO Concursos.
 * Acessível em /landing mesmo estando autenticado — sem redirect.
 */
export default function LandingPreviewPage() {
  return <LandingPageContent />;
}
