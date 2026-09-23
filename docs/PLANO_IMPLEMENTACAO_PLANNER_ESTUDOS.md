# Plano de implementação — Planner semanal de estudos

Atualizado em: 22 de setembro de 2026.

## Progresso da implementação

| Fase | Estado | Evidência |
|---|---|---|
| 0 — contrato e protótipo | Concluída | contrato, UX desktop/mobile e validações definidos |
| 1 — banco e RLS | Concluída | migration 026 aplicada; teste remoto com dois usuários aprovado |
| 2 — CRUD acessível | Concluída | rota, menu, Server Actions, formulários e estados implementados |
| 3 — drag-and-drop | Em andamento | criação e movimentação por drag prontas; redimensionamento por gesto pendente |
| 4 — múltiplas semanas | Em andamento | navegação de 1–4 semanas pronta; copiar semana pendente |
| 5 — acabamento | Em validação | lint, tipos, testes, audit e build aprovados; estado inicial validado em produção nos três temas e em 390 px |

Pendências deliberadamente mantidas para o próximo incremento: redimensionamento direto pela borda do bloco, copiar semana e desfazer exclusão. O ajuste de início/fim já funciona pelo diálogo acessível. A grade preenchida ainda requer smoke visual em conta de teste dedicada, para não criar dados artificiais na conta real usada na validação de produção.

## 1. Objetivo

Criar na área autenticada do aluno um planner de estudos com horizonte configurável de **1 a 4 semanas**, no qual o usuário possa:

- escolher as disciplinas disponíveis no PRO Resumos;
- arrastar uma disciplina para um dia e horário;
- mover um bloco já criado para outro dia ou horário;
- ajustar o início e o fim do bloco;
- editar a duração por formulário, inclusive em dispositivos sem drag-and-drop;
- copiar a programação de uma semana para outra;
- salvar automaticamente o planejamento na própria conta.

O planner será uma funcionalidade pessoal. Nenhum planejamento poderá ser lido ou alterado por outro usuário.

## 2. Escopo do MVP

### Incluído

- nova rota autenticada `/dashboard/planner`;
- entrada “Planner” no menu lateral desktop e mobile;
- criação de um plano com data inicial em uma segunda-feira e duração de 1, 2, 3 ou 4 semanas;
- grade semanal com segunda a domingo;
- faixa diária configurável, inicialmente sugerida como 06:00–23:00;
- granularidade selecionável de 15, 30 ou 60 minutos;
- criação por arrastar disciplina, clique/toque em célula ou botão “Adicionar estudo”;
- movimentação do bloco entre dias e horários;
- redimensionamento vertical para alterar duração;
- edição por diálogo com disciplina, data, início, fim e observação curta opcional;
- exclusão com confirmação e opção de desfazer enquanto a página estiver aberta;
- navegação entre as semanas do plano;
- ação “Copiar semana” sem sobrescrever silenciosamente blocos existentes;
- estados de carregamento, vazio, erro e salvamento;
- temas Light, Dark e Sepia;
- layout responsivo e alternativa completa ao gesto de arrastar.

### Fora do MVP

- sincronização com Google Calendar, Outlook ou notificações externas;
- lembretes por e-mail, push ou WhatsApp;
- geração automática de cronograma por IA;
- metas, pomodoro, controle de presença ou tempo efetivamente estudado;
- compartilhamento de planos entre usuários;
- recorrência indefinida além das quatro semanas;
- vínculo obrigatório com um tópico específico do acervo.

## 3. Decisões de produto

1. **Um plano ativo por vez no MVP.** O banco comportará múltiplos planos para permitir histórico futuro, mas a interface destacará somente um plano ativo.
2. **Blocos usam datas concretas.** Persistir `study_date`, e não apenas “dia da semana”, evita ambiguidades ao navegar pelas quatro semanas.
3. **Horários são ajustáveis em dois níveis.** O usuário configura a faixa visível e a granularidade da grade; cada bloco possui início e fim próprios.
4. **A disciplina é um valor validado do catálogo.** Como o projeto ainda não possui tabela canônica de disciplinas, o nome será salvo como texto validado no servidor contra os tópicos ativos. O bloco continuará legível se o catálogo mudar.
5. **Arrastar não será a única forma de operar.** Todo fluxo deverá funcionar por diálogo, teclado e toque para garantir acessibilidade e estabilidade mobile.
6. **Sem salvamento apenas local.** `localStorage` poderá manter somente preferências efêmeras de interface; o plano canônico ficará no Supabase com RLS.
7. **Conflitos de horário serão rejeitados.** O servidor e o banco devem impedir blocos sobrepostos no mesmo plano; a interface mostrará a causa sem descartar o estado anterior.

