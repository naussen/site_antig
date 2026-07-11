# Próximos Passos — PRO Resumos

> Atualizado em 10/07/2026  
> Este documento é a **fonte única de verdade** para o estado atual e roadmap do site.  
> Regras de execução para agentes em `AGENTS.md`. Visão do ecossistema em `ECOSSISTEMA.md`.

## Estado atual consolidado

Concluído:

- Autenticação com Magic Link, senha e Google OAuth.
- Callback `/auth/callback`.
- Proteção server-side de rotas privadas.
- Dashboard com tópicos agrupados por disciplina.
- Página de estudo dinâmica por `topicId`.
- Markdown, callouts, flashcards, mnemônicos e Mermaid.
- Mermaid carregado somente no cliente.
- Sidebar de seções.
- Progresso por seção.
- Painel lateral de notas com auto-save.
- Painel central de notas em `/dashboard/notas`.
- Agrupamento de notas por disciplina real do tópico.
- Temas Light, Dark e Sepia.
- App Dock inferior com navegação, tema, logout e toggles de estudo.
- Importação por `POST /api/import` com validação Zod.
- Exclusão administrativa de tópicos por `DELETE /api/topics/[topicId]`.
- Exclusão administrativa de seções por `DELETE /api/sections/[sectionId]`.
- Migrations Supabase para schema, RLS, disciplina e múltiplas notas.

Pendente:

- Progresso nos cards do dashboard.
- Busca/filtro no dashboard.
- Tela de perfil/estatísticas.
- Automação de publicação PYGEM2 -> Site.
- Modo preview antes da importação definitiva.

## Prioridade 1 — Melhorias diretas no dashboard

### 1.1 Indicador de progresso nos cards

Objetivo: mostrar no card de cada tópico quantas seções foram concluídas pelo usuário atual.

Arquivo provável:

- `src/app/dashboard/page.tsx`

Possível abordagem:

1. Buscar tópicos com suas seções.
2. Buscar `user_progress` do usuário logado com `completed = true`.
3. Calcular `completedCount`, `totalSections` e percentual por tópico.
4. Renderizar uma barra discreta ou texto como `3/7 seções`.
5. Usar tokens de tema já existentes: `--progress-bar`, `--progress-bg`, `--accent`, `--text-muted`.

Cuidados:

- Manter `dashboard/page.tsx` como Server Component se possível.
- Não buscar dados de outro usuário.
- Tratar tópico sem seções.
- Não introduzir dependência nova.

Validação:

```powershell
npm run lint
npm run build
```

Teste manual:

- abrir `/dashboard`;
- marcar/desmarcar progresso em uma página de estudo;
- recarregar dashboard;
- confirmar contagem atualizada;
- testar Light, Dark e Sepia.

### 1.2 Busca/filtro no dashboard

Objetivo: permitir localizar tópicos por título e disciplina.

Arquivos prováveis:

- `src/app/dashboard/page.tsx`
- `src/components/dashboard/dashboard-topic-list.tsx` ou nome equivalente

Possível abordagem:

1. Manter busca de dados no Server Component.
2. Criar Client Component pequeno para input e filtro local.
3. Filtrar por `title` e `discipline`, case-insensitive.
4. Usar `useDebounce` se houver filtro acionado a cada digitação.
5. Exibir estado vazio para busca sem resultados.

Cuidados:

- Não transformar a página inteira em Client Component sem necessidade.
- Preservar agrupamento por disciplina.
- Garantir que o input não quebre no mobile.

Validação:

```powershell
npm run lint
npm run build
```

Teste manual:

- buscar por parte do título;
- buscar por disciplina;
- limpar campo;
- testar com poucos e muitos tópicos.

## Prioridade 2 — Perfil e estatísticas

### 2.1 Tela `/dashboard/perfil`

Objetivo: criar uma página protegida com estatísticas de estudo do usuário.

Arquivos prováveis:

- `src/app/dashboard/perfil/page.tsx`
- opcional: `src/components/dashboard/stats-cards.tsx`
- opcional: ajuste em `src/components/navigation/app-dock.tsx` para link de perfil

Dados possíveis:

- total de seções concluídas;
- total de seções disponíveis;
- percentual geral;
- total de notas;
- tópicos com algum progresso;
- última atividade baseada em `user_progress.updated_at` ou `user_notes.updated_at`.

