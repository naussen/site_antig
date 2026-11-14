import type {
  ActivityStatus,
  ActivityType,
  SelectionMode,
  SessionStatus,
} from "./config.d.mts";
import type {
  PlannedPreferenceUpdate,
  TimezoneChangePreview,
  WeeklyProgressSummary,
} from "./calendar.d.mts";

export class RoutineDomainError extends Error {
  status: number;
  code: string;
  constructor(message: string, status?: number, code?: string);
}

export interface ActiveTopicSectionCandidate {
  section_id: string;
  content_unit_id: string;
  topic_id: string;
  topic_title: string;
  discipline: string;
  title: string;
  sort_order: number;
  estimated_minutes: number;
}

export interface StudyRoutineActivityRecord {
  id: string;
  session_id: string;
  user_id: string;
  order_index: number;
  activity_type: ActivityType;
  status: ActivityStatus;
  topic_id: string | null;
  topic_title: string;
  discipline: string;
  section_id: string | null;
  content_unit_id: string | null;
  activity_title: string;
  estimated_minutes: number;
  evidence_kind: "self_declared" | "server_verified";
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudyRoutineSessionRecord {
  id: string;
  user_id: string;
  weekly_plan_id: string;
  status: SessionStatus;
  budget_minutes: 5 | 15 | 30;
  estimated_minutes: number;
  selection_mode: SelectionMode;
  idempotency_key: string;
  completion_idempotency_key: string | null;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  completed_local_date: string | null;
  completed_week_start_date: string | null;
  completed_timezone_iana: string | null;
  activities: StudyRoutineActivityRecord[];
}

export interface StudyRoutinePreferencesRecord {
  user_id: string;
  target_days: number;
  timezone_iana: string;
  default_budget_minutes: 5 | 15 | 30;
  preferred_discipline: string | null;
  hide_gamification: boolean;
  pending_target_days: number | null;
  pending_timezone_iana: string | null;
  pending_effective_week_start: string | null;
  onboarding_completed_at: string | null;
}

export interface StudyRoutineWeeklyPlanRecord {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  target_days: number;
  timezone_iana: string;
  is_partial_first_week: boolean;
}

export interface StudyRecommendation {
  kind: "start" | "resume";
  sessionId: string | null;
  sessionStatus: SessionStatus | null;
  budgetMinutes: number;
  estimatedMinutes: number;
  hasUnavailableContent: boolean;
  unavailableActivityIds: string[];
  replacementCandidate: ActiveTopicSectionCandidate | null;
  primaryTarget: ActiveTopicSectionCandidate | null;
  plannedActivities: Array<ActiveTopicSectionCandidate | StudyRoutineActivityRecord>;
  isReview: boolean;
}

export interface RoutineSnapshot {
  needsOnboarding: boolean;
  preferences: StudyRoutinePreferencesRecord;
  currentPlan: StudyRoutineWeeklyPlanRecord | null;
  weeklyProgress: WeeklyProgressSummary;
  activeSession: StudyRoutineSessionRecord | null;
  recentSessions: StudyRoutineSessionRecord[];
  recommendation: StudyRecommendation | null;
  timezonePreviewNow: TimezoneChangePreview;
  moduleAvailability: {
    summaries: boolean;
    laws: boolean;
    questions: boolean;
    flashcards: boolean;
  };
  accountOwnershipNotice: string;
}

export interface RoutineTopicInput {
  topic_id: string;
  title: string;
  discipline?: string | null;
  archived_at?: string | null;
  sections?: Array<{
    section_id: string;
    content_unit_id: string;
    title: string;
    content_markdown?: string | null;
    callouts?: unknown[] | null;
    mnemonics?: unknown[] | null;
    flashcards?: unknown[] | null;
    mermaid_mindmap?: string | null;
    sort_order?: number | null;
    archived_at?: string | null;
  }>;
}

export interface RoutineRepository {
  getPreferences(userId: string): Promise<StudyRoutinePreferencesRecord | null>;
  upsertPreferences(
    userId: string,
    record: Record<string, unknown>,
  ): Promise<StudyRoutinePreferencesRecord>;
  listWeeklyPlans(userId: string): Promise<StudyRoutineWeeklyPlanRecord[]>;
  createWeeklyPlan(
    userId: string,
    plan: Record<string, unknown>,
  ): Promise<StudyRoutineWeeklyPlanRecord>;
  listSessionsForWeek(
    userId: string,
    weekStartDate: string,
    weekEndDate: string,
  ): Promise<StudyRoutineSessionRecord[]>;
  listRecentSessions(userId: string, limit: number): Promise<StudyRoutineSessionRecord[]>;
  findActiveSession(userId: string): Promise<StudyRoutineSessionRecord | null>;
  findSessionByIdempotencyKey(
    userId: string,
    key: string,
  ): Promise<StudyRoutineSessionRecord | null>;
  findSessionByCompletionKey(
    userId: string,
    key: string,
  ): Promise<StudyRoutineSessionRecord | null>;
  getSessionById(userId: string, sessionId: string): Promise<StudyRoutineSessionRecord | null>;
  createSessionWithActivities(
    userId: string,
    session: Record<string, unknown>,
    activities: Array<Record<string, unknown>>,
  ): Promise<StudyRoutineSessionRecord>;
  updateSession(
    userId: string,
    sessionId: string,
    patch: Record<string, unknown>,
  ): Promise<StudyRoutineSessionRecord>;
  updateSessionActivity(
    userId: string,
    sessionId: string,
    activityId: string,
    patch: Record<string, unknown>,
  ): Promise<StudyRoutineActivityRecord>;
  completeSessionAtomically(input: {
    userId: string;
    sessionId: string;
    weeklyPlanId: string | null;
    completedActivityIds: string[];
    completionIdempotencyKey: string;
    completedAt: string;
    completedLocalDate: string;
    completedWeekStartDate: string;
    completedTimezoneIana: string;
  }): Promise<StudyRoutineSessionRecord>;
  markLegacyProgressCompleted(
    userId: string,
    items: Array<{ section_id: string; content_unit_id: string }>,
  ): Promise<void>;
}

export function canTransitionSessionStatus(fromStatus: string, toStatus: string): boolean;
export function normalizeBudgetMinutes(value: unknown): 5 | 15 | 30;
export function estimateSectionStudyMinutes(section: {
  content_markdown?: string | null;
  callouts?: unknown[] | null;
  mnemonics?: unknown[] | null;
  flashcards?: unknown[] | null;
  mermaid_mindmap?: string | null;
}): number;
export function indexActiveTopics(topics: RoutineTopicInput[]): {
  activeTopics: Array<{
    topic_id: string;
    title: string;
    discipline: string;
    sections: ActiveTopicSectionCandidate[];
  }>;
  sectionByContentUnitId: Map<string, ActiveTopicSectionCandidate>;
  topicById: Map<
    string,
    {
      topic_id: string;
      title: string;
      discipline: string;
      sections: ActiveTopicSectionCandidate[];
    }
  >;
};
export function selectSessionActivitiesForBudget(
  orderedSections: ActiveTopicSectionCandidate[],
  startSectionIndex: number,
  budgetMinutes: number,
): ActiveTopicSectionCandidate[];
export function buildStudyRecommendation(input: {
  topics: RoutineTopicInput[];
  completedContentUnitIds: Set<string>;
  activeSession?: StudyRoutineSessionRecord | null;
  preferredDiscipline?: string | null;
  visibleDisciplines?: string[] | null;
  budgetMinutes?: number;
  excludeContentUnitIds?: Set<string>;
}): StudyRecommendation | null;

export function createRoutineService(repository: RoutineRepository): {
  getSnapshot(input: {
    userId: string;
    topics: RoutineTopicInput[];
    completedContentUnitIds: Set<string>;
    visibleDisciplines?: string[] | null;
    nowUtc?: Date | string | number;
  }): Promise<RoutineSnapshot>;
  savePreferences(input: {
    userId: string;
    targetDays?: number;
    timezoneIana?: string;
    defaultBudgetMinutes?: 5 | 15 | 30;
    preferredDiscipline?: string | null;
    hideGamification?: boolean;
    nowUtc?: Date | string | number;
  }): Promise<{
    preferences: StudyRoutinePreferencesRecord;
    currentPlan: StudyRoutineWeeklyPlanRecord | null;
    updatePlan: PlannedPreferenceUpdate;
  }>;
  startOrResumeSession(input: {
    userId: string;
    topics: RoutineTopicInput[];
    completedContentUnitIds: Set<string>;
    visibleDisciplines?: string[] | null;
    budgetMinutes?: 5 | 15 | 30;
    topicId?: string | null;
    sectionId?: string | null;
    contentUnitId?: string | null;
    idempotencyKey: string;
    replaceActive?: boolean;
    nowUtc?: Date | string | number;
  }): Promise<{
    session: StudyRoutineSessionRecord;
    resumed: boolean;
    idempotent: boolean;
  }>;
  updateSessionStatus(input: {
    userId: string;
    sessionId: string;
    status: "planned" | "in_progress" | "interrupted" | "discarded";
    nowUtc?: Date | string | number;
  }): Promise<StudyRoutineSessionRecord>;
  replaceUnavailableActivity(input: {
    userId: string;
    sessionId: string;
    activityId: string;
    topics: RoutineTopicInput[];
    completedContentUnitIds: Set<string>;
    visibleDisciplines?: string[] | null;
    nowUtc?: Date | string | number;
  }): Promise<StudyRoutineSessionRecord>;
  completeSession(input: {
    userId: string;
    sessionId: string;
    completedActivityIds: string[];
    completionIdempotencyKey: string;
    topics: RoutineTopicInput[];
    nowUtc?: Date | string | number;
  }): Promise<{
    session: StudyRoutineSessionRecord;
    idempotent: boolean;
    weeklyProgress: WeeklyProgressSummary;
  }>;
};
