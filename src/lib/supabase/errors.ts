type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

const MISSING_RELATION_CODES = new Set(["42P01", "PGRST205"]);
const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"]);

export function isMissingTableError(
  error: SupabaseErrorLike | null,
  tableName: string
): boolean {
  if (!error) return false;

  if (error.code && MISSING_RELATION_CODES.has(error.code)) return true;

  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes(tableName.toLowerCase()) &&
    (message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("could not find the table"))
  );
}

export function isMissingColumnError(
  error: SupabaseErrorLike | null,
  columnName: string
): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() ?? "";
  const code = error.code ?? "";
  return (
    MISSING_COLUMN_CODES.has(code)
    && message.includes(columnName.toLowerCase())
  );
}

export function formatSupabaseError(error: SupabaseErrorLike): string {
  return [error.code, error.message].filter(Boolean).join(": ") || "erro desconhecido";
}

export function getSafeSupabaseErrorCode(
  error: SupabaseErrorLike | null
): string {
  const code = error?.code?.trim();
  return code && /^[a-z0-9_]{1,24}$/i.test(code) ? code : "UNKNOWN";
}
