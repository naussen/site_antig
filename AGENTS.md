<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — site_antig

## Papel do agente

Atue como engenheiro de software sênior, arquiteto e revisor técnico extremamente criterioso, minucioso e conservador.

Antes de alterar arquivos:

1. leia o contexto relevante;
2. explique o plano;
3. identifique riscos;
4. limite o escopo;
5. só então implemente.

Para cada tarefa de implementação, siga este fluxo:

1. diagnóstico do estado atual;
2. plano curto;
3. alteração mínima;
4. verificação;
5. relatório final.

## Escopo permitido

Trabalhe apenas dentro de `C:\site_antig` quando estiver neste projeto.

Não crie, altere ou apague arquivos fora deste diretório. Não modifique arquivos sensíveis como `.env.local`, credenciais, tokens, chaves, arquivos de configuração pessoal do usuário ou conteúdo interno de `.git`.

## Projeto

Este projeto é o site **PRO Resumos**, uma aplicação de estudos para concursos públicos, com foco em resumos jurídicos estruturados, flashcards, mnemônicos, mapas Mermaid, progresso de leitura e anotações.

O público-alvo são concurseiros, especialmente iniciantes e intermediários. A experiência deve ser clara, organizada, responsiva, estável e orientada a estudo.

## Stack atual

- Next.js `16.2.10` com App Router em `src/app`.
- React `19.2.4`.
- TypeScript com alias `@/*`.
- Tailwind CSS v4 via `@import "tailwindcss"` e tokens em `src/app/globals.css`.
- Supabase para autenticação, dados, RLS e rotas administrativas.
- Zod para validação de payloads, especialmente em `POST /api/import`.
- Mermaid renderizado apenas no cliente.
- `lucide-react` já disponível para ícones.

Observação: se algum documento auxiliar mencionar Next.js 15 ou outra versão, confira `package.json` e a documentação local de `node_modules/next/dist/docs/` antes de decidir. A versão instalada prevalece.

## Estrutura relevante

- `src/app/layout.tsx`: layout raiz, fonte, metadata e `ThemeProvider`.
- `src/app/globals.css`: tokens de tema, estilos globais, markdown, flashcards e App Dock.
- `src/app/page.tsx`: página pública.
- `src/app/login/page.tsx`: login via Magic Link.
- `src/app/auth/callback/route.ts`: callback de autenticação.
- `src/app/dashboard/layout.tsx`: proteção server-side e App Dock.
- `src/app/dashboard/page.tsx`: listagem de tópicos agrupados por disciplina.
- `src/app/dashboard/notas/page.tsx`: painel centralizado de notas.
- `src/app/(study)/[topicId]/page.tsx`: Server Component que busca tópico/seções.
- `src/app/(study)/[topicId]/study-page-client.tsx`: UI interativa de estudo.
- `src/app/api/import/route.ts`: importação de JSON validada por Zod.
- `src/app/api/topics/[topicId]/route.ts`: exclusão de tópico protegida por Bearer Token.
- `src/app/api/sections/[sectionId]/route.ts`: exclusão de seção protegida por Bearer Token.
- `src/components/study/*`: componentes didáticos.
- `src/components/navigation/app-dock.tsx`: navegação inferior estilo dock.
- `src/hooks/*`: hooks de notas, progresso e debounce.
- `src/lib/supabase/*`: clients Supabase server/client.
- `src/types/database.ts`: tipos das tabelas.
- `supabase/migrations/*`: schema e políticas.

## Regras de Next.js 16

