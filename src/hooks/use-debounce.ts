import { useEffect, useState } from "react";

/**
 * Debounce genérico: retorna o valor somente após `delayMs` de inatividade.
 * Usado pelo Notes Panel para evitar sobrecarga no Supabase.
 */
export function useDebounce<T>(value: T, delayMs: number = 3000): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
