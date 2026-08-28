import { LandingPageContent } from "@/components/landing/landing-page-content";

export const metadata = {
  title: { absolute: "PRO Concursos — Plataforma de estudos para concursos públicos" },
  description:
    "Resumos jurídicos estruturados, legislação oficial, flashcards e ferramentas de estudo em uma única assinatura mensal.",
  alternates: { canonical: "https://proconcursos.com.br/" },
};

/**
 * Landing pública do ecossistema PRO Concursos.
 * Acessível em /landing mesmo estando autenticado — sem redirect.
 */
export default function LandingPreviewPage() {
  return <LandingPageContent />;
}
