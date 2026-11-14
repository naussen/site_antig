import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBodyLimited, RequestBodyError } from "@/lib/request-body.mjs";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";
import { isValidIanaTimeZone } from "@/lib/gamification/calendar.mjs";
import { isGamificationOperationalEnabled } from "@/lib/gamification/config.mjs";
import { RoutineDomainError, buildStudyRecommendation } from "@/lib/gamification/session.mjs";
import type { RoutineSnapshot, RoutineTopicInput } from "@/lib/gamification/session.d.mts";
import {
  RoutineSchemaUnavailableError,
  createRoutineServiceForDevFallback,
  createRoutineServiceForSupabase,
  getApiContentAccess,
  hydrateRoutineTopicsByIds,
  isExplicitDevFallbackAllowed,
  loadActiveRoutineTopics,
  loadDashboardRoutineState,
  loadUserCompletedContentUnitIds,
  loadUserVisibleDisciplines,
  logRoutineServerError,
} from "@/lib/gamification/server";

const MAX_BODY_BYTES = 32 * 1024;
const BUDGET_SCHEMA = z.union([z.literal(5), z.literal(15), z.literal(30)]);

const savePreferencesSchema = z
  .object({
    action: z.literal("save_preferences"),
    targetDays: z.number().int().min(1).max(7).optional(),
    timezoneIana: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .refine((tz) => isValidIanaTimeZone(tz), {
        message: "Fuso horário IANA inválido.",
      })
      .optional(),
    defaultBudgetMinutes: BUDGET_SCHEMA.optional(),
    preferredDiscipline: z.string().trim().min(1).max(120).nullable().optional(),
    hideGamification: z.boolean().optional(),
  })
  .strict();

const startSessionSchema = z
  .object({
    action: z.literal("start_session"),
    budgetMinutes: BUDGET_SCHEMA.optional(),
    topicId: z.string().trim().min(1).max(200).nullable().optional(),
    sectionId: z.string().trim().min(1).max(200).nullable().optional(),
    contentUnitId: z.uuid().nullable().optional(),
    idempotencyKey: z.string().trim().min(1).max(128),
    replaceActive: z.boolean().optional(),
  })
  .strict();

const updateSessionStatusSchema = z
  .object({
    action: z.literal("update_session_status"),
    sessionId: z.uuid(),
    status: z.enum(["in_progress", "interrupted", "discarded"]),
  })
  .strict();

const replaceUnavailableActivitySchema = z
  .object({
    action: z.literal("replace_unavailable_activity"),
    sessionId: z.uuid(),
    activityId: z.uuid(),
  })
  .strict();

const completeSessionSchema = z
  .object({
    action: z.literal("complete_session"),
    sessionId: z.uuid(),
    completedActivityIds: z.array(z.uuid()).min(1).max(20),
    completionIdempotencyKey: z.string().trim().min(1).max(128),
  })
  .strict();

const postActionSchema = z.discriminatedUnion("action", [
  savePreferencesSchema,
  startSessionSchema,
  updateSessionStatusSchema,
  replaceUnavailableActivitySchema,
  completeSessionSchema,
]);

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function hydrateSnapshotForTopicTargets(input: {
  supabase: Parameters<typeof hydrateRoutineTopicsByIds>[0];
  topics: RoutineTopicInput[];
  snapshot: RoutineSnapshot;
  completedContentUnitIds: Set<string>;
  visibleDisciplines: string[] | null;
}) {
  const { supabase, topics, snapshot, completedContentUnitIds, visibleDisciplines } = input;
  const targetId = snapshot.recommendation?.primaryTarget?.topic_id;
  if (snapshot.activeSession || !targetId) {
    return snapshot;
  }

  const hydratedTopics = await hydrateRoutineTopicsByIds(supabase, topics, [targetId]);
  snapshot.recommendation = buildStudyRecommendation({
    topics: hydratedTopics,
    completedContentUnitIds,
    activeSession: null,
    preferredDiscipline: snapshot.preferences.preferred_discipline,
    visibleDisciplines,
    budgetMinutes: snapshot.preferences.default_budget_minutes,
  });
  return snapshot;
}

function handleActionError(error: unknown) {
  if (error instanceof RoutineSchemaUnavailableError) {
    return jsonNoStore(
      {
        error: "A rotina semanal ainda não está habilitada neste ambiente.",
        code: "SCHEMA_UNAVAILABLE",
        persistenceAvailable: false,
      },
      503,
    );
  }

  if (error instanceof RoutineDomainError) {
    return jsonNoStore(
      {
        error: error.message,
        code: error.code,
      },
      error.status,
    );
  }

  logRoutineServerError("Erro inesperado na rota /api/study-routine.", error, false);
  return jsonNoStore(
    {
      error: "Não foi possível processar a rotina semanal agora.",
      code: "INTERNAL_ERROR",
    },
    500,
  );
}

