type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

const MISSING_RELATION_CODES = new Set(["42P01", "PGRST205"]);

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

export function formatSupabaseError(error: SupabaseErrorLike): string {
  return [error.code, error.message].filter(Boolean).join(": ") || "erro desconhecido";
}
