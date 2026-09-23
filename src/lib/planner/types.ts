export type PlannerPlan = {
  id: string;
  title: string;
  startDate: string;
  weeksCount: number;
  dayStartMinute: number;
  dayEndMinute: number;
  slotMinutes: 15 | 30 | 60;
};

export type PlannerItem = {
  id: string;
  discipline: string;
  studyDate: string;
  startMinute: number;
  endMinute: number;
  note: string | null;
};

export type PlannerActionResult = {
  ok: boolean;
  message: string;
};
