"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GripVertical,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createStudyPlan,
  deleteStudyPlanItem,
  saveStudyPlanItem,
  updateStudyPlan,
} from "@/app/actions/study-planner";
import type { PlannerItem, PlannerPlan } from "@/lib/planner/types";
import {
  addDays,
  getMonday,
  minuteToTime,
  parseLocalDate,
  timeToMinute,
} from "@/lib/planner/validation";

type PlannerClientProps = {
  disciplines: string[];
  initialPlan: PlannerPlan | null;
  initialItems: PlannerItem[];
};

type ItemDraft = {
  id?: string;
  discipline: string;
  studyDate: string;
  startMinute: number;
  endMinute: number;
  note: string;
};

const weekDayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
const longDateFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

function DraggableDiscipline({ discipline, onAdd }: { discipline: string; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `discipline:${discipline}`,
    data: { kind: "discipline", discipline },
  });
  return (
    <div ref={setNodeRef} className={`flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-2 ${isDragging ? "opacity-50" : ""}`}>
      <button type="button" className="cursor-grab touch-none rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label={`Arrastar ${discipline}`} {...listeners} {...attributes}>
        <GripVertical size={17} />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text-primary)]">{discipline}</span>
      <button type="button" onClick={onAdd} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label={`Adicionar ${discipline}`}>
        <Plus size={17} />
      </button>
    </div>
  );
}

