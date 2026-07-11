// =============================================================================
// Types: Database schema & JSON import format
// =============================================================================

/** Tipo atômico: alerta visual dentro de uma seção */
export interface Callout {
  type: 'warning' | 'info' | 'tip';
  title: string;
  text: string;
}

/** Tipo atômico: mnemônico para memorização */
export interface Mnemonic {
  key: string;
  meaning: string;
  description: string;
}

/** Tipo atômico: par pergunta/resposta */
export interface Flashcard {
  question: string;
  answer: string;
}

// =============================================================================
// Formato do JSON de importação (vindo do pipeline externo)
// =============================================================================

export interface SectionImport {
  section_id: string;
  title: string;
  content_markdown: string;
  callouts: Callout[];
  mnemonics: Mnemonic[];
  flashcards: Flashcard[];
  mermaid_mindmap: string;
}

export interface TopicImport {
  topic_id: string;
  discipline?: string;
  topic_title: string;
  sections: SectionImport[];
}

// =============================================================================
// Tipos que espelham as rows do banco (Supabase)
// =============================================================================

export interface TopicRow {
  topic_id: string;
  discipline: string;
  title: string;
  created_at: string;
}

export interface SectionRow {
  section_id: string;
  topic_id: string;
  title: string;
  content_markdown: string | null;
  callouts: Callout[];
  mnemonics: Mnemonic[];
  flashcards: Flashcard[];
  mermaid_mindmap: string | null;
  sort_order: number;
  created_at: string;
}

export interface UserProgress {
  user_id: string;
  section_id: string;
  completed: boolean;
  updated_at: string;
}

export interface UserNote {
  id?: string;
  user_id: string;
  section_id: string;
  content: string;
  updated_at: string;
}

// =============================================================================
// Tipos compostos para renderização no frontend
// =============================================================================

/** Um tópico completo com todas as suas seções (usado na page de estudo) */
export interface TopicWithSections extends TopicRow {
  sections: SectionRow[];
}

/** Uma seção com o progresso e notas do usuário atual */
export interface SectionWithUserData extends SectionRow {
  progress: UserProgress | null;
  note: UserNote | null;
}

/** Tema visual da aplicação */
export type Theme = 'light' | 'dark' | 'sepia';
