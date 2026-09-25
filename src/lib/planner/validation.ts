import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const PLANNER_SLOT_MINUTES = 15;
export const PLANNER_MIN_DURATION_MINUTES = 15;
export const PLANNER_MAX_DURATION_MINUTES = 90;

export function clampPlannerEndMinute({
  startMinute,
  currentEndMinute,
  dayEndMinute,
  slotDelta,
}: {
  startMinute: number;
  currentEndMinute: number;
  dayEndMinute: number;
  slotDelta: number;
}) {
  return Math.max(
    startMinute + PLANNER_MIN_DURATION_MINUTES,
    Math.min(
      startMinute + PLANNER_MAX_DURATION_MINUTES,
      dayEndMinute,
      currentEndMinute + slotDelta * PLANNER_SLOT_MINUTES,
    ),
  );
}

const planFields = z.object({
  title: z.string().trim().min(1).max(80),
  startDate: z.string().regex(datePattern),
  weeksCount: z.coerce.number().int().min(1).max(4),
  dayStartMinute: z.coerce.number().int().min(0).max(1439),
  dayEndMinute: z.coerce.number().int().min(1).max(1440),
  slotMinutes: z.coerce.number().int().refine((value) => [15, 30, 60].includes(value)),
});

function validatePlanRange(
  value: z.infer<typeof planFields>,
  context: z.RefinementCtx,
) {
  if (value.dayEndMinute <= value.dayStartMinute) {
    context.addIssue({ code: "custom", path: ["dayEndMinute"], message: "Faixa de horário inválida." });
  }

  if ((value.dayEndMinute - value.dayStartMinute) % value.slotMinutes !== 0) {
    context.addIssue({ code: "custom", path: ["dayEndMinute"], message: "A faixa diária deve respeitar o intervalo escolhido." });
  }

  if (new Date(`${value.startDate}T12:00:00Z`).getUTCDay() !== 1) {
    context.addIssue({ code: "custom", path: ["startDate"], message: "A data inicial deve ser uma segunda-feira." });
  }
}

export const createPlanSchema = planFields.superRefine(validatePlanRange);
export const updatePlanSchema = planFields
  .extend({ id: z.string().uuid() })
  .superRefine(validatePlanRange);

export const planItemSchema = z.object({
  id: z.string().uuid().optional(),
  planId: z.string().uuid(),
  discipline: z.string().trim().min(1).max(120),
  studyDate: z.string().regex(datePattern),
  startMinute: z.coerce.number().int().min(0).max(1439),
  endMinute: z.coerce.number().int().min(1).max(1440),
  note: z.string().trim().max(300).optional().default(""),
}).superRefine((value, context) => {
  const duration = value.endMinute - value.startMinute;
  if (duration < PLANNER_MIN_DURATION_MINUTES || duration > PLANNER_MAX_DURATION_MINUTES) {
    context.addIssue({ code: "custom", path: ["endMinute"], message: "A duração deve ficar entre 15 e 90 minutos." });
  }
  if (value.startMinute % PLANNER_SLOT_MINUTES !== 0 || value.endMinute % PLANNER_SLOT_MINUTES !== 0) {
    context.addIssue({ code: "custom", path: ["endMinute"], message: "Os horários devem respeitar intervalos de 15 minutos." });
  }
});

export const itemIdSchema = z.string().uuid();
export const copyWeekSchema = z.object({
  planId: z.string().uuid(),
  sourceWeekIndex: z.coerce.number().int().min(0).max(2),
});

export function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number) {
  const result = parseLocalDate(date);
  result.setDate(result.getDate() + days);
  return formatDateKey(result);
}

export function getMonday(date = new Date()) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return formatDateKey(result);
}

export function minuteToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function timeToMinute(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