## 4. Arquitetura proposta

### Página e componentes

- `src/app/dashboard/planner/page.tsx`
  - Server Component;
  - chama `requireContentAccess()`;
  - carrega disciplinas ativas, plano ativo e blocos das quatro semanas;
  - entrega somente dados serializáveis ao cliente.
- `src/app/dashboard/planner/planner-client.tsx`
  - Client Component responsável pela grade, navegação semanal e interação.
- `src/components/planner/discipline-palette.tsx`
  - lista pesquisável de disciplinas arrastáveis;
  - botão acessível para adicionar cada disciplina.
- `src/components/planner/weekly-grid.tsx`
  - grade semântica de dias e horários;
  - indicadores de destino, linha do horário atual e tratamento de overflow.
- `src/components/planner/study-block.tsx`
  - bloco movível, redimensionável, focável e editável.
- `src/components/planner/study-block-dialog.tsx`
  - criação/edição sem depender de gestos.
- `src/components/planner/planner-settings.tsx`
  - duração do plano, faixa diária e granularidade.
- `src/app/actions/study-planner.ts`
  - Server Actions para criar plano, criar/mover/redimensionar/editar/excluir bloco e copiar semana;
  - valida entrada novamente no servidor e nunca aceita `user_id` do navegador.
- `src/lib/planner/validation.ts`
  - schemas Zod e funções puras de data, minuto, duração, limite de quatro semanas e detecção prévia de conflito.
- `src/lib/planner/types.ts`
  - tipos de formulário e DTOs da interface; os tipos persistidos permanecem em `src/types/database.ts`.

### Interação de arrastar

Recomendação: adicionar `@dnd-kit/core` para sensores de mouse, toque e teclado. O HTML Drag and Drop nativo não oferece experiência confiável em telas touch e sua acessibilidade é insuficiente para esta grade.

- o deslocamento deve ser convertido para a granularidade escolhida;
- durante o arraste, mostrar posição e horário de destino;
- só persistir no `drop` confirmado;
- em falha, restaurar a posição anterior e exibir mensagem;
- o redimensionamento pode usar Pointer Events em uma alça inferior, com alternativa no diálogo;
- respeitar `prefers-reduced-motion` e não depender de animação para comunicar estado.

Alternativa sem dependência: implementar movimento e colisão integralmente com Pointer Events e teclado. Evita aumento de bundle, mas eleva significativamente a complexidade, o risco de bugs mobile e o custo de acessibilidade. Deve ser escolhida apenas se a dependência for recusada.

## 5. Modelo de dados

Criar uma migration nova em `supabase/migrations/`, sem alterar migrations já aplicadas.

### `study_plans`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | obrigatório, FK `auth.users(id)` com `ON DELETE CASCADE` |
| `title` | `text` | 1–80 caracteres; padrão “Meu plano de estudos” |
| `start_date` | `date` | segunda-feira da primeira semana do plano |
| `weeks_count` | `smallint` | entre 1 e 4 |
| `day_start_minute` | `smallint` | 0–1439; padrão 360 (06:00) |
| `day_end_minute` | `smallint` | 1–1440; maior que o início; padrão 1380 (23:00) |
| `slot_minutes` | `smallint` | somente 15, 30 ou 60 |
| `timezone` | `text` | allowlist inicial com `America/Sao_Paulo` |
| `is_active` | `boolean` | um único plano ativo por usuário |
| `created_at` / `updated_at` | `timestamptz` | padrão `now()` e trigger de atualização |

Índices e restrições:

- índice por `(user_id, is_active)`;
- índice único parcial que permita somente um plano ativo por usuário;
- checks de duração, faixa diária, tamanho de texto e `EXTRACT(ISODOW FROM start_date) = 1`.

### `study_plan_items`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `plan_id` | `uuid` | FK `study_plans(id)` com `ON DELETE CASCADE` |
| `user_id` | `uuid` | obrigatório; facilita RLS e deve corresponder ao dono do plano |
| `discipline` | `text` | 1–120 caracteres, validado no servidor |
| `study_date` | `date` | deve estar dentro do horizonte do plano |
| `start_minute` | `smallint` | 0–1439 |
| `end_minute` | `smallint` | 1–1440 e maior que o início |
| `note` | `text` | opcional, máximo 300 caracteres, renderizada como texto |
| `created_at` / `updated_at` | `timestamptz` | padrão `now()` e trigger de atualização |

