# Plano de projeto — módulo Questões

Atualizado em: 27 de setembro de 2026.

Status: **Fase 1 iniciada em branch própria; migration e tipos implementados, ainda não aplicados ao banco remoto**.

## Progresso de implementação

| Frente | Estado |
|---|---|
| Decisões de arquitetura | Concluída |
| Migration aditiva e backfill | Implementada; aplicação pendente |
| RLS e RPCs fundamentais | Implementadas; pgTAP local pendente por ausência de Docker |
| Tipos TypeScript | Implementados |
| Testes estáticos de segurança | 6/6 aprovados |
| UI, importador e comentários operacionais | Não iniciados |

## 1. Resumo executivo

Criar um módulo de resolução de questões dentro do PRO Resumos, integrado à autenticação, ao entitlement e aos temas existentes. O primeiro corte deve privilegiar tempo de resposta, clareza e baixo custo operacional.

Recomendação: implementar um **MVP relacional no Supabase/PostgreSQL**, sem nova biblioteca, sem busca externa, sem atualização em tempo real e sem gráficos pesados. A interface deve usar Server Components para leitura inicial e pequenos Client Components apenas para resposta, filtros, ocultação e comentários.

O MVP deve entregar:

- questões de múltipla escolha e Certo/Errado;
- comentário didático editorial exibido após a resposta;
- comentários de usuários com moderação e denúncia;
- filtros por texto e metadados;
- paginação por cursor;
- estatísticas pessoais;
- “não mostrar mais esta questão”, reversível;
- caderno de erros e filtro por respondida/correta/incorreta;
- funcionamento nos temas Light, Dark e Sepia e em mobile.

## 2. Objetivos

- permitir estudo por questões sem sair do ecossistema PRO;
- oferecer resposta imediata e explicação didática revisada;
- ajudar o usuário a localizar padrões de erro por disciplina e período;
- permitir discussão útil sem transformar a página em uma rede social pesada;
- manter o módulo rápido mesmo com crescimento do acervo e das tentativas;
- preservar autenticação, entitlement, RLS e isolamento entre usuários.

## 3. Fora do escopo do MVP

- ranking público, gamificação, pontos e competição entre usuários;
- chat, mensagens privadas, notificações em tempo real ou presença online;
- comentários com imagens, anexos, HTML ou Markdown bruto;
- busca semântica por embeddings ou serviço externo;
- geração automática e publicação direta de questões por IA;
- simulados com cronômetro, edital completo e nota de corte;
- aplicativo offline;
- recomendação adaptativa por IA;
- estatísticas públicas de outros usuários;
- importação integrada ao PYGEM, LEIAUT ou QPYGEM no primeiro corte.

Esses itens podem ser avaliados depois de medir uso, volume e gargalos reais.

## 4. Alternativas arquiteturais

| Alternativa | Vantagens | Desvantagens | Decisão |
|---|---|---|---|
| A. Supabase/PostgreSQL integrado | Reutiliza autenticação, RLS, entitlement, deploy e operação atuais; menor custo e menor complexidade | Exige índices, RPCs e políticas bem desenhadas | **Aprovada para o MVP** |
| B. Supabase + agregações persistidas desde o início | Estatísticas muito rápidas em grande volume | Mais triggers, concorrência, reconciliação e custo de manutenção antes de haver escala | Adiar até métricas indicarem necessidade |
| C. Serviço externo de busca, comentários ou analytics | Recursos sofisticados prontos | Nova dependência, custo, privacidade, sincronização e mais pontos de falha | Não usar no MVP |
| D. Questões e tentativas em JSONB | Implementação inicial aparentemente curta | Filtros, integridade, RLS, índices e estatísticas ficam piores | Rejeitada |

### Alternativas de experiência

1. **Lista paginada com uma questão por vez — aprovada:** menor payload, foco no estudo e boa experiência mobile.
2. Lista com 10–20 cartões abertos: navegação rápida, mas aumenta DOM, payload e risco de carregar comentários desnecessários.
3. Simulado fechado: útil no futuro, porém adiciona sessões, cronômetro, abandono, retomada e regras de correção.

### Alternativas para comentários de usuários

1. **Discussão pseudônima, textual e carregada sob demanda — aprovada:** protege e-mail/nome real e reduz custo.
2. Nome público configurável: melhora identidade da conversa, mas exige perfil público, validação, denúncia e gestão de privacidade.
3. Comentários sem identidade estável: mais simples, mas prejudica confiança e moderação.

