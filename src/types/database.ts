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
// Leitura restrita a assinatura ativa ou admin com AAL2.
// Escrita apenas via service role (admin).
// Sem user_id, sem isolamento pessoal.
// =============================================================================

export interface TopicRow {
  topic_id: string;
  discipline: string;
  title: string;
  sort_order: number | null;
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

/** Direito de acesso mantido exclusivamente pelo backend de pagamentos. */
export interface UserEntitlement {
  user_id: string;
  provider: string;
  provider_subscription_id: string | null;
  status: 'active' | 'trialing' | 'pending' | 'past_due' | 'canceled' | 'expired';
  access_until: string | null;
  provider_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TextHighlightColor =
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink'
  | 'purple'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'lime'
  | 'gray';

export interface UserTextHighlight {
  id: string;
  user_id: string;
  section_id: string;
  color: TextHighlightColor;
  start_offset: number;
  end_offset: number;
  selected_text: string;
  prefix: string;
  suffix: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// PRO Legis — acervo versionado e dados pessoais do primeiro corte
// =============================================================================

export type LawStatus = 'draft' | 'published' | 'archived';
export type LawVersionStatus = 'draft' | 'reviewed' | 'published' | 'rejected';
export type LegalFragmentType =
  | 'book'
  | 'title'
  | 'chapter'
  | 'section'
  | 'subsection'
  | 'article'
  | 'caput'
  | 'paragraph'
  | 'inciso'
  | 'alinea'
  | 'item';
export type LawReadingStatus = 'not_started' | 'reading' | 'read';

export interface LawRow {
  id: string;
  slug: string;
  acronym: string | null;
  name: string;
  law_type: string;
  jurisdiction: string;
  official_source_url: string;
  current_version_id: string | null;
  status: LawStatus;
  created_at: string;
  updated_at: string;
}

export interface LawVersionRow {
  id: string;
  law_id: string;
  version_label: string;
  effective_from: string | null;
  effective_until: string | null;
  source_url: string;
  raw_source_hash: string;
  canonicalization: string;
  canonical_content_hash: string;
  checked_at: string;
  coverage: Record<string, unknown>;
  status: LawVersionStatus;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_by: string | null;
  published_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalFragmentRow {
  id: string;
  law_version_id: string;
  stable_key: string;
  parent_id: string | null;
  fragment_type: LegalFragmentType;
  reference: string;
  order_index: number;
  official_text: string | null;
  normalized_text: string | null;
  created_at: string;
}

export interface TopicLegalFragmentRelationRow {
  topic_id: string;
  section_id: string | null;
  legal_fragment_id: string;
  relation_type: 'primary' | 'related' | 'reference';
  relevance: number | null;
  editorial_note: string | null;
  created_at: string;
}

export interface LawFlashcardRow {
  id: string;
  legal_fragment_id: string;
  card_type: 'true_false';
  statement_markdown: string;
  correct_answer: boolean;
  explanation_markdown: string;
  content_hash: string;
  status: LawVersionStatus;
  created_at: string;
  updated_at: string;
}

export interface UserLawProgressRow {
  user_id: string;
  legal_fragment_id: string;
  reading_status: LawReadingStatus;
  first_opened_at: string | null;
  last_opened_at: string | null;
  read_at: string | null;
  updated_at: string;
}

export interface UserLawFlashcardAnswerRow {
  id: string;
  user_id: string;
  law_flashcard_id: string;
  selected_answer: boolean;
  is_correct: boolean;
  answered_at: string;
}

export interface UserLegalNoteRow {
  id: string;
  user_id: string;
  legal_fragment_id: string;
  content: string;
  created_at: string;
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
