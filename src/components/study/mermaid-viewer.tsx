"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DOMPurify from "dompurify";
import { Expand, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { normalizeMermaidChart } from "@/lib/mermaid/normalize-mermaid-chart";

export { normalizeMermaidChart } from "@/lib/mermaid/normalize-mermaid-chart";

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

function getMermaidThemeVariables(theme: string) {
  if (theme === "dark") {
    return {
      primaryColor: "#193252",
      primaryTextColor: "#F7FAFF",
      primaryBorderColor: "#7BADE8",
      lineColor: "#71A4E0",
      secondaryColor: "#332B1B",
      tertiaryColor: "#202B3B",
      mainBkg: "#193252",
      nodeBorder: "#7BADE8",
      clusterBkg: "#14243B",
      clusterBorder: "#7BADE8",
    };
  }

  if (theme === "sepia") {
    return {
      primaryColor: "#DCE8E7",
      primaryTextColor: "#3D3529",
      primaryBorderColor: "#657A82",
      lineColor: "#6C7184",
      secondaryColor: "#F6E7BE",
      tertiaryColor: "#F8F1E3",
      mainBkg: "#DCE8E7",
      nodeBorder: "#657A82",
      clusterBkg: "#E9E0CB",
      clusterBorder: "#657A82",
    };
  }

  return {
    primaryColor: "#E6F0FF",
    primaryTextColor: "#001A4D",
    primaryBorderColor: "#2E5E9B",
    lineColor: "#315A92",
    secondaryColor: "#FFF9E6",
    tertiaryColor: "#FFFFFF",
    mainBkg: "#E6F0FF",
    nodeBorder: "#2E5E9B",
    clusterBkg: "#EDF3FC",
    clusterBorder: "#2E5E9B",
  };
}

function applyCoherentPalette(svgElement: SVGSVGElement) {
  const palette = {
    root: "var(--mindmap-root)",
    rootText: "var(--mindmap-root-text)",
    node: [
      "var(--mindmap-node-one)",
      "var(--mindmap-node-two)",
      "var(--mindmap-node-three)",
    ],
    stroke: "var(--mindmap-stroke)",
    text: "var(--text-primary)",
    edge: "var(--mindmap-edge)",
  };

  svgElement.querySelectorAll<SVGGElement>(".node").forEach((node, index) => {
    const fill = index === 0 ? palette.root : palette.node[(index - 1) % palette.node.length];
    node.querySelectorAll<SVGElement>("rect, polygon, circle, ellipse, path").forEach((shape) => {
      shape.style.fill = fill;
      shape.style.stroke = palette.stroke;
      shape.style.strokeWidth = index === 0 ? "2.5px" : "1.75px";
      shape.style.strokeLinejoin = "round";
    });
    node.querySelectorAll<SVGElement>("text, tspan, foreignObject, div").forEach((label) => {
      label.style.color = index === 0 ? palette.rootText : palette.text;
      label.style.fill = index === 0 ? palette.rootText : palette.text;
      label.style.fontWeight = index === 0 ? "800" : "650";
    });
  });

  svgElement.querySelectorAll<SVGElement>(".edgePath path, .flowchart-link, .edge-pattern-solid").forEach((edge) => {
    edge.style.stroke = palette.edge;
    edge.style.strokeWidth = "1.8px";
    edge.style.strokeLinecap = "round";
  });

  svgElement.querySelectorAll<SVGElement>("marker path").forEach((arrow) => {
    arrow.style.fill = palette.edge;
    arrow.style.stroke = palette.edge;
  });
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
  const displayChart = normalizedChart;

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
          theme: "base",
          themeVariables: getMermaidThemeVariables(theme),
          fontFamily: "Inter, system-ui, sans-serif",
          securityLevel: "strict",
          htmlLabels: false,
          flowchart: {
            curve: variant === 0 ? "basis" : variant === 1 ? "natural" : "stepAfter",
          },
        });

        const uniqueId = `mermaid-${Date.now()}-${currentRenderId}`;
        const { svg } = await mermaid.render(uniqueId, displayChart);

        if (currentRenderId === renderIdRef.current && containerRef.current) {
          const safeSvg = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
            FORBID_TAGS: ["a", "embed", "foreignObject", "iframe", "object", "script"],
            FORBID_ATTR: ["href", "xlink:href"],
            RETURN_DOM_FRAGMENT: true,
          });
          containerRef.current.replaceChildren(safeSvg);

          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            applyCoherentPalette(svgElement);
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
      <div className="mermaid-viewer-error">
        {error}
      </div>
    );
  }

  const viewer = (
    <div
      className={`mermaid-viewer mermaid-variant-${variant} animate-fade-in-up ${
        isOverlayOpen ? "mermaid-viewer--overlay" : ""
      }`}
    >
      {rendered && (
        <div className="mermaid-viewer__toolbar">
          <div className="mermaid-viewer__meta">
            <span className="mermaid-viewer__label">Mapa navegável</span>
            <span className="mermaid-viewer__zoom">Zoom {Math.round(zoom * 100)}%</span>
          </div>

          <div className="mermaid-viewer__controls">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="mermaid-viewer__control"
              aria-label="Diminuir zoom do mapa mental"
              title="Diminuir zoom"
            >
              <ZoomOut size={16} />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className="mermaid-viewer__control"
              aria-label="Restaurar zoom do mapa mental"
              title="Restaurar zoom"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="mermaid-viewer__control"
              aria-label="Aumentar zoom do mapa mental"
              title="Aumentar zoom"
            >
              <ZoomIn size={16} />
            </button>

            <button
              type="button"
              onClick={toggleOverlay}
              className="mermaid-viewer__control"
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
        className="mermaid-viewer__viewport"
      >
        <div ref={containerRef} className="mermaid-viewer__diagram" />
      </div>
    </div>
  );

  if (!isOverlayOpen) return viewer;

  return createPortal(
    <div
      className="mermaid-viewer-overlay"
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