No MVP, cada usuário deve receber um pseudônimo estável e não reversível na interface, sem expor e-mail, UUID ou metadata de autenticação.

### Decisões confirmadas em 27 de setembro de 2026

- Supabase/PostgreSQL integrado;
- uma questão por vez, com paginação por cursor;
- discussão pseudônima, textual e carregada sob demanda;
- disciplinas e tópicos relacionados vinculados às questões por metadados relacionais com identificadores estáveis.

## 5. Arquitetura proposta

```text
Página /dashboard/questoes (Server Component)
  ├─ valida sessão Google, entitlement e AAL2 para admin
  ├─ lê filtros validados da URL
  ├─ chama RPC de listagem paginada
  └─ entrega apenas a página atual ao componente interativo
       ├─ responder questão → RPC transacional
       ├─ ocultar/restaurar → Route Handler ou Server Action
       ├─ abrir comentário didático → resposta já autorizada
       └─ abrir discussão → busca paginada sob demanda

Página /dashboard/questoes/estatisticas (Server Component)
  └─ chama RPC agregada limitada ao auth.uid()
```

Princípios:

- leitura inicial no servidor;
- mutações pequenas e autenticadas;
- `user_id` sempre derivado da sessão, nunca do navegador;
- filtros representados na URL para permitir voltar, atualizar e compartilhar a seleção sem dados pessoais;
- nenhum `ORDER BY random()` em grandes conjuntos;
- comentários e explicações não entram no payload da lista quando fechados;
- nenhum estado global novo se estado local e URL resolverem;
- nenhuma dependência nova no MVP.

## 6. Modelo de dados proposto

Os nomes finais devem ser confirmados na migration e refletidos em `src/types/database.ts`.

### 6.1 Conteúdo editorial

#### `questions`

- `id UUID PRIMARY KEY`;
- `external_id TEXT UNIQUE NOT NULL` para importação idempotente;
- `question_type TEXT` com allowlist inicial `multiple_choice` e `true_false`;
- `statement_markdown TEXT NOT NULL`;
- `subject TEXT NOT NULL`;
- `exam_board TEXT`;
- `institution TEXT`;
- `position_name TEXT`;
- `exam_year SMALLINT` com limite válido;
- `difficulty TEXT` opcional com allowlist editorial;
- `source_reference TEXT`;
- `status TEXT` com `draft`, `published` e `archived`;
- `published_at`, `created_at`, `updated_at`;
- `search_document TSVECTOR` gerado a partir de enunciado e metadados.

Questões não devem ser apagadas fisicamente depois de receber tentativas. Arquivamento remove a questão de novas sessões e preserva histórico.

#### `disciplines`

- `id UUID PRIMARY KEY`;
- `slug TEXT UNIQUE NOT NULL`, estável e independente do nome exibido;
- `name TEXT UNIQUE NOT NULL`;
- `status TEXT` com `active` e `archived`;
- `created_at`, `updated_at`.

Esse catálogo passa a ser a identidade canônica de disciplina para o módulo. A criação é aditiva: o campo legado `topics.discipline` deve ser preservado durante a transição para não quebrar consultas existentes.

#### `topic_discipline_relations`

- `topic_id TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE RESTRICT`;
- `discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE RESTRICT`;
- `is_primary BOOLEAN NOT NULL DEFAULT false`;
- chave primária `(topic_id, discipline_id)`;
- índice único parcial que permita somente uma disciplina principal por tópico.

O conteúdo atual deve receber backfill a partir de `topics.discipline`, com relatório prévio de nomes divergentes. Nenhuma disciplina desconhecida deve ser criada silenciosamente por erro de digitação.

#### `question_discipline_relations`

- `question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT`;
- `discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE RESTRICT`;
- `is_primary BOOLEAN NOT NULL DEFAULT false`;
- `sort_order SMALLINT NOT NULL DEFAULT 0`;
- chave primária `(question_id, discipline_id)`;
- índice único parcial que permita somente uma disciplina principal por questão.

Toda questão publicada deve possuir pelo menos uma disciplina e exatamente uma disciplina principal. Uma questão interdisciplinar pode possuir relações secundárias.

#### `question_topic_relations`

- `question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT`;
- `topic_id TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE RESTRICT`;
- `relation_type TEXT` com `primary`, `related` e `reference`;
- `relevance SMALLINT` limitado de 1 a 100;
- `sort_order SMALLINT NOT NULL DEFAULT 0`;
- chave primária `(question_id, topic_id)`;
- índice único parcial que permita somente um tópico principal por questão.

