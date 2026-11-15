export const DEFAULT_TIMEZONE_IANA: "America/Sao_Paulo";

export const SUPPORTED_TIMEZONE_OPTIONS: ReadonlyArray<{
  readonly value: string;
  readonly label: string;
}>;

export const BUDGET_MINUTES_OPTIONS: readonly [5, 15, 30];
export const DEFAULT_BUDGET_MINUTES: 15;

export const MIN_TARGET_DAYS: 1;
export const MAX_TARGET_DAYS: 7;
export const DEFAULT_TARGET_DAYS: 3;

export type SessionStatus =
  | "planned"
  | "in_progress"
  | "interrupted"
  | "completed"
  | "discarded";

export type ActivityType = "summary" | "law" | "question" | "flashcard";
export type ActivityStatus = "pending" | "completed" | "skipped" | "unavailable";
export type SelectionMode = "recommended" | "manual" | "resumed";

export const SESSION_STATUSES: readonly SessionStatus[];
export const ACTIVE_SESSION_STATUSES: readonly ("planned" | "in_progress" | "interrupted")[];
export const ACTIVITY_TYPES: readonly ActivityType[];
export const ACTIVITY_STATUSES: readonly ActivityStatus[];
export const SELECTION_MODES: readonly SelectionMode[];

export function isGamificationOperationalEnabled(
  env?: Record<string, string | undefined>,
): boolean;
