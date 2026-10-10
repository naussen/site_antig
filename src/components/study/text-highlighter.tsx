"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { AlertCircle, Check, Eraser, Highlighter, Loader2, Trash2, X } from "lucide-react";
import {
  TEXT_HIGHLIGHT_COLORS,
  useTextHighlights,
  type HighlightSectionReference,
  type NewTextHighlight,
} from "@/hooks/use-text-highlights";
import type { TextHighlightColor } from "@/types/database";
import { findAnchoredOffsets } from "@/lib/text-highlight-anchors.mjs";

interface TextHighlighterProps {
  userId: string;
  sections: HighlightSectionReference[];
  panelOpen: boolean;
  onPanelOpenChange: (open: boolean) => void;
  children: ReactNode;
}

type HighlightTool = TextHighlightColor | "eraser" | null;
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface RenderedHighlightRange {
  highlightId: string;
  excerpt: string;
  markdownRoot: HTMLElement;
  priority: number;
  range: Range;
}

interface ContextualDeleteControl {
  highlightId: string;
  excerpt: string;
  left: number;
  top: number;
}

interface PendingHighlightControl {
  input: NewTextHighlight;
  left: number;
  top: number;
}

const COLOR_LABELS: Record<TextHighlightColor, string> = {
  yellow: "Amarelo",
  orange: "Laranja",
  red: "Vermelho",
  pink: "Rosa",
  purple: "Roxo",
  blue: "Azul",
  cyan: "Ciano",
  green: "Verde",
  lime: "Limão",
  gray: "Cinza",
};

const COLOR_CLASSES: Record<TextHighlightColor, string> = {
  yellow: "bg-[var(--study-highlight-yellow)]",
  orange: "bg-[var(--study-highlight-orange)]",
  red: "bg-[var(--study-highlight-red)]",
  pink: "bg-[var(--study-highlight-pink)]",
  purple: "bg-[var(--study-highlight-purple)]",
  blue: "bg-[var(--study-highlight-blue)]",
  cyan: "bg-[var(--study-highlight-cyan)]",
  green: "bg-[var(--study-highlight-green)]",
  lime: "bg-[var(--study-highlight-lime)]",
  gray: "bg-[var(--study-highlight-gray)]",
};

const MAX_HIGHLIGHT_LENGTH = 10000;
const ANCHOR_CONTEXT_LENGTH = 64;
const MAX_VISIBLE_HIGHLIGHTS = 20;
const HIGHLIGHT_EXCERPT_LENGTH = 80;
const CONTEXTUAL_DELETE_SIZE = 32;
const CONTEXTUAL_DELETE_GAP = 6;
const CONTEXTUAL_INSERT_WIDTH = 148;
const CONTEXTUAL_INSERT_HEIGHT = 36;
const VIEWPORT_EDGE_GAP = 8;

function getHighlightExcerpt(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > HIGHLIGHT_EXCERPT_LENGTH
    ? `${normalized.slice(0, HIGHLIGHT_EXCERPT_LENGTH - 1)}…`
    : normalized;
}

function createRangeFromOffsets(root: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;
  let startNode: Text | null = null;
  let endNode: Text | null = null;
  let startNodeOffset = 0;
  let endNodeOffset = 0;
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const nextOffset = currentOffset + textNode.data.length;
    if (!startNode && start >= currentOffset && start <= nextOffset) {
      startNode = textNode;
      startNodeOffset = start - currentOffset;
    }
    if (end >= currentOffset && end <= nextOffset) {
      endNode = textNode;
      endNodeOffset = end - currentOffset;
      break;
    }
    currentOffset = nextOffset;
    node = walker.nextNode();
  }

  if (!startNode || !endNode) return null;
  const range = document.createRange();
  range.setStart(startNode, startNodeOffset);
  range.setEnd(endNode, endNodeOffset);
  return range;
}

function getSelectionOffsets(root: HTMLElement, range: Range) {
  const startRange = document.createRange();
  startRange.selectNodeContents(root);
  startRange.setEnd(range.startContainer, range.startOffset);

  const endRange = document.createRange();
  endRange.selectNodeContents(root);
  endRange.setEnd(range.endContainer, range.endOffset);

  return {
    start: startRange.toString().length,
    end: endRange.toString().length,
  };
}