Índices e integridade:

- índice `(user_id, study_date, start_minute)`;
- trigger que confirme dono do plano, horizonte de até quatro semanas e ausência de sobreposição;
- o trigger de conflito deve obter lock transacional por usuário/data antes de consultar os blocos existentes, evitando corrida entre duas inserções simultâneas;
- todas as operações de escrita devem ser atômicas;
- não armazenar HTML, Markdown ou conteúdo de estudo nos blocos.

### RLS e privilégios

- habilitar RLS nas duas tabelas;
- revogar privilégios de `anon`;
- conceder `SELECT`, `INSERT`, `UPDATE` e `DELETE` a `authenticated`;
- políticas separadas por operação com `(SELECT auth.uid()) = user_id` em `USING` e `WITH CHECK`;
- impedir que a atualização troque o `user_id` ou associe item a plano de terceiro;
- adicionar ambos os tipos a `src/types/database.ts` na mesma alteração da migration.

## 6. Fluxos da interface

### Primeiro acesso

1. Exibir estado vazio com explicação curta.
2. Usuário escolhe data inicial e 1–4 semanas.
3. Aplicação cria o plano e abre a primeira semana.
4. Paleta mostra somente disciplinas existentes no catálogo ativo.

### Criar bloco

1. Arrastar disciplina para a grade ou acionar “Adicionar estudo”.
2. Arredondar o horário para a granularidade selecionada.
3. Sugerir duração inicial de 60 minutos, limitada à faixa visível.
4. Validar horizonte, duração e conflito.
5. Persistir e anunciar sucesso em região `aria-live`.

### Mover ou redimensionar

1. Manter cópia do estado confirmado.
2. Mostrar prévia otimista durante o gesto.
3. Enviar os valores finais à Server Action.
4. Em erro, reverter a prévia e explicar o conflito.

### Mobile

- exibir um dia por vez, com seletor de data;
- permitir deslizar/navegar entre dias, sem depender desse gesto;
- criar e editar principalmente pelo diálogo;
- permitir arrastar por toque quando o dispositivo suportar, sem bloquear rolagem da página;
- manter alvos interativos de pelo menos 44 × 44 px.

## 7. Fases de implementação

### Fase 0 — contrato e protótipo estático

- confirmar microcopy e comportamento de conflitos;
- criar wireframe desktop e mobile usando os tokens existentes;
- definir os DTOs e schemas Zod;
- validar a estratégia de drag, touch e teclado em um protótipo sem persistência.

**Aceite:** grade usável em 320 px, tablet e desktop; criação/edição possível sem arrastar; nenhuma decisão de banco pendente.

### Fase 1 — banco, RLS e testes de isolamento

- criar migration com tabelas, checks, índices, triggers e políticas;
- atualizar `src/types/database.ts`;
- estender o teste de RLS com dois usuários para cobrir planos e blocos;
- testar alteração maliciosa de `user_id`, `plan_id`, datas fora do horizonte e sobreposição.

**Aceite:** usuário A não lê nem modifica dados do usuário B; `anon` não acessa; constraints rejeitam dados inválidos; migration local e remota são reportadas separadamente.

### Fase 2 — leitura e CRUD acessível

- criar rota, Server Component, Server Actions e validação compartilhada;
- implementar criação, edição e exclusão pelo diálogo;
- adicionar item “Planner” à navegação;
- implementar estados vazio, loading, sucesso e erro.

**Aceite:** CRUD completo por teclado e toque, com refresh preservando os dados; rota sem sessão redireciona para login; usuário sem acesso ativo segue o gate vigente.

### Fase 3 — drag-and-drop e redimensionamento

- instalar a dependência aprovada e registrar impacto no `package.json`/lockfile;
- implementar sensores de mouse, toque e teclado;
- adicionar alça de duração e snap por granularidade;
- implementar rollback visual em falha e prevenção de conflitos.

**Aceite:** mover entre dias/horários e ajustar duração funciona em desktop e mobile; diálogo continua sendo alternativa integral; nenhuma rolagem fica bloqueada.

### Fase 4 — múltiplas semanas e produtividade

- navegação entre 1–4 semanas;
- copiar semana com resumo do que será criado ou conflitará;
- ajustar duração do plano sem apagar blocos silenciosamente;
- restaurar foco após ações e anunciar mudanças relevantes.

**Aceite:** limites da janela são respeitados; redução do horizonte exige confirmação quando houver blocos afetados; copiar semana é idempotente ou pede resolução explícita.

