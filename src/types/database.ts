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
  source?: {
    board: 'CESPE' | 'CEBRASPE' | 'FCC' | 'FGV';
    year: number;
    exam: string;
    question_id: string;
    status: 'valid';
  };
}

// =============================================================================
// Formato do JSON de importação (vindo do pipeline externo)
// =============================================================================

export interface SectionImport {
  section_id: string;
  /** UUID permanente; ausente somente em payloads legados durante a transição. */
  content_unit_id?: string;
  /** Chave semântica permanente e única dentro do tópico. */
  stable_key?: string;
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
  archived_at: string | null;
  archived_by: string | null;
  archived_reason: string | null;
}

export interface TopicIdRedirectRow {
  old_topic_id: string;
  new_topic_id: string;
  created_at: string;
}

export interface SectionRow {
  section_id: string;
  content_unit_id: string;
  stable_key: string;
  topic_id: string;
  title: string;
  content_markdown: string | null;
  callouts: Callout[];
  mnemonics: Mnemonic[];
  flashcards: Flashcard[];
  mermaid_mindmap: string | null;
  sort_order: number;
  current_revision_id: string | null;
  created_at: string;
  archived_at: string | null;
  archived_by: string | null;
  archived_reason: string | null;
}

export type ContentChangeOperation =
  | 'replace'
  | 'split'
  | 'merge'
  | 'archive'
  | 'restore';

export interface ContentChangeManifestRow {
  id: string;
  topic_id: string;
  import_run_id: string | null;
  operation: ContentChangeOperation;
  manifest: Record<string, unknown>;
  manifest_hash: string;
  created_by: string | null;
  created_at: string;
}

export interface ContentUnitRevisionRow {
  id: string;
  content_unit_id: string;
  revision_number: number;
  stable_key: string;
  title: string;
  content_markdown: string | null;
  callouts: Callout[];
  mnemonics: Mnemonic[];
  flashcards: Flashcard[];
  mermaid_mindmap: string | null;
  sort_order: number;
  content_hash: string;
  change_manifest_id: string | null;
  created_by: string | null;
  created_at: string;
}

// =============================================================================
// Módulo Questões — conteúdo editorial e metadados relacionais
// =============================================================================

export type DisciplineStatus = 'active' | 'archived';
export type QuestionType = 'multiple_choice' | 'true_false';
export type QuestionStatus = 'draft' | 'published' | 'archived';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionTopicRelationType = 'primary' | 'related' | 'reference';
export type QuestionExplanationStatus =
  | 'draft'
  | 'reviewed'
  | 'published'
  | 'rejected';

export interface DisciplineRow {
  id: string;
  slug: string;
  name: string;
  status: DisciplineStatus;
  created_at: string;
  updated_at: string;
}