Uma questão pode estar vinculada a zero ou mais tópicos, mas o importador deve exigir que todo tópico relacionado compartilhe ao menos uma disciplina vinculada à questão. Questões sem tópico continuam permitidas quando a disciplina existe, pois o acervo pode ainda não possuir resumo correspondente.

Os vínculos são metadados, não cópias do conteúdo. Renomear um tópico ou disciplina não muda a identidade da relação. Se um tópico for arquivado, a relação histórica permanece; ele deixa de ser oferecido como destino ativo e a interface não cria link quebrado.

#### `question_options`

- `id UUID PRIMARY KEY`;
- `question_id UUID NOT NULL`;
- `label TEXT NOT NULL`;
- `body_markdown TEXT NOT NULL`;
- `sort_order SMALLINT NOT NULL`;
- unicidade por `(question_id, label)` e `(question_id, sort_order)`.

#### `question_answer_keys`

- `question_id UUID PRIMARY KEY`;
- `correct_option_id UUID NOT NULL`;
- `updated_at` e `updated_by`.

O gabarito fica separado do conteúdo entregue na listagem. A tabela não terá leitura direta pelo papel `authenticated`; a correção ocorrerá em função controlada.

#### `question_explanations`

- `question_id UUID PRIMARY KEY`;
- `body_markdown TEXT NOT NULL`;
- `source_reference TEXT`;
- `status TEXT` com `draft`, `reviewed`, `published` e `rejected`;
- `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`.

O comentário didático é conteúdo editorial. IA pode produzir rascunho, mas publicação exige revisão humana. A explicação publicada só é retornada após o usuário responder ou quando um modo explícito de revisão permitir.

### 6.2 Dados pessoais de estudo

#### `user_question_attempts`

- `id UUID PRIMARY KEY`;
- `submission_id UUID NOT NULL`, único por usuário para tornar reenvios idempotentes;
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`;
- `question_id UUID NOT NULL`;
- `selected_option_id UUID NOT NULL`;
- `is_correct BOOLEAN NOT NULL`, calculado no backend;
- `answered_at TIMESTAMPTZ NOT NULL`;
- `duration_ms INTEGER` opcional e limitado.

Cada resposta cria uma tentativa; não se sobrescreve o histórico. A função de resposta valida se a alternativa pertence à questão, grava a tentativa e retorna correção e explicação na mesma transação.

#### `user_question_preferences`

- chave primária `(user_id, question_id)`;
- `hidden_at TIMESTAMPTZ`;
- `hidden_reason TEXT` opcional com allowlist curta;
- `marked_for_review_at TIMESTAMPTZ` opcional;
- `updated_at TIMESTAMPTZ NOT NULL`.

“Não mostrar mais” deve ser reversível em uma tela de questões ocultadas. A ocultação afeta apenas novas listas; histórico e estatísticas permanecem intactos.

### 6.3 Discussão entre usuários

#### `question_comment_aliases`

- `user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`;
- `alias TEXT UNIQUE NOT NULL`, gerado aleatoriamente no backend;
- `created_at TIMESTAMPTZ NOT NULL`.

O alias não pode ser escolhido pelo cliente nem derivado de nome, e-mail ou UUID exibível. A tabela permanece sem leitura direta para outros usuários; a consulta de comentários retorna somente o alias por função controlada.

#### `question_comments`

- `id UUID PRIMARY KEY`;
- `question_id UUID NOT NULL`;
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`;
- `parent_id UUID` opcional, limitado a um nível de resposta;
- `body TEXT NOT NULL`;
- `status TEXT` com `published`, `hidden_by_author`, `hidden_by_moderator` e `deleted`;
- `created_at`, `updated_at`, `edited_at`.

No MVP, comentário de usuário é **texto puro**, com limite de tamanho, sem links clicáveis automáticos, HTML, Markdown, imagens ou anexos.

#### `question_comment_reports`

- `id UUID PRIMARY KEY`;
- `comment_id UUID NOT NULL`;
- `reporter_user_id UUID NOT NULL`;
- `reason TEXT` com allowlist;
- `details TEXT` curto e opcional;
- `status TEXT` com `open`, `reviewed` e `dismissed`;
- `created_at`, `reviewed_at`, `reviewed_by`;
- unicidade por `(comment_id, reporter_user_id)`.

### 6.4 Índices mínimos

