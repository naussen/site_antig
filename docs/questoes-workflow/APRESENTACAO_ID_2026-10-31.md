# Apresentação e identificação de questões — 31/10/2026

## Escopo

- Cabeçalho com `external_id` permanente, separado da posição na lista; banca/ano independentes; órgão/cargo, tópicos com seus tipos reais e `subject` como assunto quando não duplicado.
- O modelo atual não contém subtópicos hierárquicos. `related` e `reference` não são promovidos a filhos de um tópico. Não há mudança no contrato de importação nem nas tabelas.
- Removidos os rótulos Enunciado/Texto-base e os painéis artificiais do corpo. Texto legítimo e atribuições de fonte continuam exibidos.
- Largura integral do Markdown restrita ao componente Questões; o limite global de leitura dos Resumos permanece.
- Observação inicial inequivocamente reconhecida é deslocada visualmente ao cabeçalho. O original persistido, seus hashes e alternativas permanecem intactos. Menções no meio da prosa/citações não são removidas. O aviso antigo não é tratado como prova do estado atual do gabarito.

## Banco e implantação

1. Aplicar `supabase/migrations/046_question_identifier_filter.sql` no banco compartilhado pelo fluxo administrativo autorizado, antes de implantar o cliente. Não há preenchimento retroativo nem alteração de dados nesta migration.
2. A nova RPC `list_questions_filtered_v2` aceita os oito argumentos anteriores mais `p_question_identifier TEXT DEFAULT NULL`. O ID é normalizado apenas nas bordas e comparado exatamente com `external_id` ou UUID. Não é busca parcial nem por número isolado na prova. Filtros continuam cumulativos.
3. A assinatura anterior é preservada para clientes antigos e para permitir atualização do banco antes do site, sem overload ambíguo no PostgREST. A nova RPC mantém autorização/entitlement, limites, ordem, paginação, contagem, exclusão de questões ocultadas e isolamento por usuário.
4. Somente `answer_status` de uma allowlist é acrescentado ao resultado. Metadados completos, gabarito e explicação não são retornados pela listagem. `source_metadata.answer_status` existente não é preenchido nem validado editorialmente por esta entrega.
5. Verificar no ambiente de destino o filtro por ID externo e UUID, filtros combinados, inexistentes, ocultações e acesso negativo. O novo cliente depende da migration; sem ela, a consulta apresenta erro. Para reverter o site, implantar a versão anterior: a RPC antiga permanece disponível. A função nova pode permanecer sem uso até uma migration posterior de limpeza.

## Validação e limites

Resultados: 248 testes Node aprovados e quatro testes de integração preexistentes ignorados por ausência de credenciais; 11 testes Playwright aprovados; 11 verificações PostgreSQL isoladas aprovadas; build Webpack, typecheck e lint sem erros (12 avisos preexistentes); auditoria de dependências de produção sem vulnerabilidades. `npm run test:questions` inclui regressões de preservação de conteúdo e extração conservadora de metadados. `npx playwright test tests/visual/questions-practice.spec.ts` verifica o componente real em fixture somente de desenvolvimento, nos três temas, larguras 320/390/1440 e fluxos simulados de filtro e revelação. As capturas foram inspecionadas, e o teste exige o tema efetivamente ativo pelo cookie inicial, sem depender de alteração antecipada ao efeito de hidratação.

Os testes de browser usam respostas RPC simuladas; não comprovam banco remoto, duas contas reais, entitlement ou persistência real. O Docker local estava indisponível, então a migration foi executada duas vezes em PostgreSQL isolado via [PGlite](https://pglite.dev/docs/), com tabelas mínimas e funções simuladas de sessão/entitlement. Foram verificadas identidade exata, combinações de filtros, paginação, estados editoriais, limites, allowlist, privilégios e isolamento entre dois UUIDs de usuário. Não é teste das políticas completas do Supabase.

Para reproduzir esse teste opcional, sem dependência nova no projeto ou bundle:

```powershell
npm install --prefix tmp/pg-validation --no-save --package-lock=false --no-audit --no-fund @electric-sql/pglite
node tests/integration/question-identifier-filter.mjs
```

O pacote existe apenas em `tmp/`, ignorado pelo Git. A dependência temporária permite testar a função PL/pgSQL sem Docker nem credenciais; a alternativa é executar o mesmo cenário em PostgreSQL/Supabase local. Ainda é necessário validar a migration no Supabase de homologação e fazer smoke autenticado após integração/implantação. Não houve aplicação de migration nem alteração de questões em produção nesta tarefa.

Uma checagem adicional do servidor em modo produção com variáveis Supabase simuladas não foi executada: a revisão automática bloqueou a inicialização por política, sem motivo mais detalhado. Os testes de browser foram executados pelo servidor de desenvolvimento configurado no Playwright. A fixture é protegida por `notFound()` em produção; não foi comprovado HTTP 404 no servidor de produção nesta execução.

Correções editoriais/cadastrais em lote e prevenção de nova contaminação estão delegadas no [prompt completo para o Antigravity](PROMPT_SANEAMENTO_ENUNCIADOS_CABECALHO_2026-10-31.md).

## Arquivos da entrega

- Interface: `src/app/dashboard/questoes/question-card.tsx`, `questions-client.tsx` e `page.tsx`.
- Apresentação: `src/lib/questions/presentation.mjs` e `presentation.d.mts`; contrato de retorno em `src/types/database.ts`.
- Banco: `supabase/migrations/046_question_identifier_filter.sql`.
- Verificação: `tests/question-presentation.test.mjs`, `tests/questions-ui.test.mjs`, `tests/integration/question-identifier-filter.mjs`, `tests/visual/questions-practice.spec.ts` e fixture `src/app/landing/questions-visual-regression/page.tsx`; `package.json` inclui os novos testes unitários no comando de Questões.
- Documentação: este registro, o prompt de saneamento, `docs/REGRA_ELABORACAO_QUESTOES_PROQUESTOES.md` e `CHANGELOG.md`.