Cuidados:

- Dados do usuário devem ser filtrados por `session.user.id`.
- Evitar gráficos complexos no primeiro passo.
- Se adicionar link no App Dock, validar largura mobile.

Validação:

```powershell
npm run lint
npm run build
```

Teste manual:

- acessar logado;
- acessar sem sessão e confirmar redirect para `/login`;
- comparar números com dados do banco;
- testar temas e mobile.

## Prioridade 3 — Integração com PYGEM2

### 3.1 Automação PYGEM2 -> Site

Objetivo: automatizar o envio do JSON processado para `POST /api/import`.

Local provável:

- projeto `C:\PYGEM2`, não este repositório.

Fluxo desejado:

1. Gerar JSON com o pipeline LEIAUT.
2. Validar o JSON antes do envio.
3. Enviar para `http://localhost:3000/api/import` ou URL configurada.
4. Mostrar resposta clara para sucesso e erro.

Cuidados:

- Não duplicar regras divergentes do Zod do site.
- Tratar erro 400 com detalhes de validação.
- Não hardcodar tokens sensíveis.

Validação:

- JSON válido retorna `201`.
- JSON inválido retorna `400`.
- Tópico aparece no dashboard depois do envio.

### 3.2 Modo preview antes de importar

Objetivo: permitir visualizar um JSON antes de salvar no Supabase.

Arquivos prováveis:

- `src/app/preview/page.tsx` ou rota protegida dentro de `/dashboard`.
- Reuso de componentes em `src/components/study/*`.

Fluxo desejado:

1. Upload ou colagem de JSON.
2. Parse e validação.
3. Renderização preview de seções.
4. Destaque de erros.
5. Botão de confirmação para chamar `POST /api/import`.

Cuidados:

- Não salvar dados automaticamente.
- Mermaid continua client-only.
- Evitar duplicação extensa do layout de estudo.
- Definir se preview deve exigir login.

Validação:

```powershell
npm run lint
npm run build
```

Teste manual:

- JSON válido renderiza preview;
- JSON inválido mostra erro claro;
- confirmar importação;
- verificar tópico no dashboard.

## Dívidas técnicas conhecidas

### Revisar cadastro com service role

Arquivo:

- `src/app/actions/auth.ts`

Situação:

- A Server Action cria usuário confirmado usando `SUPABASE_SERVICE_ROLE_KEY`, aparentemente para contornar rate limit de e-mail em testes.

Risco:

- Se esse fluxo permanecer em produção sem controle, cadastro público pode usar uma operação administrativa sensível.

Recomendação:

- Decidir se é fluxo temporário/dev.
- Se for apenas teste, proteger por ambiente ou remover do fluxo público.
- Se for permanente, revisar modelo de segurança e auditoria.

### Reduzir uso de `any`

Arquivo observado:

- `src/app/dashboard/notas/page.tsx`

Situação:

- Transformação de `notesData` usa `note: any`.

Recomendação:

- Tipar retorno esperado da query ou criar type local para o shape enriquecido.
- Fazer isso em tarefa pequena e separada.

### Dependências possivelmente ociosas

Dependências declaradas sem uso encontrado em `src`:

- `class-variance-authority`
- `clsx`
- `tailwind-merge`

Recomendação:

- Confirmar se haverá sistema de componentes que usará essas dependências.
- Se não houver, remover em tarefa separada com:

```powershell
npm uninstall class-variance-authority clsx tailwind-merge
npm run lint
npm run build
```

## Checklist geral por tarefa

Antes de alterar:

1. Ler o contexto relevante.
2. Explicar plano.
3. Identificar riscos.
4. Limitar escopo.
5. Implementar alteração mínima.

Antes de entregar:

```powershell
npm run lint
npm run build
```

Quando tocar UI:

- desktop, tablet e mobile;
- temas Light, Dark e Sepia;
- overflow horizontal;
- App Dock;
- autenticação;
- notas;
- progresso;
- Mermaid;
- flashcards/callouts/mnemônicos.

## Itens fora de escopo imediato

- Reescrever identidade visual inteira.
- Trocar Supabase por outro backend.
- Mudar contrato JSON sem coordenar com PYGEM2.
- Adicionar biblioteca de gráficos antes de uma primeira tela simples de estatísticas.
- Criar sistema completo de permissões administrativas antes de definir o fluxo real de operação.