- GIN em `questions.search_document`;
- parcial em questões publicadas por `(subject, exam_year, id)`;
- `(discipline_id, question_id)` e `(question_id, discipline_id)` nas relações de disciplina;
- `(topic_id, question_id)` e `(question_id, topic_id)` nas relações de tópico;
- `(discipline_id, topic_id)` no vínculo entre tópicos e disciplinas;
- índices seletivos para `exam_board`, `institution` e `difficulty` somente após validar cardinalidade e planos de consulta;
- `(user_id, answered_at DESC)` em tentativas;
- `(user_id, question_id, answered_at DESC)` em tentativas;
- `(user_id, hidden_at, question_id)` em preferências;
- `(question_id, created_at DESC, id DESC)` em comentários publicados;
- `(status, created_at)` em denúncias abertas.

Evitar criar um índice para toda combinação de filtros. Usar `EXPLAIN (ANALYZE, BUFFERS)` com volume representativo antes de ampliar índices.

## 7. Contratos de backend

### 7.1 Listagem

Criar RPC ou função de consulta com:

- filtros normalizados e limitados;
- `limit` máximo de 20;
- cursor opaco baseado em ordenação estável, nunca offset profundo;
- exclusão padrão das questões ocultadas pelo usuário;
- retorno somente dos campos necessários e das alternativas, sem gabarito;
- retorno dos metadados mínimos de disciplinas e tópicos relacionados, com identificadores estáveis, nomes e estado navegável;
- contagem total opcional e separada, pois `COUNT(*)` a cada página pode ser caro;
- opção explícita para incluir ocultadas na tela de gerenciamento.

### 7.2 Resposta

`submit_question_answer(question_id, selected_option_id, duration_ms)` deve:

1. obter `auth.uid()` e validar entitlement;
2. confirmar que a questão está publicada e a alternativa pertence a ela;
3. localizar o gabarito sem expor a tabela;
4. inserir uma tentativa com `user_id` da sessão;
5. retornar `is_correct`, alternativa correta e comentário didático publicado;
6. nunca confiar em `is_correct`, `user_id` ou timestamps enviados pelo navegador.

### 7.3 Estatísticas

Uma RPC de leitura deve retornar, no primeiro corte:

- questões distintas respondidas;
- total de tentativas;
- acerto na primeira tentativa;
- acerto na tentativa mais recente;
- desempenho por disciplina;
- desempenho nos últimos 7 e 30 dias;
- quantidade disponível no caderno de erros;
- quantidade de questões ocultadas.

As métricas precisam de definições fixas na UI. “Taxa de acerto” nunca deve misturar primeira tentativa, última tentativa e todas as tentativas sem explicar qual está sendo exibida.

Para evitar dupla contagem em questões interdisciplinares, o painel principal agrega pela disciplina marcada como principal. Um relatório interdisciplinar futuro pode considerar todas as relações, mas deve informar que os totais por disciplina podem se sobrepor.

Começar com agregação SQL sobre índices. Adicionar tabela diária de rollup somente se telemetria ou `EXPLAIN` demonstrar lentidão real.

## 8. Busca e filtros

### Filtros do MVP

- texto livre no enunciado e metadados;
- disciplina;
- tópico relacionado;
- assunto;
- banca;
- instituição/órgão;
- cargo;
- ano;
- dificuldade editorial;
- não respondidas;
- respondidas;
- corretas na última tentativa;
- incorretas na última tentativa/caderno de erros;
- marcadas para revisão;
- incluir ou gerenciar ocultadas.

### Regras de desempenho

- debounce apenas no campo de texto; selects aplicam imediatamente;
- URL como fonte de verdade dos filtros;
- busca PostgreSQL em português com `websearch_to_tsquery` ou equivalente seguro;
- termos nunca concatenados em SQL;
- lista de facetas limitada e cacheável;
- filtros por disciplina e tópico usam as tabelas de relação, nunca comparação textual aproximada;
- não calcular contagens completas de todas as facetas a cada tecla;
- botão “Limpar filtros” e estado vazio explicativo;
- preservar filtros ao responder e ao voltar das estatísticas.

### Alternativas futuras

- `pg_trgm` para tolerância a erros de digitação, apenas se busca textual real demonstrar necessidade;
- busca semântica somente com caso de uso e orçamento aprovados;
- filtros por edital e prova após normalização dos metadados de origem.

## 9. Interface e experiência

### Tela principal

- cabeçalho compacto com busca e botão de filtros no mobile;
- painel lateral ou faixa recolhível no desktop;
- uma questão em foco;
- alternativas com alvo de toque confortável e navegação por teclado;
- botão responder desabilitado até escolher alternativa;
- feedback acessível sem depender apenas de cor;
- comentário didático após a correção;
- ações secundárias: comentar, marcar para revisão e não mostrar mais;
- metadados mostram disciplinas e tópicos relacionados; tópicos ativos oferecem link para o resumo correspondente;
- próximo item preserva os filtros atuais;
- skeleton curto somente onde evita salto de layout.