function DraggableStudyBlock({ item, onEdit }: { item: PlannerItem; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item:${item.id}`,
    data: { kind: "item", item },
  });
  return (
    <div ref={setNodeRef} className={`group rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-2 text-left shadow-sm ${isDragging ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-1">
        <button type="button" className="mt-0.5 cursor-grab touch-none rounded p-1 text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label={`Mover ${item.discipline}`} {...listeners} {...attributes}>
          <GripVertical size={14} />
        </button>
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <strong className="block truncate text-xs text-[var(--text-primary)]">{item.discipline}</strong>
          <span className="mt-0.5 block text-[11px] text-[var(--text-secondary)]">{minuteToTime(item.startMinute)}–{minuteToTime(item.endMinute)}</span>
        </button>
        <Pencil size={13} className="mt-1 shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100" aria-hidden="true" />
      </div>
    </div>
  );
}

function DroppableSlot({ date, minute, children, onAdd }: { date: string; minute: number; children: React.ReactNode; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${date}:${minute}`, data: { date, minute } });
  return (
    <div ref={setNodeRef} className={`min-h-16 border-t border-[var(--border)] p-1 transition-colors ${isOver ? "bg-[var(--accent-soft)] ring-2 ring-inset ring-[var(--accent)]" : ""}`}>
      <button type="button" onClick={onAdd} className="mb-1 w-full rounded px-1 py-1 text-left text-[10px] text-[var(--text-muted)] hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label={`Adicionar estudo às ${minuteToTime(minute)} em ${date}`}>
        {minuteToTime(minute)}
      </button>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function PlannerClient({ disciplines, initialPlan, initialItems }: PlannerClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [weekIndex, setWeekIndex] = useState(0);
  const [mobileDay, setMobileDay] = useState(0);
  const [message, setMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const safeWeekIndex = initialPlan ? Math.min(weekIndex, initialPlan.weeksCount - 1) : 0;
  const weekStart = initialPlan ? addDays(initialPlan.startDate, safeWeekIndex * 7) : getMonday();
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const slots = useMemo(() => {
    if (!initialPlan) return [];
    const values: number[] = [];
    for (let minute = initialPlan.dayStartMinute; minute < initialPlan.dayEndMinute; minute += initialPlan.slotMinutes) values.push(minute);
    return values;
  }, [initialPlan]);
  const itemsByDateAndTime = useMemo(() => {
    const map = new Map<string, PlannerItem[]>();
    for (const item of initialItems) {
      const key = `${item.studyDate}:${item.startMinute}`;
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [initialItems]);

  const runAction = (action: () => Promise<{ ok: boolean; message: string }>, afterSuccess?: () => void) => {
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result.message);
        if (result.ok) {
          afterSuccess?.();
          router.refresh();
        }
      } catch {
        setMessage("Não foi possível concluir a operação. Atualize a página e tente novamente.");
      }
    });
  };

  const openNewItem = (discipline = disciplines[0] ?? "", studyDate = weekDates[mobileDay], startMinute = initialPlan?.dayStartMinute ?? 360) => {
    if (!initialPlan || !discipline) return;
    setDraft({ discipline, studyDate, startMinute, endMinute: Math.min(startMinute + 60, initialPlan.dayEndMinute), note: "" });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!initialPlan || !over) return;
    const [kind, date, minuteText] = String(over.id).split(":");
    if (kind !== "slot") return;
    const startMinute = Number(minuteText);
    const activeData = active.data.current;
    if (activeData?.kind === "discipline") {
      openNewItem(String(activeData.discipline), date, startMinute);
      return;
    }
    if (activeData?.kind === "item") {
      const item = activeData.item as PlannerItem;
      const duration = item.endMinute - item.startMinute;
      const endMinute = Math.min(startMinute + duration, initialPlan.dayEndMinute);
      if (endMinute <= startMinute) return;
      runAction(() => saveStudyPlanItem({ id: item.id, planId: initialPlan.id, discipline: item.discipline, studyDate: date, startMinute, endMinute, note: item.note ?? "" }));
    }
  };

  if (!initialPlan) {
    return (
      <section className="mx-auto mt-6 max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><CalendarPlus size={22} /></span>
          <div><h2 className="text-xl font-black text-[var(--text-primary)]">Crie seu primeiro plano</h2><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Escolha uma segunda-feira, o número de semanas e a faixa diária que deseja organizar.</p></div>
        </div>
        <PlanForm pending={pending} onSubmit={(value) => runAction(() => createStudyPlan(value))} />
        <p className="mt-4 text-sm text-[var(--text-secondary)]" aria-live="polite">{message}</p>
      </section>
    );
  }

  const renderDay = (date: string) => (
    <section key={date} className="min-w-0 border-l border-[var(--border)] first:border-l-0" aria-label={longDateFormatter.format(parseLocalDate(date))}>
      <h3 className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-card)] px-2 py-3 text-center text-xs font-bold capitalize text-[var(--text-primary)]">{weekDayFormatter.format(parseLocalDate(date))}</h3>
      {slots.map((minute) => (
        <DroppableSlot key={`${date}:${minute}`} date={date} minute={minute} onAdd={() => openNewItem(disciplines[0] ?? "", date, minute)}>
          {(itemsByDateAndTime.get(`${date}:${minute}`) ?? []).map((item) => <DraggableStudyBlock key={item.id} item={item} onEdit={() => setDraft({ id: item.id, discipline: item.discipline, studyDate: item.studyDate, startMinute: item.startMinute, endMinute: item.endMinute, note: item.note ?? "" })} />)}
        </DroppableSlot>
      ))}
    </section>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => {
        const data = active.data.current;
        setActiveDragLabel(data?.kind === "discipline" ? String(data.discipline) : (data?.item as PlannerItem | undefined)?.discipline ?? null);
      }}
      onDragCancel={() => setActiveDragLabel(null)}
      onDragEnd={(event) => {
        setActiveDragLabel(null);
        handleDragEnd(event);
      }}
    >
      <div className="mt-6 grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)] xl:sticky xl:top-5 xl:self-start">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">Disciplinas</p><h2 className="mt-1 font-bold text-[var(--text-primary)]">Arraste para a grade</h2></div><button type="button" onClick={() => openNewItem()} className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2" aria-label="Adicionar estudo"><Plus size={18} /></button></div>
          <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">{disciplines.map((discipline) => <DraggableDiscipline key={discipline} discipline={discipline} onAdd={() => openNewItem(discipline)} />)}</div>
          {disciplines.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">Nenhuma disciplina disponível.</p>}
        </aside>

        <section className="min-w-0 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Semana {safeWeekIndex + 1} de {initialPlan.weeksCount}</p><h2 className="mt-1 text-xl font-black text-[var(--text-primary)]">{initialPlan.title}</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{minuteToTime(initialPlan.dayStartMinute)}–{minuteToTime(initialPlan.dayEndMinute)} · intervalos de {initialPlan.slotMinutes} min</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setWeekIndex((value) => Math.max(0, value - 1))} disabled={safeWeekIndex === 0} className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-40" aria-label="Semana anterior"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => setWeekIndex((value) => Math.min(initialPlan.weeksCount - 1, value + 1))} disabled={safeWeekIndex === initialPlan.weeksCount - 1} className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-40" aria-label="Próxima semana"><ChevronRight size={18} /></button>
              <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--accent)]"><Settings2 size={17} /> Ajustar</button>
            </div>
          </div>

          {settingsOpen && <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)] p-4"><PlanForm plan={initialPlan} pending={pending} onSubmit={(value) => runAction(() => updateStudyPlan({ ...value, id: initialPlan.id }), () => setSettingsOpen(false))} /></div>}

          <div className="border-b border-[var(--border)] p-3 md:hidden"><label className="text-xs font-bold text-[var(--text-secondary)]">Dia exibido<select value={mobileDay} onChange={(event) => setMobileDay(Number(event.target.value))} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]">{weekDates.map((date, index) => <option key={date} value={index}>{longDateFormatter.format(parseLocalDate(date))}</option>)}</select></label></div>
          <div className="hidden overflow-x-auto md:block"><div className="grid min-w-[980px] grid-cols-7">{weekDates.map(renderDay)}</div></div>
          <div className="md:hidden">{renderDay(weekDates[mobileDay])}</div>
          <p className="border-t border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]" aria-live="polite">{pending ? "Salvando…" : message}</p>
        </section>
      </div>

      {draft && <ItemDialog draft={draft} disciplines={disciplines} plan={initialPlan} pending={pending} onClose={() => setDraft(null)} onSave={(value) => runAction(() => saveStudyPlanItem({ ...value, planId: initialPlan.id }), () => setDraft(null))} onDelete={draft.id ? () => runAction(() => deleteStudyPlanItem(draft.id!), () => setDraft(null)) : undefined} />}
      <DragOverlay>
        {activeDragLabel ? <div className="max-w-64 rounded-xl border border-[var(--accent)] bg-[var(--bg-card)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] shadow-2xl">{activeDragLabel}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function PlanForm({ plan, pending, onSubmit }: { plan?: PlannerPlan; pending: boolean; onSubmit: (value: Record<string, unknown>) => void }) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({ title: data.get("title"), startDate: data.get("startDate"), weeksCount: data.get("weeksCount"), dayStartMinute: timeToMinute(String(data.get("dayStart"))), dayEndMinute: timeToMinute(String(data.get("dayEnd"))), slotMinutes: data.get("slotMinutes") });
  };
  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-bold text-[var(--text-secondary)] sm:col-span-2 lg:col-span-1">Nome<input name="title" required maxLength={80} defaultValue={plan?.title ?? "Meu plano de estudos"} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]" /></label>
      <label className="text-xs font-bold text-[var(--text-secondary)]">Segunda-feira inicial<input name="startDate" type="date" required defaultValue={plan?.startDate ?? getMonday()} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]" /></label>
      <label className="text-xs font-bold text-[var(--text-secondary)]">Semanas<select name="weeksCount" defaultValue={plan?.weeksCount ?? 1} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]">{[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="text-xs font-bold text-[var(--text-secondary)]">Início diário<input name="dayStart" type="time" required defaultValue={minuteToTime(plan?.dayStartMinute ?? 360)} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]" /></label>
      <label className="text-xs font-bold text-[var(--text-secondary)]">Fim diário<input name="dayEnd" type="time" required defaultValue={minuteToTime(plan?.dayEndMinute ?? 1380)} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]" /></label>
      <label className="text-xs font-bold text-[var(--text-secondary)]">Intervalo<select name="slotMinutes" defaultValue={plan?.slotMinutes ?? 30} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]"><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="60">60 minutos</option></select></label>
      <button type="submit" disabled={pending} className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2 lg:col-span-3">{pending ? "Salvando…" : plan ? "Salvar ajustes" : "Criar planner"}</button>
    </form>
  );
}

function ItemDialog({ draft, disciplines, plan, pending, onClose, onSave, onDelete }: { draft: ItemDraft; disciplines: string[]; plan: PlannerPlan; pending: boolean; onClose: () => void; onSave: (value: ItemDraft) => void; onDelete?: () => void }) {
  const lastDate = addDays(plan.startDate, plan.weeksCount * 7 - 1);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({ id: draft.id, discipline: String(data.get("discipline")), studyDate: String(data.get("studyDate")), startMinute: timeToMinute(String(data.get("startTime"))), endMinute: timeToMinute(String(data.get("endTime"))), note: String(data.get("note") ?? "") });
  };
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="planner-dialog-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">Horário de estudo</p><h2 id="planner-dialog-title" className="mt-1 text-xl font-black text-[var(--text-primary)]">{draft.id ? "Editar bloco" : "Adicionar bloco"}</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--accent-soft)]" aria-label="Fechar"><X size={20} /></button></div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-xs font-bold text-[var(--text-secondary)]">Disciplina<select name="discipline" required defaultValue={draft.discipline} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-3 text-sm text-[var(--text-primary)]">{disciplines.map((discipline) => <option key={discipline}>{discipline}</option>)}</select></label>
          <label className="block text-xs font-bold text-[var(--text-secondary)]">Data<input name="studyDate" type="date" min={plan.startDate} max={lastDate} required defaultValue={draft.studyDate} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-3 text-sm text-[var(--text-primary)]" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-[var(--text-secondary)]">Início<input name="startTime" type="time" min={minuteToTime(plan.dayStartMinute)} max={minuteToTime(plan.dayEndMinute - 1)} step={plan.slotMinutes * 60} required defaultValue={minuteToTime(draft.startMinute)} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-3 text-sm text-[var(--text-primary)]" /></label><label className="text-xs font-bold text-[var(--text-secondary)]">Fim<input name="endTime" type="time" min={minuteToTime(plan.dayStartMinute + 1)} max={minuteToTime(plan.dayEndMinute)} step={plan.slotMinutes * 60} required defaultValue={minuteToTime(draft.endMinute)} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-3 text-sm text-[var(--text-primary)]" /></label></div>
          <label className="block text-xs font-bold text-[var(--text-secondary)]">Observação opcional<textarea name="note" maxLength={300} rows={3} defaultValue={draft.note} className="mt-1 block w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-3 text-sm text-[var(--text-primary)]" /></label>
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-between">
            {onDelete ? <button type="button" onClick={() => { if (window.confirm("Excluir este horário de estudo?")) onDelete(); }} disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-3 text-sm font-bold text-red-500"><Trash2 size={17} /> Excluir</button> : <span />}
            <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Clock3 size={17} /> {pending ? "Salvando…" : "Salvar horário"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
