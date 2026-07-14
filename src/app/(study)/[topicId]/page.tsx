import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SectionRow, TopicRow } from "@/types/database";
import { StudyPageClient } from "./study-page-client";

interface TopicPageProps {
  params: Promise<{ topicId: string }>;
}

/**
 * Server Component: busca o tópico e suas seções do Supabase.
 * Passa os dados puros para o Client Component que monta a UI interativa.
 */
export default async function TopicPage({ params }: TopicPageProps) {
  const { topicId } = await params;

  let topic: TopicRow | null = null;
  let sections: SectionRow[] = [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  try {

    const { data: topicData } = await supabase
      .from("topics")
      .select("*")
      .eq("topic_id", topicId)
      .single();

    if (!topicData) {
      notFound();
    }

    topic = topicData;

    const { data: sectionsData } = await supabase
      .from("sections")
      .select("*")
      .eq("topic_id", topicId)
      .order("sort_order", { ascending: true });

    if (sectionsData) {
      sections = sectionsData;
    }
  } catch {
    notFound();
  }

  if (!topic) {
    notFound();
  }

  return (
    <StudyPageClient
      topic={topic}
      sections={sections}
      userId={userId}
    />
  );
}