export async function GET() {
  if (!isGamificationOperationalEnabled()) {
    return jsonNoStore(
      {
        error: "Rotina semanal desabilitada por configuração operacional.",
        code: "GAMIFICATION_DISABLED",
        operationalEnabled: false,
      },
      503,
    );
  }

  const access = await getApiContentAccess();
  if (!access.ok) {
    return jsonNoStore({ error: access.error }, access.status);
  }

  try {
    const [topics, completedContentUnitIds, visibleDisciplines] = await Promise.all([
      loadActiveRoutineTopics(access.supabase),
      loadUserCompletedContentUnitIds(access.supabase, access.user.id),
      loadUserVisibleDisciplines(access.supabase, access.user.id),
    ]);

    const state = await loadDashboardRoutineState({
      supabase: access.supabase,
      userId: access.user.id,
      topics,
      completedContentUnitIds,
      visibleDisciplines,
    });

    return jsonNoStore({
      operationalEnabled: state.operationalEnabled,
      persistenceAvailable: state.persistenceAvailable,
      snapshot: state.snapshot,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonNoStore({ error: "Origem da requisição não autorizada." }, 403);
  }

  if (!isGamificationOperationalEnabled()) {
    return jsonNoStore(
      {
        error: "Rotina semanal temporariamente desabilitada por configuração operacional.",
        code: "GAMIFICATION_DISABLED",
      },
      503,
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await readJsonBodyLimited(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return jsonNoStore({ error: error.message }, error.status);
    }
    return jsonNoStore({ error: "Payload inválido." }, 400);
  }

  const parsed = postActionSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Dados da rotina inválidos.";
    return jsonNoStore({ error: firstIssue, code: "VALIDATION_ERROR" }, 400);
  }

  const access = await getApiContentAccess();
  if (!access.ok) {
    return jsonNoStore({ error: access.error }, access.status);
  }

  const input = parsed.data;

  const executeWithService = async (useDevFallback: boolean) => {
    const service = useDevFallback
      ? createRoutineServiceForDevFallback()
      : createRoutineServiceForSupabase(access.supabase);

    const [topics, completedContentUnitIds, visibleDisciplines] = await Promise.all([
      loadActiveRoutineTopics(access.supabase),
      loadUserCompletedContentUnitIds(access.supabase, access.user.id),
      loadUserVisibleDisciplines(access.supabase, access.user.id),
    ]);

    if (input.action === "save_preferences") {
      const validatedDiscipline = input.preferredDiscipline;
      if (typeof validatedDiscipline === "string") {
        const availableDisciplines = new Set(
          topics.map((topic) => topic.discipline || "Geral"),
        );
        if (!availableDisciplines.has(validatedDiscipline)) {
          return jsonNoStore(
            { error: "Disciplina preferida indisponível no acervo ativo." },
            400,
          );
        }
      }

      const result = await service.savePreferences({
        userId: access.user.id,
        targetDays: input.targetDays,
        timezoneIana: input.timezoneIana,
        defaultBudgetMinutes: input.defaultBudgetMinutes,
        preferredDiscipline: validatedDiscipline,
        hideGamification: input.hideGamification,
      });

      const snapshot = await service.getSnapshot({
        userId: access.user.id,
        topics,
        completedContentUnitIds,
        visibleDisciplines,
      });

      await hydrateSnapshotForTopicTargets({
        supabase: access.supabase,
        topics,
        snapshot,
        completedContentUnitIds,
        visibleDisciplines,
      });

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/configuracoes");

      return jsonNoStore({
        persistenceAvailable: true,
        updatePlan: result.updatePlan,
        snapshot,
      });
    }

    if (input.action === "start_session") {
      const targetTopicIds: string[] = [];
      if (input.contentUnitId) {
        const matchingTopic = topics.find((topic) =>
          (topic.sections ?? []).some((sec) => sec.content_unit_id === input.contentUnitId),
        );
        if (matchingTopic) targetTopicIds.push(matchingTopic.topic_id);
      } else if (input.topicId) {
        targetTopicIds.push(input.topicId);
      } else {
        const preliminarySnapshot = await service.getSnapshot({
          userId: access.user.id,
          topics,
          completedContentUnitIds,
          visibleDisciplines,
        });
        if (preliminarySnapshot.recommendation?.primaryTarget?.topic_id) {
          targetTopicIds.push(preliminarySnapshot.recommendation.primaryTarget.topic_id);
        }
      }

      const hydratedTopics = await hydrateRoutineTopicsByIds(
        access.supabase,
        topics,
        targetTopicIds,
      );

      const started = await service.startOrResumeSession({
        userId: access.user.id,
        topics: hydratedTopics,
        completedContentUnitIds,
        visibleDisciplines,
        budgetMinutes: input.budgetMinutes,
        topicId: input.topicId ?? null,
        sectionId: input.sectionId ?? null,
        contentUnitId: input.contentUnitId ?? null,
        idempotencyKey: input.idempotencyKey,
        replaceActive: Boolean(input.replaceActive),
      });

      const snapshot = await service.getSnapshot({
        userId: access.user.id,
        topics: hydratedTopics,
        completedContentUnitIds,
        visibleDisciplines,
      });

      revalidatePath("/dashboard");
      const startedTopicIds = new Set(
        started.session.activities
          .map((item) => item.topic_id)
          .filter((id): id is string => Boolean(id)),
      );
      for (const topicId of startedTopicIds) {
        revalidatePath(`/${topicId}`);
      }

      return jsonNoStore({
        persistenceAvailable: true,
        session: started.session,
        resumed: started.resumed,
        idempotent: started.idempotent,
        snapshot,
      });
    }

    if (input.action === "update_session_status") {
      const updatedSession = await service.updateSessionStatus({
        userId: access.user.id,
        sessionId: input.sessionId,
        status: input.status,
      });

      const snapshot = await service.getSnapshot({
        userId: access.user.id,
        topics,
        completedContentUnitIds,
        visibleDisciplines,
      });

      await hydrateSnapshotForTopicTargets({
        supabase: access.supabase,
        topics,
        snapshot,
        completedContentUnitIds,
        visibleDisciplines,
      });

      revalidatePath("/dashboard");
      for (const activity of updatedSession.activities) {
        if (activity.topic_id) {
          revalidatePath(`/${activity.topic_id}`);
        }
      }

      return jsonNoStore({
        persistenceAvailable: true,
        session: updatedSession,
        snapshot,
      });
    }

    if (input.action === "replace_unavailable_activity") {
      const preliminaryRecommendation = buildStudyRecommendation({
        topics,
        completedContentUnitIds,
        activeSession: null,
        visibleDisciplines,
      });
      const candidateTopicId = preliminaryRecommendation?.primaryTarget?.topic_id;
      const hydratedTopics = candidateTopicId
        ? await hydrateRoutineTopicsByIds(access.supabase, topics, [candidateTopicId])
        : topics;

      const updatedSession = await service.replaceUnavailableActivity({
        userId: access.user.id,
        sessionId: input.sessionId,
        activityId: input.activityId,
        topics: hydratedTopics,
        completedContentUnitIds,
        visibleDisciplines,
      });

      const snapshot = await service.getSnapshot({
        userId: access.user.id,
        topics: hydratedTopics,
        completedContentUnitIds,
        visibleDisciplines,
      });

      revalidatePath("/dashboard");

      return jsonNoStore({
        persistenceAvailable: true,
        session: updatedSession,
        snapshot,
      });
    }

    const completed = await service.completeSession({
      userId: access.user.id,
      sessionId: input.sessionId,
      completedActivityIds: input.completedActivityIds,
      completionIdempotencyKey: input.completionIdempotencyKey,
      topics,
    });

    const updatedCompletedIds = await loadUserCompletedContentUnitIds(
      access.supabase,
      access.user.id,
    );
    const snapshot = await service.getSnapshot({
      userId: access.user.id,
      topics,
      completedContentUnitIds: updatedCompletedIds,
      visibleDisciplines,
    });

    await hydrateSnapshotForTopicTargets({
      supabase: access.supabase,
      topics,
      snapshot,
      completedContentUnitIds: updatedCompletedIds,
      visibleDisciplines,
    });

    revalidatePath("/dashboard");
    for (const activity of completed.session.activities) {
      if (activity.topic_id) {
        revalidatePath(`/${activity.topic_id}`);
      }
    }

    return jsonNoStore({
      persistenceAvailable: true,
      session: completed.session,
      idempotent: completed.idempotent,
      weeklyProgress: completed.weeklyProgress,
      snapshot,
    });
  };

  try {
    return await executeWithService(false);
  } catch (error) {
    if (error instanceof RoutineSchemaUnavailableError && isExplicitDevFallbackAllowed()) {
      try {
        return await executeWithService(true);
      } catch (devError) {
        return handleActionError(devError);
      }
    }
    return handleActionError(error);
  }
}