### Fase 5 — acabamento e publicação

- validar Light, Dark e Sepia;
- revisar contraste, foco, reduced motion, zoom de 200% e overflow;
- testar produção autenticada após deploy;
- atualizar `CHANGELOG.md` somente após implementação validada.

**Aceite:** todas as verificações automatizadas passam; smoke autenticado cobre desktop e mobile; migration, push, deploy e banco remoto possuem evidências distintas.

## 8. Testes obrigatórios

### Unitários

- conversão entre posição e minutos;
- arredondamento em 15/30/60 minutos;
- duração mínima e limites de 00:00–24:00;
- datas dentro de 1–4 semanas;
- detecção de sobreposição e blocos adjacentes;
- cópia de semana no limite do plano;
- schemas Zod com entradas válidas e maliciosas.

### Integração e banco

- CRUD autenticado;
- dois usuários reais para RLS;
- tentativa de forjar `user_id` e `plan_id`;
- concorrência criando blocos no mesmo horário;
- remoção do usuário e cascata;
- plano de terceiro inacessível mesmo conhecendo o UUID.

### Interface e acessibilidade

- mouse, toque e teclado;
- leitor de tela com nomes, horários e anúncios compreensíveis;
- 320 px, tablet e desktop largo;
- Light, Dark e Sepia;
- zoom a 200%, `prefers-reduced-motion` e ausência de overflow horizontal;
- perda de conexão durante criação, movimento e redimensionamento.

### Comandos mínimos

- `npm run lint`
- `npx tsc --noEmit`
- testes unitários específicos do planner
- `npm run test:rls-two-users`
- `npm run build -- --webpack`
- `npm audit --omit=dev`
- smoke manual autenticado local e pós-deploy

## 9. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Drag-and-drop ruim no celular | sensor touch, limiar de ativação e diálogo como caminho principal alternativo |
| Interface inacessível por teclado | sensor de teclado, foco visível e CRUD completo via formulário |
| Blocos sobrepostos por requisições concorrentes | validação no banco, não apenas no cliente |
| Mudança no nome de disciplina | salvar snapshot textual e validar apenas na criação/edição |
| Grade pesada em quatro semanas | renderizar uma semana por vez e consultar somente o horizonte ativo |
| Perda de dados ao reduzir semanas | prévia dos itens afetados e confirmação explícita |
| Estado otimista divergente do banco | rollback para o último estado confirmado e `router.refresh()` após erro relevante |
| Vazamento entre alunos | RLS por `user_id`, FK ao dono e teste negativo com dois usuários |
| Dependência de drag aumentar bundle | carregar o cliente do planner somente na rota e medir o bundle |

## 10. Arquivos previstos

### Novos

- `src/app/dashboard/planner/page.tsx`
- `src/app/dashboard/planner/planner-client.tsx`
- `src/app/actions/study-planner.ts`
- `src/components/planner/*`
- `src/lib/planner/validation.ts`
- `src/lib/planner/types.ts`
- `supabase/migrations/NNN_create_study_planner.sql`
- `tests/study-planner.test.mjs`

### Alterados

- `src/components/navigation/dashboard-navigation.tsx`
- `src/types/database.ts`
- `scripts/test-rls-two-users.mjs`
- `package.json` e lockfile, se `@dnd-kit/core` for aprovado;
- `CHANGELOG.md` ao concluir a implementação.

## 11. Critérios de aceite finais

- aluno cria um plano de 1, 2, 3 ou 4 semanas;
- aluno adiciona disciplinas por arrastar e por formulário;
- blocos podem ser movidos e ter início/fim ajustados;
- horários respeitam granularidade e não se sobrepõem;
- dados permanecem após refresh e são exclusivos do usuário autenticado;
- nenhum `user_id` vindo do navegador é tratado como autoridade;
- fluxo completo funciona por teclado e em tela touch;
- interface funciona nos três temas e sem overflow em 320 px;
- lint, tipos, testes, build e teste RLS passam;
- banco aplicado, commit/push e deploy são comprovados separadamente;
- nenhuma funcionalidade fora do MVP é introduzida junto.

## 12. Ordem recomendada

Executar as fases 0 a 5 em commits atômicos. A primeira entrega utilizável deve encerrar a Fase 2; drag-and-drop só entra depois que persistência, RLS e CRUD acessível estiverem sólidos. Essa ordem reduz o risco de construir uma interação visual sofisticada sobre um contrato de dados instável.
