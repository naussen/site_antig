"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface MermaidViewerClientProps {
  chart: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;

function hashChart(chart: string) {
  let hash = 0;

  for (let index = 0; index < chart.length; index += 1) {
    hash = (hash * 31 + chart.charCodeAt(index)) >>> 0;
  }

  return hash;
}

/** Corrige somente artefatos comuns de transporte, sem reescrever a estrutura. */
export function normalizeMermaidChart(chart: string) {
  const withoutFence = chart
    .trim()
    .replace(/^```(?:mermaid)?\s*\r?\n/i, "")
    .replace(/\r?\n```\s*$/i, "");

  return withoutFence
    .split(/\r?\n/)
    .map((line) =>
      line.replace(
        /\["([^"\]]*)\["([^"\]]+)"\]([^"\]]*)"\]/g,
        (_match, before: string, quoted: string, after: string) =>
          `["${before}'${quoted}'${after}"]`,
      ),
    )
    .join("\n");
}

function varySimpleFlowchartLayout(chart: string, variant: number) {
  if (variant === 0 || /(^|\n)\s*subgraph\b/i.test(chart)) return chart;

  return chart.replace(
    /^(\s*(?:flowchart|graph))\s+(?:TD|TB)\b/i,
    "$1 LR",
  );
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

function parseSvgSize(svgElement: SVGSVGElement) {
  const viewBox = svgElement.getAttribute("viewBox");
  if (viewBox) {
    const [, , width, height] = viewBox.split(/\s+/).map(Number);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }

  const width = Number.parseFloat(svgElement.getAttribute("width") || "");
  const height = Number.parseFloat(svgElement.getAttribute("height") || "");

  return {
    width: Number.isFinite(width) && width > 0 ? width : 800,
    height: Number.isFinite(height) && height > 0 ? height : 420,
  };
}

/**
 * Componente cliente para renderizar diagramas Mermaid.
 * Carrega a lib mermaid apenas no browser (nunca no SSR).
 * Reage a mudanças de tema e oferece zoom local para mapas grandes.
 */
function MermaidViewerClient({ chart }: MermaidViewerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [autoFit, setAutoFit] = useState(true);
  const { theme } = useTheme();
  const renderIdRef = useRef(0);
  const normalizedChart = useMemo(() => normalizeMermaidChart(chart), [chart]);
  const variant = useMemo(() => hashChart(normalizedChart) % 3, [normalizedChart]);
  const displayChart = useMemo(
    () => varySimpleFlowchartLayout(normalizedChart, variant),
    [normalizedChart, variant],
  );

  useEffect(() => {
    if (!displayChart || !containerRef.current) return;

    const currentRenderId = ++renderIdRef.current;
    setRendered(false);
    setBaseSize(null);
    setZoom(1);
    setAutoFit(true);

    async function renderChart() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
          fontFamily: "Inter, system-ui, sans-serif",
          securityLevel: "loose",
          flowchart: {
            curve: variant === 0 ? "basis" : variant === 1 ? "natural" : "stepAfter",
            htmlLabels: true,
          },
        });

        const uniqueId = `mermaid-${Date.now()}-${currentRenderId}`;
        const { svg } = await mermaid.render(uniqueId, displayChart);

        if (currentRenderId === renderIdRef.current && containerRef.current) {
          containerRef.current.innerHTML = svg;

          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            svgElement.style.display = "block";
            svgElement.style.maxWidth = "none";
            svgElement.style.height = "auto";
            setBaseSize(parseSvgSize(svgElement));
          }

          setError(null);
          setRendered(true);
        }
      } catch (err) {
        if (currentRenderId === renderIdRef.current) {
          console.error("Erro ao renderizar Mermaid:", err);
          setError("Não foi possível renderizar o diagrama.");
          setRendered(false);
        }
      }
    }

    renderChart();
  }, [displayChart, isOverlayOpen, theme, variant]);

  useEffect(() => {
    if (!baseSize || !scrollRef.current) return;

    const viewport = scrollRef.current;
    const fitDiagram = () => {
      if (!autoFit) return;

      const horizontalFit = (viewport.clientWidth - 32) / baseSize.width;
      const verticalFit = isOverlayOpen
        ? (viewport.clientHeight - 32) / baseSize.height
        : MAX_ZOOM;
      setZoom(clampZoom(Math.min(horizontalFit, verticalFit, 1.35)));
    };

    fitDiagram();
    const resizeObserver = new ResizeObserver(fitDiagram);
    resizeObserver.observe(viewport);
    return () => resizeObserver.disconnect();
  }, [autoFit, baseSize, isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOverlayOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOverlayOpen]);

  useEffect(() => {
    const svgElement = containerRef.current?.querySelector("svg");
    if (!svgElement || !baseSize) return;

    svgElement.style.width = `${Math.round(baseSize.width * zoom)}px`;
    svgElement.style.height = `${Math.round(baseSize.height * zoom)}px`;
  }, [baseSize, zoom, rendered]);

  const zoomOut = () => {
    setAutoFit(false);
    setZoom((current) => clampZoom(current - ZOOM_STEP));
  };
  const zoomIn = () => {
    setAutoFit(false);
    setZoom((current) => clampZoom(current + ZOOM_STEP));
  };
  const resetZoom = () => {
    setAutoFit(false);
    setZoom(1);
    scrollRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  };

  const toggleOverlay = () => {
    setAutoFit(true);
    setIsOverlayOpen((current) => !current);
  };

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl p-6 text-sm"
        style={{
          background: "var(--callout-warning-bg)",
          color: "var(--callout-warning-text)",
          border: "1px solid var(--callout-warning-border)",
        }}
      >
        {error}
      </div>
    );
  }

  const viewer = (
    <div
      className={`mermaid-variant-${variant} animate-fade-in-up overflow-hidden rounded-xl ${
        isOverlayOpen ? "flex h-full flex-col" : ""
      }`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {rendered && (
        <div
          className="flex items-center justify-between gap-3 border-b px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Zoom {Math.round(zoom * 100)}%
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="rounded-lg border p-1.5 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              aria-label="Diminuir zoom do mapa mental"
              title="Diminuir zoom"
            >
              <ZoomOut size={16} />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className="rounded-lg border p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              aria-label="Restaurar zoom do mapa mental"
              title="Restaurar zoom"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="rounded-lg border p-1.5 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              aria-label="Aumentar zoom do mapa mental"
              title="Aumentar zoom"
            >
              <ZoomIn size={16} />
            </button>

            <button
              type="button"
              onClick={toggleOverlay}
              className="rounded-lg border p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              aria-label={isOverlayOpen ? "Fechar mapa mental sobreposto" : "Abrir mapa mental sobreposto"}
              title={isOverlayOpen ? "Fechar visualização ampliada" : "Abrir visualização ampliada"}
            >
              {isOverlayOpen ? <X size={16} /> : <Expand size={16} />}
            </button>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className={`${isOverlayOpen ? "min-h-0 flex-1" : "max-h-[70vh]"} overflow-auto p-4`}
        style={{ background: "var(--bg-card)" }}
      >
        <div ref={containerRef} className="flex min-w-max justify-center" />
      </div>
    </div>
  );

  if (!isOverlayOpen) return viewer;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Mapa mental em visualização ampliada"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) toggleOverlay();
      }}
    >
      {viewer}
    </div>,
    document.body,
  );
}

export default MermaidViewerClient;
