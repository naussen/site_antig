import type {
  RoutineRepository,
  StudyRoutineActivityRecord,
  StudyRoutinePreferencesRecord,
  StudyRoutineSessionRecord,
  StudyRoutineWeeklyPlanRecord,
} from "./session.d.mts";

export class RoutineSchemaUnavailableError extends Error {
  readonly code: string;
  constructor(code?: string);
}

export function getRoutineErrorLike(
  error: unknown,
): { code?: string; message?: string } | null;

export function getSafeRoutineErrorCode(error: unknown): string;

export function isRoutineSchemaError(error: unknown): boolean;

export function logRoutineServerError(
  context: string,
  error: unknown,
  schemaUnavailable?: boolean,
): void;

export function normalizeBudgetValue(value: unknown): 5 | 15 | 30;

export function throwMappedDatabaseError(context: string, error: unknown): never;

export function mapPreferencesRow(
  row: Record<string, unknown>,
): StudyRoutinePreferencesRecord;

export function mapWeeklyPlanRow(
  row: Record<string, unknown>,
): StudyRoutineWeeklyPlanRecord;

export function mapActivityRow(
  row: Record<string, unknown>,
): StudyRoutineActivityRecord;

export function mapSessionRow(
  row: Record<string, unknown>,
  activities: StudyRoutineActivityRecord[],
): StudyRoutineSessionRecord;

export function createSupabaseRoutineRepository(supabase: {
  from: (relation: string) => unknown;
  rpc: (fn: string, args?: Record<string, unknown>) => unknown;
}): RoutineRepository;
