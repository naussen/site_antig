import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  createPlanSchema,
  formatDateKey,
  getMonday,
  minuteToTime,
  planItemSchema,
  timeToMinute,
} from "../src/lib/planner/validation.ts";

test("converte horários entre minutos e HH:mm", () => {
  assert.equal(minuteToTime(360), "06:00");
  assert.equal(timeToMinute("23:30"), 1410);
});

test("soma dias sem converter a data para outro fuso", () => {
  assert.equal(addDays("2026-09-21", 7), "2026-09-28");
  assert.match(formatDateKey(new Date(2026, 8, 22, 12)), /^2026-09-22$/);
});

test("calcula a segunda-feira da semana", () => {
  assert.equal(getMonday(new Date(2026, 8, 24, 12)), "2026-09-21");
});

test("aceita plano de uma a quatro semanas com grade alinhada", () => {
  const valid = createPlanSchema.safeParse({
    title: "Plano",
    startDate: "2026-09-21",
    weeksCount: 4,
    dayStartMinute: 360,
    dayEndMinute: 1380,
    slotMinutes: 30,
  });
  assert.equal(valid.success, true);
});

test("rejeita início fora de segunda-feira e grade desalinhada", () => {
  assert.equal(createPlanSchema.safeParse({
    title: "Plano",
    startDate: "2026-09-22",
    weeksCount: 2,
    dayStartMinute: 360,
    dayEndMinute: 1375,
    slotMinutes: 30,
  }).success, false);
});

test("rejeita bloco com fim anterior ao início", () => {
  assert.equal(planItemSchema.safeParse({
    planId: "0d46ff39-e1c8-4d4f-a0b0-e09f4ca06dcc",
    discipline: "Direito Constitucional",
    studyDate: "2026-09-21",
    startMinute: 600,
    endMinute: 570,
    note: "",
  }).success, false);
});