export function TextHighlighter({
  userId,
  sections,
  panelOpen,
  onPanelOpenChange,
  children,
}: TextHighlighterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextualHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderedHighlightRangesRef = useRef<RenderedHighlightRange[]>([]);
  const [activeTool, setActiveTool] = useState<HighlightTool>("yellow");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [contextualDelete, setContextualDelete] = useState<ContextualDeleteControl | null>(null);
  const [pendingHighlight, setPendingHighlight] = useState<PendingHighlightControl | null>(null);
  const {
    highlights,
    highlightsBySection,
    highlightsNeedingReview,
    loading,
    error,
    addHighlight,
    removeHighlights,
    updateHighlightColor,
  } = useTextHighlights(userId, sections);

  const visibleHighlights = [...highlights]
    .filter((highlight) => !highlight.id.startsWith("pending-"))
    .reverse()
    .slice(0, MAX_VISIBLE_HIGHLIGHTS);

  const setTransientSavedStatus = useCallback((success: boolean) => {
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
    setSaveStatus(success ? "saved" : "error");
    savedStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1800);
  }, []);

  useEffect(() => () => {
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
    if (contextualHideTimerRef.current) clearTimeout(contextualHideTimerRef.current);
  }, []);

  useEffect(() => {
    const hideContextualControls = () => {
      setContextualDelete(null);
      setPendingHighlight(null);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hideContextualControls();
    };
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", hideContextualControls);
    window.addEventListener("scroll", hideContextualControls, true);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", hideContextualControls);
      window.removeEventListener("scroll", hideContextualControls, true);
    };
  }, []);

  useEffect(() => {
    if (typeof CSS === "undefined" || !("highlights" in CSS) || typeof Highlight === "undefined") {
      return;
    }

    TEXT_HIGHLIGHT_COLORS.forEach((color) => CSS.highlights.delete(`study-highlight-${color}`));
    const rangesByColor = Object.fromEntries(
      TEXT_HIGHLIGHT_COLORS.map((color) => [color, [] as Range[]]),
    ) as Record<TextHighlightColor, Range[]>;
    const renderedHighlightRanges: RenderedHighlightRange[] = [];

    Object.entries(highlightsBySection).forEach(([sectionId, sectionHighlights]) => {
      const sectionContainer = Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>("[data-highlight-section-id]") ?? [],
      ).find((element) => element.dataset.highlightSectionId === sectionId);
      const markdownRoot = sectionContainer?.querySelector<HTMLElement>(".markdown-content");
      if (!markdownRoot) return;
      const text = markdownRoot.textContent ?? "";

      sectionHighlights.forEach((highlight) => {
        const offsets = findAnchoredOffsets(text, highlight);
        if (!offsets) return;
        const range = createRangeFromOffsets(markdownRoot, offsets.start, offsets.end);
        if (!range) return;
        rangesByColor[highlight.color].push(range);
        renderedHighlightRanges.push({
          highlightId: highlight.id,
          excerpt: getHighlightExcerpt(highlight.selected_text),
          markdownRoot,
          priority: TEXT_HIGHLIGHT_COLORS.indexOf(highlight.color),
          range,
        });
      });
    });

    renderedHighlightRangesRef.current = renderedHighlightRanges.sort(
      (first, second) => second.priority - first.priority,
    );

    TEXT_HIGHLIGHT_COLORS.forEach((color, priority) => {
      const cssHighlight = new Highlight(...rangesByColor[color]);
      cssHighlight.priority = priority;
      CSS.highlights.set(`study-highlight-${color}`, cssHighlight);
    });

    return () => {
      renderedHighlightRangesRef.current = [];
      TEXT_HIGHLIGHT_COLORS.forEach((color) => CSS.highlights.delete(`study-highlight-${color}`));
    };
  }, [highlightsBySection]);

  const clearContextualHideTimer = useCallback(() => {
    if (!contextualHideTimerRef.current) return;
    clearTimeout(contextualHideTimerRef.current);
    contextualHideTimerRef.current = null;
  }, []);

  const scheduleContextualDeleteHide = useCallback(() => {
    clearContextualHideTimer();
    contextualHideTimerRef.current = setTimeout(() => {
      setContextualDelete(null);
      contextualHideTimerRef.current = null;
    }, 120);
  }, [clearContextualHideTimer]);

  const handleHighlightPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.buttons !== 0) return;
    const target = event.target as Element;
    if (target.closest("[data-highlight-ui]")) {
      clearContextualHideTimer();
      return;
    }
    if (pendingHighlight) {
      setContextualDelete(null);
      return;
    }

    const markdownRoot = target.closest<HTMLElement>(".markdown-content");
    let hovered: { item: RenderedHighlightRange; rect: DOMRect } | null = null;
    for (const item of renderedHighlightRangesRef.current) {
      if (item.markdownRoot !== markdownRoot) continue;
      const rect = Array.from(item.range.getClientRects()).find((candidateRect) => (
        event.clientX >= candidateRect.left
        && event.clientX <= candidateRect.right
        && event.clientY >= candidateRect.top
        && event.clientY <= candidateRect.bottom
      ));
      if (!rect) continue;
      hovered = { item, rect };
      break;
    }

    if (!hovered) {
      scheduleContextualDeleteHide();
      return;
    }

    clearContextualHideTimer();
    const hoveredRect = hovered.rect;

    const preferredTop = hoveredRect.top - CONTEXTUAL_DELETE_SIZE - CONTEXTUAL_DELETE_GAP;
    const top = preferredTop >= VIEWPORT_EDGE_GAP
      ? preferredTop
      : Math.min(
        hoveredRect.bottom + CONTEXTUAL_DELETE_GAP,
        window.innerHeight - CONTEXTUAL_DELETE_SIZE - VIEWPORT_EDGE_GAP,
      );
    const left = Math.min(
      Math.max(hoveredRect.right - CONTEXTUAL_DELETE_SIZE, VIEWPORT_EDGE_GAP),
      window.innerWidth - CONTEXTUAL_DELETE_SIZE - VIEWPORT_EDGE_GAP,
    );

    setContextualDelete((current) => {
      const next = {
        highlightId: hovered.item.highlightId,
        excerpt: hovered.item.excerpt,
        left: Math.round(left),
        top: Math.round(top),
      };
      return current
        && current.highlightId === next.highlightId
        && current.left === next.left
        && current.top === next.top
        ? current
        : next;
    });
  }, [clearContextualHideTimer, pendingHighlight, scheduleContextualDeleteHide]);

  const handleSelection = useCallback(async (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("[data-highlight-ui]")) return;
    if (!activeTool || !rootRef.current || saveStatus === "saving") return;

    if (typeof CSS === "undefined" || !("highlights" in CSS) || typeof Highlight === "undefined") {
      setLocalError("Seu navegador não oferece suporte ao marca-texto persistente.");
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) {
      setPendingHighlight(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const startElement = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer as Element;
    const endElement = range.endContainer.nodeType === Node.TEXT_NODE
      ? range.endContainer.parentElement
      : range.endContainer as Element;
    const markdownRoot = startElement?.closest<HTMLElement>(".markdown-content");
    if (!markdownRoot || endElement?.closest(".markdown-content") !== markdownRoot) return;
    if (!rootRef.current.contains(markdownRoot)) return;

    const sectionContainer = markdownRoot.closest<HTMLElement>("[data-highlight-section-id]");
    const sectionId = sectionContainer?.dataset.highlightSectionId;
    const contentUnitId = sectionContainer?.dataset.highlightContentUnitId;
    if (!sectionId || !contentUnitId) return;

    const { start, end } = getSelectionOffsets(markdownRoot, range);
    const rootText = markdownRoot.textContent ?? "";
    const selectedText = rootText.slice(start, end);
    if (!selectedText.trim()) return;
    if (selectedText.length > MAX_HIGHLIGHT_LENGTH) {
      setLocalError("Selecione no máximo 10.000 caracteres por realce.");
      selection.removeAllRanges();
      return;
    }

    setLocalError(null);
    setContextualDelete(null);
    if (activeTool === "eraser") {
      setPendingHighlight(null);
      setSaveStatus("saving");
      const ids = highlights
        .filter((highlight) => {
          if (
            highlight.content_unit_id !== contentUnitId
            && highlight.section_id !== sectionId
          ) return false;
          const anchoredOffsets = findAnchoredOffsets(rootText, highlight);
          return Boolean(
            anchoredOffsets
            && start < anchoredOffsets.end
            && end > anchoredOffsets.start,
          );
        })
        .map((highlight) => highlight.id);
      if (ids.length === 0) {
        setLocalError("Nenhum realce foi encontrado no trecho selecionado.");
        setSaveStatus("idle");
        selection.removeAllRanges();
        return;
      }
      const success = await removeHighlights(ids);
      selection.removeAllRanges();
      setTransientSavedStatus(success);
      return;
    }

    const selectionRects = Array.from(range.getClientRects());
    const selectionRect = selectionRects.at(-1) ?? range.getBoundingClientRect();
    const preferredTop = selectionRect.bottom + CONTEXTUAL_DELETE_GAP;
    const top = preferredTop + CONTEXTUAL_INSERT_HEIGHT <= window.innerHeight - VIEWPORT_EDGE_GAP
      ? preferredTop
      : Math.max(
        selectionRect.top - CONTEXTUAL_INSERT_HEIGHT - CONTEXTUAL_DELETE_GAP,
        VIEWPORT_EDGE_GAP,
      );
    const left = Math.min(
      Math.max(selectionRect.right - CONTEXTUAL_INSERT_WIDTH, VIEWPORT_EDGE_GAP),
      window.innerWidth - CONTEXTUAL_INSERT_WIDTH - VIEWPORT_EDGE_GAP,
    );

    setPendingHighlight({
      input: {
        sectionId,
        contentUnitId,
        color: activeTool,
        startOffset: start,
        endOffset: end,
        selectedText,
        prefix: rootText.slice(Math.max(0, start - ANCHOR_CONTEXT_LENGTH), start),
        suffix: rootText.slice(end, end + ANCHOR_CONTEXT_LENGTH),
      },
      left: Math.round(left),
      top: Math.round(top),
    });
  }, [activeTool, highlights, removeHighlights, saveStatus, setTransientSavedStatus]);

  const handleInsertHighlight = useCallback(async () => {
    if (!pendingHighlight || saveStatus === "saving") return;
    setLocalError(null);
    setSaveStatus("saving");
    const success = await addHighlight(pendingHighlight.input);
    if (success) {
      window.getSelection()?.removeAllRanges();
      setPendingHighlight(null);
    }
    setTransientSavedStatus(success);
  }, [addHighlight, pendingHighlight, saveStatus, setTransientSavedStatus]);

  const handleColorToolSelect = useCallback((color: TextHighlightColor) => {
    setActiveTool(color);
    setPendingHighlight((current) => current ? {
      ...current,
      input: { ...current.input, color },
    } : current);
  }, []);

  const handleEraserSelect = useCallback(() => {
    setActiveTool("eraser");
    setPendingHighlight(null);
  }, []);

  const handleColorChange = useCallback(async (
    highlightId: string,
    color: TextHighlightColor,
  ) => {
    setLocalError(null);
    setSaveStatus("saving");
    const success = await updateHighlightColor(highlightId, color);
    setTransientSavedStatus(success);
  }, [setTransientSavedStatus, updateHighlightColor]);

  const handleRemoveHighlight = useCallback(async (highlightId: string) => {
    setLocalError(null);
    setSaveStatus("saving");
    const success = await removeHighlights([highlightId]);
    if (success) setContextualDelete(null);
    setTransientSavedStatus(success);
  }, [removeHighlights, setTransientSavedStatus]);

  return (
    <div
      ref={rootRef}
      onPointerMove={handleHighlightPointerMove}
      onPointerLeave={scheduleContextualDeleteHide}
      onPointerUp={handleSelection}
    >
      {children}

      {pendingHighlight && (
        <button
          type="button"
          data-highlight-ui
          data-highlight-insert-button
          onClick={() => void handleInsertHighlight()}
          disabled={saveStatus === "saving"}
          className="fixed z-[60] flex h-9 w-[148px] items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 text-xs font-semibold text-[var(--text-primary)] shadow-lg transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60"
          style={{ left: pendingHighlight.left, top: pendingHighlight.top }}
          aria-label={`Inserir realce ${COLOR_LABELS[pendingHighlight.input.color]} no texto selecionado`}
          title={`Inserir realce ${COLOR_LABELS[pendingHighlight.input.color]}`}
        >
          {saveStatus === "saving" ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Highlighter size={14} aria-hidden="true" />
          )}
          <span>Inserir realce</span>
          <span
            className={`h-2.5 w-2.5 rounded-full border border-black/10 ${COLOR_CLASSES[pendingHighlight.input.color]}`}
            aria-hidden="true"
          />
        </button>
      )}

      {contextualDelete && (
        <button
          type="button"
          data-highlight-ui
          data-highlight-delete-button
          onClick={() => void handleRemoveHighlight(contextualDelete.highlightId)}
          onPointerEnter={clearContextualHideTimer}
          onPointerLeave={scheduleContextualDeleteHide}
          disabled={saveStatus === "saving"}
          className="fixed z-[60] grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] shadow-md transition-colors hover:border-[var(--callout-warning-text)] hover:bg-[var(--callout-warning-bg)] hover:text-[var(--callout-warning-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60"
          style={{ left: contextualDelete.left, top: contextualDelete.top }}
          aria-label={`Excluir realce: ${contextualDelete.excerpt}`}
          title="Excluir realce"
        >
          <Trash2 size={14} />
        </button>
      )}

      {panelOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 sm:bottom-7 sm:right-7">
          <section
            data-highlight-ui
            className="w-[min(90vw,310px)] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-xl"
            aria-label="Ferramenta marca-texto"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Marca-texto</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
                  Escolha uma cor, selecione o texto e confirme em Inserir realce.
                </p>
                {highlightsNeedingReview.length > 0 && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-[var(--callout-warning-text)]">
                    <AlertCircle size={13} aria-hidden="true" />
                    {highlightsNeedingReview.length} {highlightsNeedingReview.length === 1
                      ? "realce aguarda revisão após uma atualização do conteúdo."
                      : "realces aguardam revisão após uma atualização do conteúdo."}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onPanelOpenChange(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"
                aria-label="Fechar marca-texto"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2" aria-label="Cores do marca-texto">
              {TEXT_HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorToolSelect(color)}
                  className={`grid h-9 place-items-center rounded-lg border-2 transition-transform hover:scale-105 ${COLOR_CLASSES[color]} ${
                    activeTool === color ? "border-[var(--text-primary)]" : "border-transparent"
                  }`}
                  aria-label={`Usar marca-texto ${COLOR_LABELS[color]}`}
                  aria-pressed={activeTool === color}
                  title={COLOR_LABELS[color]}
                >
                  {activeTool === color && <Check size={16} className="text-black/75" strokeWidth={3} />}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleEraserSelect}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                activeTool === "eraser"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
              aria-pressed={activeTool === "eraser"}
            >
              <Eraser size={15} />
              Remover realce do trecho selecionado
            </button>

            {visibleHighlights.length > 0 && (
              <div className="mt-4 border-t border-[var(--border)] pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Seus realces ({highlights.length})
                  </p>
                  {highlights.length > MAX_VISIBLE_HIGHLIGHTS && (
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {MAX_VISIBLE_HIGHLIGHTS} mais recentes
                    </span>
                  )}
                </div>
                <ul className="max-h-52 space-y-2 overflow-y-auto pr-1" aria-label="Gerenciar realces">
                  {visibleHighlights.map((highlight) => (
                    <li
                      key={highlight.id}
                      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-2"
                    >
                      <span
                        className={`h-8 w-2 shrink-0 rounded-full ${COLOR_CLASSES[highlight.color]}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-secondary)]" title={getHighlightExcerpt(highlight.selected_text)}>
                        {getHighlightExcerpt(highlight.selected_text)}
                      </span>
                      <label className="sr-only" htmlFor={`highlight-color-${highlight.id}`}>
                        Cor do realce {getHighlightExcerpt(highlight.selected_text)}
                      </label>
                      <select
                        id={`highlight-color-${highlight.id}`}
                        value={highlight.color}
                        onChange={(event) => void handleColorChange(
                          highlight.id,
                          event.target.value as TextHighlightColor,
                        )}
                        disabled={saveStatus === "saving"}
                        className="h-8 max-w-24 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-1 text-xs text-[var(--text-primary)] disabled:opacity-60"
                        aria-label={`Alterar cor do realce: ${getHighlightExcerpt(highlight.selected_text)}`}
                      >
                        {TEXT_HIGHLIGHT_COLORS.map((color) => (
                          <option key={color} value={color}>{COLOR_LABELS[color]}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleRemoveHighlight(highlight.id)}
                        disabled={saveStatus === "saving"}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--callout-warning-bg)] hover:text-[var(--callout-warning-text)] disabled:opacity-60"
                        aria-label={`Excluir realce: ${getHighlightExcerpt(highlight.selected_text)}`}
                        title="Excluir realce"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 min-h-5" aria-live="polite">
              {(loading || saveStatus === "saving") && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Loader2 size={13} className="animate-spin" />
                  {loading ? "Carregando realces..." : "Salvando..."}
                </p>
              )}
              {saveStatus === "saved" && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--callout-tip-text)]">
                  <Check size={13} /> Salvo automaticamente
                </p>
              )}
              {(localError || error || saveStatus === "error") && (
                <p className="flex items-start gap-1.5 text-xs text-[var(--callout-warning-text)]" role="alert">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  {localError || error || "Falha ao salvar o realce."}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
