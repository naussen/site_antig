import { notFound, permanentRedirect } from "next/navigation";
import type { SectionRow, TopicRow } from "@/types/database";
import { compareTopicsByOrigin } from "@/lib/topic-order";
import { requireContentAccess } from "@/lib/content-access";
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
  let redirectTopicId: string | null = null;

  const { supabase, user } = await requireContentAccess();

  const userId = user.id;

  try {
    const [topicResult, sectionsResult] = await Promise.all([
      supabase
        .from("topics")
        .select("topic_id,discipline,title,sort_order,created_at")
        .eq("topic_id", topicId)
        .maybeSingle(),
      supabase
        .from("sections")
        .select(
          "section_id,topic_id,title,content_markdown,callouts,mnemonics,flashcards,mermaid_mindmap,sort_order,created_at"
        )
        .eq("topic_id", topicId)
        .order("sort_order", { ascending: true }),
    ]);

    if (topicResult.error || sectionsResult.error) {
      throw topicResult.error ?? sectionsResult.error;
    }

    const topicData = topicResult.data;

    if (!topicData) {
      const { data: redirectData, error: redirectError } = await supabase
        .from("topic_id_redirects")
        .select("new_topic_id")
        .eq("old_topic_id", topicId)
        .maybeSingle();

      if (redirectError) throw redirectError;
      redirectTopicId = redirectData?.new_topic_id ?? null;
    } else {
      topic = topicData;

      if (sectionsResult.data) {
        sections = sectionsResult.data as SectionRow[];
      }

      const { data: disciplineTopics } = await supabase
        .from("topics")
        .select("topic_id,title,sort_order,created_at")
        .eq("discipline", topicData.discipline)
        .order("created_at", { ascending: true })
        .order("topic_id", { ascending: true });

      if (disciplineTopics) {
        const orderedTopics = [...disciplineTopics].sort((a, b) =>
          compareTopicsByOrigin(topicData.discipline, a, b)
        );
        const currentTopicIndex = orderedTopics.findIndex(
          (disciplineTopic) => disciplineTopic.topic_id === topicId
        );

        if (currentTopicIndex > 0) {
          previousTopic = orderedTopics[currentTopicIndex - 1];
        }

        if (
          currentTopicIndex >= 0 &&
          currentTopicIndex < orderedTopics.length - 1
        ) {
          nextTopic = orderedTopics[currentTopicIndex + 1];
        }
      }
    }
  } catch {
    notFound();
  }

  if (redirectTopicId) {
    permanentRedirect(`/${redirectTopicId}`);
  }

  if (!topic) {
    notFound();
  }

  return (
    <StudyPageClient
      topic={topic}
      sections={sections}
      userId={userId}
      userEmail={user.email ?? null}
      previousTopic={previousTopic}
      nextTopic={nextTopic}
    />
  );
}
