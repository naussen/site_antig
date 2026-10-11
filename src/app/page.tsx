import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageContent } from "@/components/landing/landing-page-content";
import { createPublicPageMetadata } from "@/lib/seo.mjs";

const HOME_TITLE = "PRO Concursos — Plataforma de estudos para concursos públicos";
const HOME_DESCRIPTION =
  "Resumos jurídicos estruturados, questões comentadas, legislação oficial e ferramentas de estudo em uma única assinatura mensal.";

export const metadata = {
  ...createPublicPageMetadata({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
    absoluteTitle: true,
  }),
  keywords: [
    "concurso público",
    "direito",
    "estudo",
    "flashcards",
    "questões comentadas",
    "mnemônicos",
    "resumo jurídico",
    "aprovação",
    "mapas mentais",
  ],
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPageContent />;
}