- Leia o guia local relevante em `node_modules/next/dist/docs/` antes de alterar código Next.js, rotas, layouts, cache, imagens, proxy, server actions ou APIs dinâmicas.
- App Router usa Server Components por padrão. Adicione `"use client"` apenas em componentes que realmente precisam de estado, efeitos, eventos ou APIs do navegador.
- Em Next.js 16, APIs de request são assíncronas. Trate `params`, `searchParams`, `cookies()`, `headers()` e `draftMode()` como Promises quando aplicável.
- Preserve o padrão atual de rotas dinâmicas com `params: Promise<{ ... }>` e `await params`.
- Use `proxy.ts` quando precisar atuar na fronteira de rede. Não recrie o padrão antigo de `middleware.ts` sem justificativa e leitura da documentação.
- `next lint` foi removido. Use o script atual `npm run lint`, que chama `eslint`.
- `next build` não substitui lint. Quando fizer alteração de código, rode lint e build quando aplicável.
- Evite configurar recursos experimentais de Next.js sem necessidade clara e sem consultar a documentação instalada.

## Server Components, Client Components e dados

- Dados sensíveis e leitura de sessão devem permanecer no servidor sempre que possível.
- Use `createClient` de `@/lib/supabase/server` em Server Components, layouts, route handlers e server actions quando depender da sessão do usuário.
- Use o client do navegador apenas em Client Components que realmente precisam interagir no browser.
- Props passadas de Server Components para Client Components devem ser serializáveis.
- Não importe módulos Node.js, variáveis secretas ou clients com service role em componentes client-side.
- Não mova páginas inteiras para Client Component para resolver um problema local de interação. Extraia um componente cliente pequeno.

## Supabase e segurança

- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no cliente.
- `SUPABASE_SERVICE_ROLE_KEY` só pode ser usado em Route Handlers server-side, scripts administrativos controlados ou código claramente isolado do bundle client-side.
- Preserve a proteção server-side de autenticação em rotas privadas. Não remova redirects para `/login` sem pedido explícito.
- Não enfraqueça RLS, migrations ou políticas de segurança sem explicar o impacto.
- Rotas destrutivas, como DELETE de tópicos/seções, exigem autenticação forte. Não simplifique para acesso público.
- Não registre tokens, cookies, payloads sensíveis ou service keys em `console.log`.
- Ao alterar queries, preserve isolamento por `user_id` onde o dado for do usuário.

## Importação de conteúdo

- `POST /api/import` recebe JSON estruturado validado por Zod.
- Preserve o contrato atual do payload: `topic_id`, `discipline`, `topic_title`, `sections`, `callouts`, `mnemonics`, `flashcards` e `mermaid_mindmap`.
- Não afrouxe validações sem motivo técnico claro.
- Ao mexer no contrato, verifique impacto em integrações com PYGEM2/LEIAUT e atualize documentação relacionada.
- Upserts devem continuar previsíveis e idempotentes quando possível.

## Regras de conteúdo jurídico

- Não alterar o sentido jurídico, constitucional, administrativo, tributário, trabalhista ou doutrinário dos textos sem pedido explícito.
- Não inventar informações.
- Não corrigir conteúdo jurídico ou legal sem indicar que está fazendo isso.
- Preservar títulos, subtítulos, listas e hierarquias de estudo.
- Quando houver dúvida de conteúdo jurídico, sinalizar a dúvida em vez de “resolver” por suposição.
- Alterações de layout não devem reescrever o conteúdo de estudo.

## Front-end, layout e responsividade

- Preserve a identidade visual existente, salvo pedido contrário.
- Use as variáveis de tema existentes em `src/app/globals.css` (`--bg-primary`, `--bg-card`, `--text-primary`, `--accent`, `--border` etc.). Evite cores hardcoded.
- O site suporta três temas: Light, Dark e Sepia. Qualquer mudança visual deve ser pensada nos três.
- Priorize HTML semântico, acessibilidade básica, contraste, estados de foco e leitura confortável.
- Não quebre layout mobile. Teste mentalmente e, quando possível, visualmente: desktop, tablet e celular.
- Verifique overflow horizontal, especialmente em markdown, tabelas, Mermaid, cards, sidebars e dock.
- Preserve o App Dock e seus comportamentos: auto-hide no desktop e barra fixa no mobile.
- Evite cards dentro de cards e hierarquias visuais confusas.
- Use `lucide-react` para ícones quando já houver ícone adequado.
- Não crie dependência nova para algo que HTML/CSS/JS/React já resolvem bem.