### Comentários

- fechados por padrão e carregados ao abrir;
- paginação por cursor;
- ordenação cronológica ou “mais úteis” apenas quando existir mecanismo auditável;
- um nível de resposta, sem árvore recursiva;
- editar o próprio comentário com indicação “editado”;
- exclusão lógica pelo autor;
- denúncia com motivo;
- estado moderado sem revelar conteúdo removido;
- pseudônimo, nunca e-mail ou UUID.

### Estatísticas

- números e barras simples com HTML/CSS no MVP;
- não carregar biblioteca de gráficos apenas para cartões básicos;
- explicar período, denominador e tipo de taxa de acerto;
- fornecer atalho para refazer erros;
- estado inicial útil para quem ainda não respondeu questões.

### Acessibilidade e temas

- foco visível, `fieldset`/`legend` e nomes acessíveis nas alternativas;
- anúncio de correção em região `aria-live` sem mover foco de forma inesperada;
- contraste verificável nos estados correta, incorreta, selecionada e desabilitada;
- suporte a teclado e `prefers-reduced-motion`;
- sem overflow em 320 px e 390 × 844;
- tokens de `src/app/globals.css`, sem cores inline hardcoded;
- validação nos temas Light, Dark e Sepia.

## 10. Segurança, privacidade e moderação

- todas as novas tabelas com RLS habilitada e privilégios mínimos;
- conteúdo publicado legível apenas por usuário com acesso ativo, como o acervo atual;
- dados pessoais limitados a `auth.uid()` em RLS e nas funções;
- tabela de comentários sem leitura ou escrita direta pela Data API; funções retornam somente campos públicos e o pseudônimo;
- teste negativo com dois usuários para tentativas, preferências, comentários próprios e denúncias;
- operações editoriais restritas ao backend administrativo; admin exige AAL2;
- funções `SECURITY DEFINER` com `search_path` vazio, privilégios revogados e entradas estritamente tipadas;
- validação Zod nos Route Handlers/Server Actions e constraints equivalentes no banco;
- verificação de mesma origem em mutações expostas por HTTP;
- limite de corpo e de frequência para resposta, comentário, edição e denúncia;
- comentários em texto puro renderizados por interpolação React;
- enunciado e comentário didático com `react-markdown`, sem `rehype-raw`, preservando transformação segura de URLs;
- nenhuma credencial, token, e-mail, UUID ou payload integral em logs;
- soft delete e trilha mínima de moderação;
- política de retenção e exclusão ligada à exclusão da conta;
- não usar conteúdo de comentários de usuários para treinar ou gerar material sem consentimento e política específica.

Limites iniciais sugeridos, a confirmar com testes:

- comentário: 2.000 caracteres;
- detalhe de denúncia: 500 caracteres;
- uma denúncia por usuário/comentário;
- no máximo 5 comentários por minuto e 50 por dia por usuário;
- `duration_ms` entre 0 e um teto defensivo;
- payload de listagem: até 20 questões.

## 11. Desempenho e orçamento técnico

Metas iniciais de engenharia, medidas com dados representativos:

- nenhuma nova dependência de runtime no MVP;
- até 20 questões por página, com paginação por cursor;
- comentários carregados somente sob demanda;
- nenhuma assinatura Supabase Realtime;
- nenhuma consulta `select *`;
- nenhuma ordenação aleatória sobre o acervo completo;
- consulta de listagem e RPC de resposta com plano indexado;
- p95 de banco abaixo de 150 ms para listagem e estatística no volume de teste;
- resposta do backend abaixo de 400 ms no ambiente de produção, excluída a rede do usuário;
- incremento de JavaScript cliente medido e justificado; componentes interativos divididos por função;
- imagens e anexos proibidos nos comentários do MVP.

Se as estatísticas ultrapassarem a meta, a evolução preferida é rollup diário incremental e reconciliável, não cache cliente nem duplicação ad hoc.

## 12. Importação e qualidade editorial

O importador deve ser uma etapa própria, não uma extensão improvisada de `POST /api/import` dos resumos.

Contrato sugerido:

