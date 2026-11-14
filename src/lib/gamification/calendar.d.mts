export interface LocalDateParts {
  year: number;
  month: number;
  day: number;
  localDate: string;
  hour: number;
  minute: number;
  second: number;
  weekdayMondayZero: number;
  isMonday: boolean;
  timeZone: string;
}

export interface WeekBounds {
  localDate: string;
  weekStartDate: string;
  weekEndDate: string;
  nextWeekStartDate: string;
  weekdayMondayZero: number;
  isPartialStart: boolean;
  timeZone: string;
}

export interface WeeklyDaySummary {
  date: string;
  label: string;
  completed: boolean;
  sessionsCount: number;
}

export interface WeeklyProgressSummary {
  weekStartDate: string;
  weekEndDate: string;
  timezoneIana: string;
  targetDays: number;
  completedDaysCount: number;
  remainingDaysCount: number;
  goalReached: boolean;
  totalCompletedSessionsInWeek: number;
  isPartialFirstWeek: boolean;
  completedDates: string[];
  daysOfWeek: WeeklyDaySummary[];
}

export interface EffectiveWeeklyPlanResolution {
  planId: string | null;
  weekStartDate: string;
  weekEndDate: string;
  nextWeekStartDate: string;
  localDate: string;
  targetDays: number;
  timezoneIana: string;
  isPartialFirstWeek: boolean;
  needsOnboarding: boolean;
  shouldPersistPlan: boolean;
  shouldPromotePending: boolean;
}

export interface PlannedPreferenceUpdate {
  isFirstActivation: boolean;
  effectiveImmediately: boolean;
  effectiveWeekStartDate: string;
  weekEndDate: string;
  isPartialFirstWeek: boolean;
  appliedTargetDays: number;
  appliedTimezoneIana: string;
  pendingTargetDays: number | null;
  pendingTimezoneIana: string | null;
  pendingEffectiveWeekStart: string | null;
  onboardingCompletedAt: string;
}

export interface TimezoneChangePreview {
  currentTimezoneIana: string;
  nextTimezoneIana: string;
  currentLocalDate: string;
  currentLocalTime: string;
  nextLocalDate: string;
  nextLocalTime: string;
  effectiveWeekStartDate: string;
  preservesHistory: boolean;
}

export function parseValidInstant(instantInput: Date | string | number): Date;
export function isValidIanaTimeZone(timeZone: unknown): timeZone is string;
export function normalizeIanaTimeZone(timeZone: string | null | undefined): string;
export function normalizeTargetDays(targetDays: unknown): number;
export function addCalendarDays(isoDate: string, deltaDays: number): string;
export function getLocalDateParts(
  instantInput: Date | string | number,
  timeZone?: string,
): LocalDateParts;
export function getWeekBoundsForInstant(
  instantInput: Date | string | number,
  timeZone?: string,
): WeekBounds;
export function formatIsoDatePtBr(isoDate: string): string;
export function resolveEffectiveWeeklyPlan(input: {
  preferences?: {
    target_days?: number;
    timezone_iana?: string;
    pending_target_days?: number | null;
    pending_timezone_iana?: string | null;
    pending_effective_week_start?: string | null;
    onboarding_completed_at?: string | null;
  } | null;
  existingPlanForCurrentWeek?: {
    id?: string;
    week_start_date: string;
    week_end_date: string;
    target_days: number;
    timezone_iana: string;
    is_partial_first_week?: boolean;
  } | null;
  hasPriorWeeklyPlans?: boolean;
  nowUtc?: Date | string | number;
}): EffectiveWeeklyPlanResolution;
export function planPreferenceUpdate(input: {
  currentPreferences?: {
    target_days?: number;
    timezone_iana?: string;
    pending_target_days?: number | null;
    pending_timezone_iana?: string | null;
    pending_effective_week_start?: string | null;
    onboarding_completed_at?: string | null;
  } | null;
  currentWeeklyPlan?: {
    id?: string;
    week_start_date: string;
    week_end_date: string;
    target_days: number;
    timezone_iana: string;
    is_partial_first_week?: boolean;
  } | null;
  nextTargetDays?: number;
  nextTimezoneIana?: string;
  nowUtc?: Date | string | number;
}): PlannedPreferenceUpdate;
export function previewTimezoneChange(input: {
  currentTimezoneIana?: string;
  nextTimezoneIana: string;
  nowUtc?: Date | string | number;
}): TimezoneChangePreview;
export function summarizeWeeklyProgress(input: {
  weekStartDate: string;
  weekEndDate: string;
  targetDays: number;
  timezoneIana: string;
  isPartialFirstWeek?: boolean;
  sessions: Array<{
    status: string;
    completed_local_date?: string | null;
    completed_week_start_date?: string | null;
  }>;
}): WeeklyProgressSummary;