export interface TopicDisciplineRelationRow {
  topic_id: string;
  discipline_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  external_id: string;
  question_type: QuestionType;
  statement_markdown: string;
  subject: string;
  exam_board: string | null;
  institution: string | null;
  position_name: string | null;
  exam_year: number | null;
  difficulty: QuestionDifficulty | null;
  source_reference: string | null;
  status: QuestionStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionDisciplineRelationRow {
  question_id: string;
  discipline_id: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface QuestionTopicRelationRow {
  question_id: string;
  topic_id: string;
  relation_type: QuestionTopicRelationType;
  relevance: number;
  sort_order: number;
  created_at: string;
}

export interface QuestionOptionRow {
  id: string;
  question_id: string;
  label: string;
  body_markdown: string;
  sort_order: number;
  created_at: string;
}

export interface QuestionAnswerKeyRow {
  question_id: string;
  correct_option_id: string;
  updated_by: string | null;
  updated_at: string;
}

export interface QuestionExplanationRow {
  question_id: string;
  body_markdown: string;
  source_reference: string | null;
  status: QuestionExplanationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// GRUPO A — Dados pessoais do usuário (isolados por login, RLS obrigatório)
// Toda tabela deste grupo tem user_id NOT NULL e FK para auth.users(id).
// Toda leitura/escrita deve ser filtrada por session.user.id.
// =============================================================================

export interface UserProgress {
  user_id: string;
  section_id: string;
  content_unit_id: string;
  completed: boolean;
  updated_at: string;
}

export interface UserNote {
  /** UUID gerado pelo Supabase (migration 004+). Obrigatório para delete. */
  id?: string;
  user_id: string;
  section_id: string;
  content_unit_id: string;
  content: string;
  updated_at: string;
}

/** Preferências pessoais de exibição do Dashboard.
 *  visible_disciplines = null → mostra todas as disciplinas.
 *  visible_disciplines = string[] → restringe às selecionadas. */
export interface UserDashboardPreferences {
  user_id: string;
  visible_disciplines: string[] | null;
  start_module: 'resumos' | 'legis' | 'notas' | 'configuracoes';
  start_discipline: string | null;
  theme: Theme;
  updated_at: string;
}

export interface StudyPlanRow {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  weeks_count: number;
  day_start_minute: number;
  day_end_minute: number;
  slot_minutes: 15 | 30 | 60;
  timezone: 'America/Sao_Paulo';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudyPlanItemRow {
  id: string;
  plan_id: string;
  user_id: string;
  discipline: string;
  study_date: string;
  start_minute: number;
  end_minute: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserNoteImage {
  id: string;
  user_id: string;
  storage_path: string;
  created_at: string;
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

export interface PaymentProviderTransaction {
  provider: 'mercado_pago' | 'paypal';
  transaction_id: string;
  provider_subscription_id: string;
  user_id: string;
  status: string;
  amount: number | null;
  currency: string | null;
  provider_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAccessBlock {
  id: string;
  user_id: string;
  provider: 'mercado_pago' | 'paypal';
  provider_subscription_id: string;
  resource_id: string;
  reason: 'refund' | 'chargeback' | 'reversal';
  provider_updated_at: string;
  active: boolean;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
}

export interface PaymentAuditEvent {
  id: string;
  action: 'checkout_created' | 'checkout_failed' | 'cancellation_confirmed' | 'cancellation_failed';
  outcome: 'success' | 'failure';
  provider: 'mercado_pago' | 'paypal';
  user_id: string | null;
  provider_subscription_id: string | null;
  reason_code: string | null;
  created_at: string;
}

export interface PrivacyRequest {
  id: string;
  user_id: string | null;
  contact_email: string;
  request_type: 'access' | 'correction' | 'deletion' | 'portability' | 'information' | 'other';
  message: string;
  status: 'received' | 'in_review' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export type QuestionHiddenReason =
  | 'not_relevant'
  | 'outdated'
  | 'repeated'
  | 'other';
export type QuestionCommentStatus =
  | 'published'
  | 'hidden_by_author'
  | 'hidden_by_moderator'
  | 'deleted';
export type QuestionCommentReportReason =
  | 'spam'
  | 'abuse'
  | 'personal_data'
  | 'incorrect_content'
  | 'other';
export type QuestionCommentReportStatus = 'open' | 'reviewed' | 'dismissed';

export interface UserQuestionAttemptRow {
  id: string;
  submission_id: string;
  user_id: string;
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  duration_ms: number | null;
  answered_at: string;
}

export interface UserQuestionPreferenceRow {
  user_id: string;
  question_id: string;
  hidden_at: string | null;
  hidden_reason: QuestionHiddenReason | null;
  marked_for_review_at: string | null;
  updated_at: string;
}

export interface QuestionCommentAliasRow {
  user_id: string;
  alias: string;
  created_at: string;
}

export interface QuestionCommentRow {
  id: string;
  question_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  status: QuestionCommentStatus;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
}

export interface QuestionCommentReportRow {
  id: string;
  comment_id: string;
  reporter_user_id: string;
  reason: QuestionCommentReportReason;
  details: string | null;
  status: QuestionCommentReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface QuestionListOption {
  id: string;
  label: string;
  body_markdown: string;
  sort_order: number;
}

export interface QuestionListDiscipline {
  slug: string;
  name: string;
  is_primary: boolean;
}

export interface QuestionListTopic {
  topic_id: string;
  title: string;
  relation_type: QuestionTopicRelationType;
  is_navigable: boolean;
}

export interface QuestionListItem {
  id: string;
  external_id: string;
  question_type: QuestionType;
  statement_markdown: string;
  subject: string;
  exam_board: string | null;
  institution: string | null;
  position_name: string | null;
  exam_year: number | null;
  difficulty: QuestionDifficulty | null;
  source_reference: string | null;
  options: QuestionListOption[];
  disciplines: QuestionListDiscipline[];
  topics: QuestionListTopic[];
  latest_attempt: {
    is_correct: boolean;
    answered_at: string;
  } | null;
  preference: {
    hidden: boolean;
    marked_for_review: boolean;
  } | null;
}

export interface QuestionListResult {
  items: QuestionListItem[];
  next_cursor: string | null;
}

export interface QuestionAnswerResult {
  attempt_id: string;
  is_correct: boolean;
  correct_option_id: string;
  explanation_markdown: string;
  answered_at: string;
  replayed: boolean;
}

export interface QuestionDisciplineStats {
  slug: string;
  name: string;
  answered_questions: number;
  latest_correct: number;
}

export interface QuestionStatsResult {
  total_attempts: number;
  answered_questions: number;
  first_correct: number;
  latest_correct: number;
  error_notebook_count: number;
  attempts_7d: number;
  correct_7d: number;
  attempts_30d: number;
  correct_30d: number;
  hidden_questions: number;
  by_discipline: QuestionDisciplineStats[];
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

export type TextHighlightMigrationStatus =
  | 'active'
  | 'migrated'
  | 'orphaned'
  | 'needs_review';

export interface UserTextHighlight {
  id: string;
  user_id: string;
  section_id: string;
  content_unit_id: string;
  content_revision_id: string | null;
  migration_status: TextHighlightMigrationStatus;
  anchor_context: Record<string, unknown>;
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