- schema versionado;
- `external_id` estável;
- `discipline_slugs` com exatamente uma relação principal e relações secundárias opcionais;
- `topic_relations` com `topic_id`, tipo de relação, relevância e ordem;
- enunciado, alternativas, gabarito, metadados e explicação separados;
- validação de exatamente uma resposta correta no múltipla escolha;
- validação de duas opções no Certo/Errado;
- `dry-run` com contagens de criar, atualizar, arquivar e rejeitar;
- `dry-run` rejeita disciplina desconhecida, tópico inexistente, mais de uma relação principal ou tópico sem disciplina compatível;
- upsert idempotente;
- não publicar lote parcial quando uma questão falhar;
- questões importadas entram como `draft`;
- publicação e comentário didático exigem revisão humana;
- arquivo de origem nunca é sobrescrito;
- logs sem conteúdo integral nem dados pessoais.

No primeiro corte, priorizar importação administrativa por lote JSON validado. Integração com QPYGEM deve ser planejada depois que o contrato estiver estabilizado nos dois lados.

## 13. Fases de implementação

### Fase 0 — decisões e amostra real

- [x] Confirmar Supabase/PostgreSQL integrado.
- [x] Confirmar lista paginada com uma questão por vez.
- [x] Confirmar discussão pseudônima, textual e sob demanda.
- [ ] Confirmar formatos iniciais: múltipla escolha e Certo/Errado.
- [ ] Obter lote representativo e revisar qualidade dos metadados.
- [ ] Definir catálogo inicial de disciplinas e auditar divergências em `topics.discipline`.
- [ ] Confirmar detalhes operacionais da política de moderação e pseudônimo.
- [ ] Fixar definições das métricas.
- [ ] Ler a documentação local do Next.js 16.3.4 relevante a Server Components, Route Handlers, cache e APIs assíncronas.

Critério de saída: contrato funcional e amostra sem campos ambíguos.

### Fase 1 — schema, RLS e contratos

- [x] Criar migration aditiva com catálogo de disciplinas, relações de tópicos/questões, demais tabelas, constraints, índices e comentários.
- [ ] Executar aplicação e validar o backfill auditável de tópico–disciplina, preservando `topics.discipline`.
- [x] Criar políticas de conteúdo, tentativas, preferências, comentários e denúncias.
- [x] Criar funções de resposta, listagem, preferências e estatísticas com menor privilégio.
- [x] Atualizar `src/types/database.ts`.
- [x] Adicionar testes SQL/RLS com dois usuários; execução local pendente por ausência de Docker/PostgreSQL.

Critério de saída: nenhum usuário lê ou altera dados pessoais de outro; gabarito não é legível diretamente.

### Fase 2 — importação editorial

- [ ] Definir schema Zod versionado.
- [ ] Implementar `dry-run`, aplicação atômica e relatório.
- [ ] Importar pequeno lote como `draft`.
- [ ] Revisar e publicar amostra manualmente.

Critério de saída: reexecução do mesmo lote é idempotente e falha não publica conteúdo parcial.

### Fase 3 — resolução e ocultação

- [ ] Criar rota `/dashboard/questoes` protegida por acesso ao conteúdo.
- [ ] Implementar filtros básicos, cursor e cartão de questão.
- [ ] Implementar resposta transacional e feedback.
- [ ] Exibir comentário didático publicado.
- [ ] Implementar marcar para revisão, ocultar e restaurar.
- [ ] Adicionar navegação somente quando o fluxo estiver utilizável.

Critério de saída: usuário responde, recebe correção, avança e pode excluir/restaurar uma questão da própria lista.

### Fase 4 — estatísticas pessoais

- [ ] Criar visão/RPC de métricas.
- [ ] Implementar cartões e barras leves.
- [ ] Implementar caderno de erros e recorte de 7/30 dias.
- [ ] Documentar fórmulas na UI e em testes.

Critério de saída: valores batem com fixtures conhecidas, incluindo novas tentativas e repetição da mesma questão.

### Fase 5 — comentários e moderação

- [ ] Criar discussão sob demanda com cursor.
- [ ] Criar, editar e ocultar comentário próprio.
- [ ] Responder em um nível.
- [ ] Denunciar e moderar com conta admin AAL2.
- [ ] Aplicar limites de frequência e tamanho.

Critério de saída: abuso básico é limitado, conteúdo removido não reaparece e dados de identidade não vazam.

### Fase 6 — qualidade, segurança e desempenho

- [ ] Executar lint, tipos, testes, build e audit.
- [ ] Testar payloads maliciosos e busca adversarial.
- [ ] Procurar novos sinks inseguros.
- [ ] Medir planos SQL com volume representativo.
- [ ] Validar desktop/mobile e três temas.
- [ ] Validar teclado, leitor de tela básico e redução de movimento.

