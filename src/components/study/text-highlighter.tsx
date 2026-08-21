"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, Eraser, Loader2, X } from "lucide-react";
import {
  TEXT_HIGHLIGHT_COLORS,
  useTextHighlights,
  type NewTextHighlight,
} from "@/hooks/use-text-highlights";
import type { TextHighlightColor } from "@/types/database";
import { findAnchoredOffsets } from "@/lib/text-highlight-anchors.mjs";

interface TextHighlighterProps {
  userId: string;
  sectionIds: string[];
  panelOpen: boolean;
  onPanelOpenChange: (open: boolean) => void;
  children: ReactNode;
}

type HighlightTool = TextHighlightColor | "eraser" | null;
type SaveStatus = "idle" | "saving" | "saved" | "error";

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
  sectionIds,
  panelOpen,
  onPanelOpenChange,
  children,
}: TextHighlighterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTool, setActiveTool] = useState<HighlightTool>("yellow");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const {
    highlights,
    highlightsBySection,
    loading,
    error,
    addHighlight,
    removeHighlights,
  } = useTextHighlights(userId, sectionIds);

  const setTransientSavedStatus = useCallback((success: boolean) => {
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
    setSaveStatus(success ? "saved" : "error");
    savedStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1800);
  }, []);

  useEffect(() => () => {
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
  }, []);

  useEffect(() => {
    if (typeof CSS === "undefined" || !("highlights" in CSS) || typeof Highlight === "undefined") {
      return;
    }

    TEXT_HIGHLIGHT_COLORS.forEach((color) => CSS.highlights.delete(`study-highlight-${color}`));
    const rangesByColor = Object.fromEntries(
      TEXT_HIGHLIGHT_COLORS.map((color) => [color, [] as Range[]]),
    ) as Record<TextHighlightColor, Range[]>;

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
        if (range) rangesByColor[highlight.color].push(range);
      });
    });

    TEXT_HIGHLIGHT_COLORS.forEach((color, priority) => {
      const cssHighlight = new Highlight(...rangesByColor[color]);
      cssHighlight.priority = priority;
      CSS.highlights.set(`study-highlight-${color}`, cssHighlight);
    });

    return () => {
      TEXT_HIGHLIGHT_COLORS.forEach((color) => CSS.highlights.delete(`study-highlight-${color}`));
    };
  }, [highlightsBySection]);

  const handleSelection = useCallback(async () => {
    if (!panelOpen || !activeTool || !rootRef.current || saveStatus === "saving") return;

    if (typeof CSS === "undefined" || !("highlights" in CSS) || typeof Highlight === "undefined") {
      setLocalError("Seu navegador não oferece suporte ao marca-texto persistente.");
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return;
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
    if (!sectionId) return;

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
    setSaveStatus("saving");
    let success: boolean;
    if (activeTool === "eraser") {
      const ids = highlights
        .filter((highlight) => {
          if (highlight.section_id !== sectionId) return false;
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
      success = await removeHighlights(ids);
    } else {
      const input: NewTextHighlight = {
        sectionId,
        color: activeTool,
        startOffset: start,
        endOffset: end,
        selectedText,
        prefix: rootText.slice(Math.max(0, start - ANCHOR_CONTEXT_LENGTH), start),
        suffix: rootText.slice(end, end + ANCHOR_CONTEXT_LENGTH),
      };
      success = await addHighlight(input);
    }

    selection.removeAllRanges();
    setTransientSavedStatus(success);
  }, [activeTool, addHighlight, highlights, panelOpen, removeHighlights, saveStatus, setTransientSavedStatus]);

  return (
    <div ref={rootRef} onPointerUp={handleSelection}>
      {children}

      {panelOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 sm:bottom-7 sm:right-7">
          <section
            className="w-[min(90vw,310px)] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-xl"
            aria-label="Ferramenta marca-texto"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Marca-texto</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
                  Escolha uma cor e selecione o texto. O salvamento é automático.
                </p>
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
                  onClick={() => setActiveTool(color)}
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
              onClick={() => setActiveTool("eraser")}
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