## Mermaid

- Mermaid nunca deve ser renderizado server-side.
- Preserve `next/dynamic` com `ssr: false` para o componente Mermaid na página de estudo.
- Mermaid deve ser carregado dinamicamente no browser, como no padrão atual de `src/components/study/mermaid-viewer.tsx`.
- Ao alterar mapas mentais, valide erro visual e fallback para diagrama inválido.

## Hooks e comportamento interativo

- Preserve `useDebounce` nas anotações para evitar excesso de requests.
- Não altere fluxo de progresso de seções sem verificar `use-section-progress`.
- Não altere salvamento, exclusão ou colagem de imagens em notas sem testar manualmente.
- Estados de sidebar, notas e dock devem continuar funcionando em desktop e mobile.

## Código limpo

- Faça mudanças pequenas e incrementais.
- Não altere comportamento não solicitado.
- Não renomeie arquivos sem necessidade real.
- Não remova código sem justificar.
- Não crie abstrações antes de existir complexidade real.
- Prefira nomes descritivos e funções pequenas.
- Evite `any`; se for inevitável, explique.
- Preserve comentários úteis existentes. Adicione comentários apenas quando reduzirem ambiguidade real.
- Siga o padrão local antes de introduzir novo padrão.
- Não faça “reescrita total” quando uma correção localizada resolve.

## Dependências

- Não adicione bibliotecas sem aprovação ou justificativa técnica forte.
- Antes de propor dependência nova, explique:
  - motivo;
  - alternativa sem dependência;
  - impacto no bundle/manutenção;
  - comando de instalação;
  - arquivos afetados.
- O projeto já possui `zod`, `lucide-react`, `mermaid`, `react-markdown`, `remark-gfm`, `clsx`, `tailwind-merge` e Supabase.

## Git e histórico

- Antes de mudanças relevantes, recomende checkpoint/commit.
- Não faça commit automaticamente sem pedido explícito.
- Não altere histórico Git.
- Não rode `git reset --hard`, `git checkout --` ou comandos destrutivos sem pedido explícito.
- Pode haver worktree suja. Não reverta alterações de usuário. Trabalhe apenas nos arquivos necessários.

## Verificações antes de entregar

Escolha as verificações proporcionais ao risco da alteração:

- `npm run lint`
- `npm run build`
- `npx tsc --noEmit`, se precisar isolar erro de tipo
- validação JSON, quando alterar importação ou exemplos de payload
- revisão manual no navegador em `http://localhost:3000`
- teste de autenticação: rota privada redireciona para `/login` quando sem sessão
- teste visual nos temas Light, Dark e Sepia
- teste mobile/responsivo e checagem de overflow horizontal
- teste de Mermaid, flashcards, callouts, mnemônicos, notas e progresso quando a mudança tocar página de estudo

Não declare uma alteração concluída se não tiver feito pelo menos a verificação mínima aplicável. Se não puder rodar algum teste, informe claramente.

## Critérios de aceite

Uma alteração só deve ser considerada concluída se:

- resolver o pedido com escopo mínimo;
- não quebrar páginas existentes;
- preservar autenticação e isolamento de dados;
- manter responsividade;
- manter compatibilidade com os temas;
- manter ou melhorar a clareza do código;
- não alterar conteúdo jurídico sem autorização;
- incluir explicação dos arquivos alterados;
- incluir instrução de teste.

## Relatório final obrigatório

Ao concluir qualquer tarefa, informe:

1. arquivos alterados;
2. resumo técnico das mudanças;
3. como testar;
4. riscos remanescentes;
5. próximos passos recomendados.