Critério de saída: matriz de aceite aprovada sem bloqueador crítico ou alto.

### Fase 7 — lançamento controlado

- [ ] Aplicar migration antes do código consumidor.
- [ ] Publicar lote pequeno revisado.
- [ ] Fazer smoke autenticado com usuário comum e admin AAL2.
- [ ] Monitorar erros, latência, denúncias e crescimento por sete dias.
- [ ] Só então ampliar o acervo.

Critério de saída: módulo estável com rollback documentado e sem violação de isolamento.

## 14. Estrutura de arquivos prevista

Estimativa, sujeita aos padrões encontrados no momento da implementação:

```text
src/app/dashboard/questoes/
  page.tsx
  loading.tsx
  question-browser.tsx
  estatisticas/page.tsx
  ocultadas/page.tsx
src/app/api/questions/
  answer/route.ts
  comments/route.ts
  comments/[commentId]/route.ts
  preferences/route.ts
src/components/questions/
  question-card.tsx
  question-filters.tsx
  question-explanation.tsx
  question-comments.tsx
  question-stats.tsx
src/lib/questions/
  schemas.ts
  queries.ts
  filters.ts
  aliases.ts
  metadata.ts
src/types/database.ts
supabase/migrations/029_create_questions_module.sql
tests/questions-*.test.mjs
scripts/questions-admin.mjs
```

Preferir Server Actions a Route Handlers quando a mutação for estritamente interna à página e o padrão local estiver consolidado. Preferir Route Handlers quando houver cliente administrativo/CLI ou contrato HTTP reutilizável. Não implementar os dois para a mesma operação sem necessidade.

## 15. Estratégia de testes

### Banco e autorização

- usuário A não lê tentativas, preferências, denúncias privadas ou comentários ocultos de B;
- usuário não altera `user_id`, `is_correct` ou gabarito;
- usuário sem entitlement não lê acervo nem explicações;
- admin sem AAL2 não modera nem publica;
- alternativa de outra questão é rejeitada;
- questão arquivada não entra em nova lista;
- ocultação afeta somente o dono.
- relação com disciplina ou tópico inexistente é rejeitada;
- tópico relacionado e questão compartilham ao menos uma disciplina;
- somente uma disciplina e um tópico podem ser principais por questão.

### Regras funcionais

- múltipla escolha e Certo/Errado;
- primeira versus última tentativa;
- repetição da mesma questão;
- caderno de erros;
- filtros combinados e limpeza;
- filtros e navegação por disciplina e tópico relacionados;
- cursor sem repetição nem perda no mesmo conjunto estável;
- ocultar, restaurar e marcar para revisão;
- comentário, edição, exclusão lógica, resposta e denúncia;
- lotes idempotentes e falha atômica.

### Segurança

- HTML, eventos, protocolos executáveis e Markdown bruto em campos de conteúdo;
- comentário com tags, links, Unicode de controle e tamanho excedido;
- SQL injection nos filtros e cursores adulterados;
- CSRF/mutações cross-origin;
- rate limit de comentário e denúncia;
- enum, UUID e cursor inválidos;
- busca por novos `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `javascript:` e `rehype-raw`.

### Interface

- 320 px, 390 × 844, tablet e desktop;
- Light, Dark e Sepia;
- teclado, foco, anúncio de correção e contraste;
- estados vazio, carregando, erro, sem comentário didático e sem comentários;
- sem overflow horizontal;
- latência simulada e duplo clique em responder.

### Comandos mínimos previstos

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:api-auth
npm.cmd run test:content
npm.cmd run test:rls-two-users
npm.cmd run build -- --webpack
npm.cmd audit --omit=dev
```

Adicionar scripts específicos de questões e executá-los junto a essa matriz.

## 16. Observabilidade sem invadir privacidade

Registrar apenas eventos técnicos agregáveis:

- listagem carregada e latência;
- resposta aceita/rejeitada por categoria de erro;
- comentário criado/limitado/denunciado;
- falhas de RPC e importação;
- quantidade agregada de questões respondidas, sem enunciado, alternativa, comentário, e-mail ou UUID em analytics.

Alertas mínimos:

- aumento de erros 5xx;
- p95 acima do orçamento;
- crescimento anormal de denúncias;
- falha de importação;
- divergência de rollup, caso ele seja criado no futuro.

## 17. Rollout e rollback

