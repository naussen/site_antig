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
// GRUPO B — Conteúdo editorial global (compartilhado entre todos os usuários)
// Leitura aberta para autenticados. Escrita apenas via service role (admin).
// Sem user_id, sem isolamento pessoal.
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

// =============================================================================
// GRUPO A — Dados pessoais do usuário (isolados por login, RLS obrigatório)
// Toda tabela deste grupo tem user_id NOT NULL e FK para auth.users(id).
// Toda leitura/escrita deve ser filtrada por session.user.id.
// =============================================================================

export interface UserProgress {
  user_id: string;
  section_id: string;
  completed: boolean;
  updated_at: string;
}

export interface UserNote {
  /** UUID gerado pelo Supabase (migration 004+). Obrigatório para delete. */
  id?: string;
  user_id: string;
  section_id: string;
  content: string;
  updated_at: string;
}

/** Preferências pessoais de exibição do Dashboard.
 *  visible_disciplines = null → mostra todas as disciplinas.
 *  visible_disciplines = string[] → restringe às selecionadas. */
export interface UserDashboardPreferences {
  user_id: string;
  visible_disciplines: string[] | null;
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
