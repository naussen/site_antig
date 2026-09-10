export const START_PAGE_RESUMOS = "resumos";
export const START_PAGE_LEGIS = "legis";
export const START_PAGE_DISCIPLINE_PREFIX = "disciplina:";

const DEFAULT_START_PATH = "/resumos/dashboard";

/**
 * @param {unknown} selection
 * @param {readonly string[]} availableDisciplines
 * @returns {{ startModule: "resumos" | "legis", startDiscipline: string | null }}
 */
export function parseStartPageSelection(selection, availableDisciplines) {
  if (selection === START_PAGE_LEGIS) {
    return { startModule: START_PAGE_LEGIS, startDiscipline: null };
  }

  if (
    typeof selection === "string"
    && selection.startsWith(START_PAGE_DISCIPLINE_PREFIX)
  ) {
    const discipline = selection.slice(START_PAGE_DISCIPLINE_PREFIX.length);
    if (availableDisciplines.includes(discipline)) {
      return { startModule: START_PAGE_RESUMOS, startDiscipline: discipline };
    }
  }

  return { startModule: START_PAGE_RESUMOS, startDiscipline: null };
}

/**
 * @param {{ start_module?: unknown, start_discipline?: unknown } | null | undefined} preferences
 * @returns {string}
 */
export function resolveUserStartPath(preferences) {
  if (preferences?.start_module === START_PAGE_LEGIS) {
    return "/legis";
  }

  const discipline = preferences?.start_discipline;
  if (
    preferences?.start_module === START_PAGE_RESUMOS
    && typeof discipline === "string"
    && discipline.length > 0
    && discipline.length <= 100
    && !/[\u0000-\u001f\u007f]/u.test(discipline)
  ) {
    return `${DEFAULT_START_PATH}?disciplina=${encodeURIComponent(discipline)}`;
  }

  return DEFAULT_START_PATH;
}