- migrations exclusivamente aditivas no primeiro lançamento;
- publicar schema antes da UI;
- manter link de navegação fora da versão pública até o smoke final;
- arquivar questões defeituosas em vez de excluir;
- rollback da UI não remove tabelas nem tentativas;
- não desfazer migration destrutivamente durante incidente;
- documentar como desabilitar o acesso ao módulo sem afetar Resumos e Legis;
- ampliar o lote somente após validar desempenho e moderação.

## 18. Critérios de aceite do MVP

- [ ] usuário autenticado e com acesso ativo consegue abrir o módulo;
- [ ] usuário sem acesso é redirecionado pelo fluxo atual;
- [ ] filtros combinados funcionam e permanecem na URL;
- [ ] cada questão publicada possui uma disciplina principal vinculada por identificador estável;
- [ ] questão pode se vincular a vários tópicos e disciplinas sem duplicar conteúdo;
- [ ] tópico ativo relacionado oferece navegação para o resumo e tópico arquivado não gera link quebrado;
- [ ] listagem usa cursor e não carrega gabarito;
- [ ] resposta é corrigida no backend e registrada uma única vez por envio;
- [ ] comentário didático publicado aparece após responder;
- [ ] usuário comenta, edita, oculta e denuncia dentro dos limites;
- [ ] nenhum nome real, e-mail ou UUID é exposto na discussão;
- [ ] estatísticas distinguem primeira e última tentativa;
- [ ] usuário oculta e restaura uma questão;
- [ ] RLS negativa com dois usuários passa;
- [ ] UI passa em mobile, desktop e nos três temas;
- [ ] lint, TypeScript, testes e build passam;
- [ ] busca e estatísticas atendem ao orçamento com volume representativo;
- [ ] nenhum conteúdo gerado por IA é publicado sem revisão humana;
- [ ] documentação operacional, migration e tipos permanecem sincronizados.

## 19. Riscos principais e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Gabarito exposto no payload | Alto | Tabela separada, privilégio revogado e correção por função |
| Vazamento entre usuários | Crítico | `auth.uid()`, RLS, filtros explícitos e teste negativo com dois usuários |
| XSS em questão/explicação/comentário | Alto | Sem HTML bruto; Markdown seguro; comentário em texto puro |
| Spam e assédio | Alto | Rate limit, denúncia, soft delete, moderação AAL2 e pseudônimo |
| Estatísticas caras | Médio | Índices, escopo por usuário, medição e rollup somente quando necessário |
| Busca lenta | Médio | `tsvector`, GIN, cursor e facetas limitadas |
| Metadados inconsistentes | Médio | Schema versionado, allowlists, amostra real e importação atômica |
| Divergência entre disciplina textual legada e catálogo canônico | Alto | Dry-run, backfill auditável, relações por UUID e preservação temporária do campo legado |
| Relação com tópico arquivado ou renomeado | Médio | Identidade por `topic_id`, `ON DELETE RESTRICT` e estado navegável calculado no backend |
| Questões juridicamente incorretas | Alto | Draft, fonte, revisão humana e arquivamento auditável |
| Crescimento de tentativas | Médio | Índices por usuário/data, retenção definida e monitoramento de volume |
| Escopo crescer para simulado/rede social | Médio | Manter os itens fora do MVP e exigir decisão própria por fase |

## 20. Decisões recomendadas para iniciar sem bloqueio

- arquitetura A: Supabase integrado — **aprovada**;
- uma questão por vez — **aprovada**;
- múltipla escolha e Certo/Errado;
- discussão pseudônima em texto puro e sob demanda — **aprovada**;
- vínculos relacionais questão–disciplina e questão–tópico — **aprovados**;
- um nível de resposta;
- busca nativa do PostgreSQL;
- estatísticas sob demanda no MVP;
- barras HTML/CSS, sem biblioteca de gráficos na tela inicial;
- ocultação reversível;
- comentário didático editorial após resposta;
- importador administrativo próprio, versionado e atômico;
- nenhum Realtime, ranking, anexo, IA adaptativa ou serviço externo no MVP.

## 21. Próximos passos

1. Auditar os valores atuais de `topics.discipline` e propor o catálogo canônico sem alterar dados.
2. Auditar um lote real de questões para fechar o contrato de importação e os vínculos.
3. Produzir o desenho SQL detalhado e a matriz RLS antes de qualquer migration.
4. Implementar a Fase 1 em branch própria, com migration aditiva, backfill auditável e testes de dois usuários.
5. Só iniciar a UI depois de provar que gabarito, dados pessoais e identificadores internos não vazam pela Data API.
