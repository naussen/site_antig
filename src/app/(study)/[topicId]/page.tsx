import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SectionRow, TopicRow } from "@/types/database";
import { StudyPageClient } from "./study-page-client";

interface TopicPageProps {
  params: Promise<{ topicId: string }>;
}

type AdjacentTopic = Pick<TopicRow, "topic_id" | "title">;

/**
 * Server Component: busca o tópico e suas seções do Supabase.
 * Passa os dados puros para o Client Component que monta a UI interativa.
 */
export default async function TopicPage({ params }: TopicPageProps) {
  const { topicId } = await params;

  let topic: TopicRow | null = null;
  let sections: SectionRow[] = [];
  let previousTopic: AdjacentTopic | null = null;
  let nextTopic: AdjacentTopic | null = null;

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

    const { data: disciplineTopics } = await supabase
      .from("topics")
      .select("topic_id,title,created_at")
      .eq("discipline", topicData.discipline)
      .order("created_at", { ascending: true })
      .order("topic_id", { ascending: true });

    if (disciplineTopics) {
      const currentTopicIndex = disciplineTopics.findIndex(
        (disciplineTopic) => disciplineTopic.topic_id === topicId
      );

      if (currentTopicIndex > 0) {
        previousTopic = disciplineTopics[currentTopicIndex - 1];
      }

      if (
        currentTopicIndex >= 0 &&
        currentTopicIndex < disciplineTopics.length - 1
      ) {
        nextTopic = disciplineTopics[currentTopicIndex + 1];
      }
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
      previousTopic={previousTopic}
      nextTopic={nextTopic}
    />
  );
}
