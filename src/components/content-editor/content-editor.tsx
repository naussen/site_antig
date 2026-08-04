"use client";

import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Bold,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileJson,
  Heading3,
  List,
  ListOrdered,
  PencilLine,
  Quote,
  RotateCcw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { MarkdownViewer } from "@/components/study/markdown-viewer";
import {
  EditableSection,
  EditableTopic,
  getRevisedFileName,
  parseEditableTopicJson,
  serializeEditableTopic,
  validateEditableTopic,
} from "@/lib/content-editor";

type EditorMode = "edit" | "preview" | "split";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function cloneTopic(topic: EditableTopic): EditableTopic {
  return JSON.parse(JSON.stringify(topic)) as EditableTopic;
}

function countMarkdownHeadings(markdown: string) {
  return (markdown.match(/^#{2,6}\s+\S.*$/gm) ?? []).length;
}

function ResourceSummary({ section }: { section: EditableSection }) {
  const resources = [
    ["Callouts", section.callouts.length],
    ["Mnemônicos", section.mnemonics.length],
    ["Flashcards", section.flashcards.length],
    ["Mermaid", section.mermaid_mindmap.trim() ? 1 : 0],
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {resources.map(([label, count]) => (
        <span
          key={label}
          className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
          style={{
            borderColor: "var(--border)",
            background: count ? "var(--accent-soft)" : "var(--bg-secondary)",
            color: count ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {label}: {count}
        </span>
      ))}
    </div>
  );
}

export function ContentEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [topic, setTopic] = useState<EditableTopic | null>(null);
  const [originalTopic, setOriginalTopic] = useState<EditableTopic | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<EditorMode>("split");
  const [dirty, setDirty] = useState(false);
  const [changedSectionIds, setChangedSectionIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedIndex = topic?.sections.findIndex(
    (section) => section.section_id === selectedSectionId
  ) ?? -1;
  const selectedSection = selectedIndex >= 0 ? topic?.sections[selectedIndex] : undefined;

  const validation = useMemo(
    () => topic ? validateEditableTopic(topic) : null,
    [topic]
  );

  const filteredSections = useMemo(() => {
    if (!topic) return [];
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return topic.sections;

    return topic.sections.filter((section) =>
      `${section.title} ${section.section_id}`.toLocaleLowerCase("pt-BR").includes(query)
    );
  }, [search, topic]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (dirty && !window.confirm("Abrir outro arquivo e descartar as alterações não baixadas?")) {
      return;
    }

    setError(null);
    setNotice(null);

    if (!file.name.toLocaleLowerCase("pt-BR").endsWith(".json")) {
      setError("Selecione um arquivo com extensão .json.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("O arquivo excede o limite seguro de 20 MB para edição no navegador.");
      return;
    }

    const parsed = parseEditableTopicJson(await file.text());
    if (!parsed.success) {
      setError(parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join(" "));
      return;
    }

    const nextTopic = cloneTopic(parsed.data);
    setTopic(nextTopic);
    setOriginalTopic(cloneTopic(nextTopic));
    setSourceName(file.name);
    setSelectedSectionId(nextTopic.sections[0]?.section_id ?? "");
    setSearch("");
    setDirty(false);
    setChangedSectionIds(new Set());
    setNotice(`${file.name} carregado com ${nextTopic.sections.length} seções.`);
  };

  const updateTopicField = (field: "topic_title" | "discipline", value: string) => {
    setTopic((current) => current ? { ...current, [field]: value } : current);
    setDirty(true);
    setNotice(null);
  };

  const updateSelectedSection = (
    field: "title" | "content_markdown",
    value: string,
  ) => {
    if (!topic || selectedIndex < 0) return;

    setTopic((current) => {
      if (!current) return current;
      const sections = [...current.sections];
      sections[selectedIndex] = { ...sections[selectedIndex], [field]: value };
      return { ...current, sections };
    });
    setChangedSectionIds((current) => new Set(current).add(selectedSectionId));
    setDirty(true);
    setNotice(null);
  };

  const insertMarkdown = (before: string, after = "", placeholder = "texto") => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedSection) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = selectedSection.content_markdown.slice(start, end) || placeholder;
    const insertion = `${before}${selectedText}${after}`;
    const nextValue =
      selectedSection.content_markdown.slice(0, start)
      + insertion
      + selectedSection.content_markdown.slice(end);

    updateSelectedSection("content_markdown", nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    });
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab" || !selectedSection) return;
    event.preventDefault();
    insertMarkdown("  ", "", "");
  };

  const restoreOriginal = () => {
    if (!originalTopic) return;
    if (dirty && !window.confirm("Descartar todas as alterações e restaurar o arquivo original?")) return;

    const restored = cloneTopic(originalTopic);
    setTopic(restored);
    setSelectedSectionId(restored.sections[0]?.section_id ?? "");
    setDirty(false);
    setChangedSectionIds(new Set());
    setNotice("Arquivo original restaurado.");
    setError(null);
  };

  const closeDocument = () => {
    if (dirty && !window.confirm("Fechar o arquivo e descartar as alterações não baixadas?")) return;
    setTopic(null);
    setOriginalTopic(null);
    setSourceName("");
    setSelectedSectionId("");
    setSearch("");
    setDirty(false);
    setChangedSectionIds(new Set());
    setNotice(null);
    setError(null);
  };

  const downloadDocument = () => {
    if (!topic) return;
    const result = validateEditableTopic(topic);
    if (!result.success) {
      setError(
        `Corrija os problemas antes de baixar: ${result.issues
          .slice(0, 5)
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join(" ")}`
      );
      return;
    }

    const blob = new Blob([serializeEditableTopic(result.data)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = getRevisedFileName(sourceName);
    anchor.click();
    URL.revokeObjectURL(url);
    setDirty(false);
    setNotice(`${anchor.download} baixado e pronto para a pré-visualização da importação.`);
    setError(null);
  };

  if (!topic) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 md:px-10 md:py-10" style={{ background: "var(--bg-primary)" }}>
        <div className="mx-auto max-w-5xl">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
              Ferramenta de pré-importação
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Editor visual de conteúdo
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              Revise títulos, subtítulos e Markdown antes de importar. O arquivo permanece somente neste navegador e nenhuma alteração é enviada ao Supabase.
            </p>
          </header>

          <section
            className="mt-8 rounded-3xl border border-dashed p-6 text-center sm:p-12"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-strong)" }}
          >
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <FileJson size={30} />
            </span>
            <h2 className="mt-6 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Abra o JSON produzido pelo LEIAUT
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              O editor aceita o contrato do site, preserva recursos didáticos e gera uma nova cópia com o sufixo <code>_revisado.json</code>.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--action)", color: "var(--action-foreground)" }}
            >
              <Upload size={18} />
              Selecionar arquivo JSON
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={loadFile} />
            <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>Limite: 20 MB.</p>
          </section>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm" style={{ background: "var(--callout-warning-bg)", borderColor: "var(--callout-warning-border)", color: "var(--callout-warning-text)" }} role="alert">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-5 md:py-6" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-[1600px]">
        <header className="rounded-2xl border p-4 sm:p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>
                <PencilLine size={15} />
                Editor visual
              </div>
              <h1 className="mt-1 truncate text-xl font-extrabold sm:text-2xl" style={{ color: "var(--text-primary)" }}>{topic.topic_title}</h1>
              <p className="mt-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>{sourceName} · {topic.sections.length} seções</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={restoreOriginal} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <RotateCcw size={16} /> Restaurar
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <Upload size={16} /> Abrir outro
              </button>
              <button type="button" onClick={downloadDocument} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold" style={{ background: "var(--action)", color: "var(--action-foreground)" }}>
                <Download size={16} /> Baixar revisado
              </button>
              <button type="button" onClick={closeDocument} className="grid h-10 w-10 place-items-center rounded-xl border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} aria-label="Fechar arquivo">
                <X size={18} />
              </button>
              <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={loadFile} />
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)_minmax(240px,0.55fr)]" style={{ borderColor: "var(--border)" }}>
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Título do material
              <input value={topic.topic_title} onChange={(event) => updateTopicField("topic_title", event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none focus:border-[var(--accent)]" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            </label>
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              Disciplina
              <input value={topic.discipline} onChange={(event) => updateTopicField("discipline", event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            </label>
            <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              ID técnico — somente leitura
              <input value={topic.topic_id} readOnly className="mt-1.5 w-full cursor-not-allowed rounded-xl border px-3 py-2.5 font-mono text-xs opacity-70" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }} />
            </label>
          </div>
        </header>

        {(error || notice) && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm" style={{ background: error ? "var(--callout-warning-bg)" : "var(--callout-tip-bg)", borderColor: error ? "var(--callout-warning-border)" : "var(--callout-tip-border)", color: error ? "var(--callout-warning-text)" : "var(--callout-tip-text)" }} role={error ? "alert" : "status"}>
            {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            <p>{error ?? notice}</p>
          </div>
        )}

        <div className="mt-3 grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border p-3 xl:sticky xl:top-3 xl:h-[calc(100vh-1.5rem)]" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar seção..." className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            </div>
            <div className="mt-3 flex items-center justify-between px-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span>{filteredSections.length} de {topic.sections.length}</span>
              <span>{changedSectionIds.size} editadas</span>
            </div>
            <nav className="mt-2 max-h-[42vh] space-y-1 overflow-y-auto pr-1 xl:max-h-[calc(100vh-9rem)]" aria-label="Seções do arquivo">
              {filteredSections.map((section) => {
                const index = topic.sections.findIndex((item) => item.section_id === section.section_id);
                const active = section.section_id === selectedSectionId;
                return (
                  <button key={section.section_id} type="button" onClick={() => setSelectedSectionId(section.section_id)} className="flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors" style={{ background: active ? "var(--accent-soft)" : "transparent", borderColor: active ? "var(--accent)" : "transparent", color: active ? "var(--accent)" : "var(--text-secondary)" }}>
                    <span className="mt-0.5 w-6 shrink-0 text-[10px] font-bold">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">{section.title || "Sem título"}</span>
                    {changedSectionIds.has(section.section_id) && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent)" }} aria-label="Seção alterada" />}
                    {active && <ChevronRight size={14} className="mt-0.5 shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {selectedSection && (
            <section className="min-w-0 rounded-2xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <label className="min-w-0 flex-1 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                    Título da seção
                    <input value={selectedSection.title} onChange={(event) => updateSelectedSection("title", event.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-base font-bold outline-none focus:border-[var(--accent)]" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                  </label>
                  <div className="flex rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }} role="group" aria-label="Modo de visualização">
                    {([
                      ["edit", PencilLine, "Editar"],
                      ["preview", Eye, "Visualizar"],
                      ["split", FileJson, "Lado a lado"],
                    ] as const).map(([value, Icon, label]) => (
                      <button key={value} type="button" onClick={() => setMode(value)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold" style={{ background: mode === value ? "var(--accent-soft)" : "transparent", color: mode === value ? "var(--accent)" : "var(--text-muted)" }} aria-pressed={mode === value}>
                        <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <ResourceSummary section={selectedSection} />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {selectedSection.content_markdown.length.toLocaleString("pt-BR")} caracteres · {countMarkdownHeadings(selectedSection.content_markdown)} subtítulos
                  </span>
                </div>
              </div>

              <div className={`grid min-w-0 ${mode === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                {mode !== "preview" && (
                  <div className={`min-w-0 p-3 sm:p-4 ${mode === "split" ? "lg:border-r" : ""}`} style={{ borderColor: "var(--border)" }}>
                    <div className="mb-2 flex flex-wrap gap-1.5" role="toolbar" aria-label="Formatação Markdown">
                      <button type="button" onClick={() => insertMarkdown("\n### ", "\n\n", "Novo subtítulo")} className="rounded-lg border p-2" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }} title="Inserir subtítulo"><Heading3 size={16} /></button>
                      <button type="button" onClick={() => insertMarkdown("**", "**", "texto em destaque")} className="rounded-lg border p-2" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }} title="Negrito"><Bold size={16} /></button>
                      <button type="button" onClick={() => insertMarkdown("\n- ", "", "item da lista")} className="rounded-lg border p-2" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }} title="Lista"><List size={16} /></button>
                      <button type="button" onClick={() => insertMarkdown("\n1. ", "", "item numerado")} className="rounded-lg border p-2" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }} title="Lista numerada"><ListOrdered size={16} /></button>
                      <button type="button" onClick={() => insertMarkdown("\n> ", "", "citação")} className="rounded-lg border p-2" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }} title="Citação"><Quote size={16} /></button>
                    </div>
                    <textarea ref={textareaRef} value={selectedSection.content_markdown} onChange={(event) => updateSelectedSection("content_markdown", event.target.value)} onKeyDown={handleTextareaKeyDown} spellCheck lang="pt-BR" className="min-h-[58vh] w-full resize-y rounded-xl border p-4 font-mono text-[13px] leading-6 outline-none focus:border-[var(--accent)]" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)", tabSize: 2 }} aria-label={`Conteúdo Markdown de ${selectedSection.title}`} />
                  </div>
                )}

                {mode !== "edit" && (
                  <div className="min-w-0 p-4 sm:p-6">
                    <div className="mb-4 flex items-center gap-2 border-b pb-3 text-xs font-bold uppercase tracking-[0.12em]" style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
                      <Eye size={15} /> Pré-visualização
                    </div>
                    <div className="min-h-[58vh] overflow-x-auto rounded-xl border p-4 sm:p-6" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                      {selectedSection.content_markdown.trim() ? <MarkdownViewer content={selectedSection.content_markdown} /> : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Esta seção ainda não possui Markdown.</p>}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <footer className="mt-3 flex flex-col gap-2 rounded-xl border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <span>{dirty ? "Há alterações não baixadas." : "Arquivo sem alterações pendentes."}</span>
          <span style={{ color: validation?.success ? "var(--callout-tip-text)" : "var(--callout-warning-text)" }}>
            {validation?.success ? "Contrato de importação válido" : `${validation?.issues.length ?? 0} problema(s) de validação`}
          </span>
        </footer>
      </div>
    </main>
  );
}
