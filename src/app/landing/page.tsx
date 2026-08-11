import { LandingPageContent } from "@/components/landing/landing-page-content";

export const metadata = {
  title: "PRO Resumos — Preview da Página Inicial",
  // Evita que esta rota de preview seja indexada por buscadores
  robots: { index: false, follow: false },
};

/**
 * Rota de pré-visualização da landing page.
 * Acessível em /landing mesmo estando autenticado — sem redirect.
 */
export default function LandingPreviewPage() {
  return <LandingPageContent />;
}
