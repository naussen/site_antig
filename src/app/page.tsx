import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageContent } from "@/components/landing/landing-page-content";

export const metadata = {
  title: "PRO Resumos — Plataforma de Estudos para Concursos Públicos",
  description:
    "Resumos jurídicos estruturados, legislação oficial, flashcards e ferramentas de estudo em uma única assinatura mensal.",
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
