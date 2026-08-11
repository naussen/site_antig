import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageContent } from "@/components/landing/landing-page-content";

export const metadata = {
  title: "PRO Resumos — Plataforma de Estudos para Concursos Públicos",
  description:
    "Mnemônicos, flashcards 3D, mapas mentais e resumos jurídicos estruturados. A plataforma mais completa para sua aprovação em concursos públicos.",
  keywords: [
    "concurso público",
    "direito",
    "estudo",
    "flashcards",
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
