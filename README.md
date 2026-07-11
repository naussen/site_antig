# PRO Resumos

Aplicação web para estudo de concursos públicos, com foco em resumos jurídicos estruturados, leitura orientada por seções, flashcards, mnemônicos, mapas Mermaid, progresso de estudo e anotações por usuário.

O projeto recebe materiais em JSON, normalmente gerados por um pipeline externo como PYGEM2/LEIAUT, valida o payload e salva os tópicos/seções no Supabase. O front-end renderiza esse conteúdo em uma experiência responsiva e didática para concurseiros.

## Stack

- Next.js `16.2.10` com App Router em `src/app`.
- React `19.2.4`.
- TypeScript.
- Tailwind CSS v4 com tokens em `src/app/globals.css`.
- Supabase Auth, banco e RLS.
- Zod para validação do JSON de importação.
- Mermaid carregado somente no cliente.
- React Markdown com GFM.
- Lucide React para ícones.

> Importante: este projeto usa Next.js 16. Antes de alterar rotas, layouts, APIs dinâmicas, cache, imagens ou proxy, leia a documentação local em `node_modules/next/dist/docs/`, conforme `AGENTS.md`.

## Funcionalidades atuais

- Página pública inicial em `/`.
- Login em `/login` com:
  - Magic Link por e-mail;
  - login/cadastro com senha;
  - login Google via OAuth;
  - callback em `/auth/callback`.
- Dashboard protegido em `/dashboard`.
- Tópicos agrupados por disciplina.
- Página de estudo dinâmica em `/[topicId]`.
- Renderização de:
  - Markdown;
  - callouts;
  - flashcards 3D;
  - mnemônicos;
  - mapas Mermaid;
  - sumário lateral;
  - painel lateral de notas.
- Progresso por seção.
- Notas por seção com auto-save e suporte a Markdown/imagens.
- Painel de notas em `/dashboard/notas`, agrupado por disciplina e tópico.
- Temas Light, Dark e Sepia.
- App Dock inferior com navegação, tema, notas/sumário e logout.
- API de importação `POST /api/import`.
- APIs administrativas:
  - `DELETE /api/topics/[topicId]`;
  - `DELETE /api/sections/[sectionId]`.

## Estrutura principal

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── auth/callback/route.ts
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── notas/page.tsx
│   ├── (study)/
│   │   ├── layout.tsx
│   │   └── [topicId]/
│   │       ├── page.tsx
│   │       └── study-page-client.tsx
│   └── api/
│       ├── import/route.ts
│       ├── topics/[topicId]/route.ts
│       └── sections/[sectionId]/route.ts
├── components/
│   ├── auth/
│   ├── navigation/
│   ├── study/
│   ├── theme-provider.tsx
│   └── theme-switcher.tsx
├── hooks/
├── lib/supabase/
└── types/database.ts
```

Outros documentos relevantes:

- `AGENTS.md`: regras obrigatórias para agentes de IA neste projeto.
- `ECOSSISTEMA.md`: visão unificada do pipeline PYGEM2 → Site.
- `PROXIMOS_PASSOS_SITE.md`: backlog priorizado e estado atual.
- `guia_envio_materiais.md`: guia operacional para preparar e enviar materiais.
- `supabase/migrations/*`: schema e políticas do banco.

## Variáveis de ambiente

O projeto depende de Supabase. As variáveis ficam em `.env.local`, que não deve ser versionado.

Variáveis esperadas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Regras de segurança:

- `NEXT_PUBLIC_*` pode ser usado no cliente.
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ir para Client Components.
- Service role deve ficar restrita a Route Handlers, Server Actions administrativas ou scripts controlados.

## Rodando localmente

Instale dependências:

```powershell
npm install
```

Inicie o servidor de desenvolvimento:

```powershell
npm run dev
```

Acesse:

```text
http://localhost:3000
```

Scripts disponíveis:

```powershell
npm run dev
npm run lint
npm run build
npm run start
```

## Importação de materiais

A rota `POST /api/import` recebe um JSON no formato:

```json
{
  "topic_id": "dir-constitucional-art-5",
  "discipline": "Direito Constitucional",
  "topic_title": "Art. 5º — Direitos e Garantias Fundamentais",
  "sections": [
    {
      "section_id": "dir-constitucional-art-5-sec-01",
      "title": "Princípio da Igualdade",
      "content_markdown": "Conteúdo em Markdown...",
      "callouts": [],
      "mnemonics": [],
      "flashcards": [],
      "mermaid_mindmap": ""
    }
  ]
}
```

Validação principal:

- `topic_id`: string não vazia.
- `discipline`: string, padrão `"Geral"` se ausente.
- `topic_title`: string não vazia.
- `sections`: array com pelo menos uma seção.
- `callouts[].type`: `"warning"`, `"info"` ou `"tip"`.
- `mnemonics`: `key`, `meaning`, `description`.
- `flashcards`: `question`, `answer`.
- `mermaid_mindmap`: string opcional.

Consulte `guia_envio_materiais.md` para o fluxo completo de criação, validação e envio.

## Endpoints administrativos

As rotas destrutivas exigem header:

```http
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

Endpoints:

```http
DELETE /api/topics/[topicId]
DELETE /api/sections/[sectionId]
```

Essas rotas usam service role no servidor e não devem ser expostas no cliente.

## Regras arquiteturais críticas

- Mermaid deve continuar client-only.
- Rotas privadas devem manter proteção server-side.
- Dados sensíveis devem ficar em Server Components, Route Handlers ou Server Actions.
- Client Components devem receber apenas props serializáveis e não devem importar service role.
- `useDebounce` deve ser preservado no fluxo de notas.
- CSS visual deve usar tokens de tema em `globals.css`.
- Alterações de conteúdo jurídico exigem cuidado: não alterar sentido legal/doutrinário sem pedido explícito.

## Verificação antes de entregar mudanças

Para mudanças de código:

```powershell
npm run lint
npm run build
```

Quando a alteração tocar interface, verificar manualmente:

- desktop, tablet e mobile;
- temas Light, Dark e Sepia;
- overflow horizontal;
- autenticação e redirect para `/login`;
- página de estudo;
- notas;
- progresso;
- Mermaid;
- flashcards, callouts e mnemônicos.

## Estado do roadmap

Consulte [`PROXIMOS_PASSOS_SITE.md`](./PROXIMOS_PASSOS_SITE.md) para o estado atual consolidado e o backlog priorizado.
