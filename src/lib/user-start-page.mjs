export const START_PAGE_RESUMOS = "resumos";
export const START_PAGE_LEGIS = "legis";
export const START_PAGE_NOTES = "notas";
export const START_PAGE_SETTINGS = "configuracoes";

const DEFAULT_START_PATH = "/resumos/dashboard";
const START_PAGE_PATHS = {
  [START_PAGE_RESUMOS]: DEFAULT_START_PATH,
  [START_PAGE_LEGIS]: "/legis",
  [START_PAGE_NOTES]: "/dashboard/notas",
  [START_PAGE_SETTINGS]: "/dashboard/configuracoes",
};

/**
 * @param {unknown} selection
 * @returns {{ startModule: "resumos" | "legis" | "notas" | "configuracoes", startDiscipline: null }}
 */
export function parseStartPageSelection(selection) {
  if (typeof selection === "string" && Object.hasOwn(START_PAGE_PATHS, selection)) {
    return { startModule: selection, startDiscipline: null };
  }

  return { startModule: START_PAGE_RESUMOS, startDiscipline: null };
}

/**
 * @param {{ start_module?: unknown, start_discipline?: unknown } | null | undefined} preferences
 * @returns {string}
 */
export function resolveUserStartPath(preferences) {
  const startModule = preferences?.start_module;
  if (typeof startModule === "string" && Object.hasOwn(START_PAGE_PATHS, startModule)) {
    return START_PAGE_PATHS[startModule];
  }

  return DEFAULT_START_PATH;
}
