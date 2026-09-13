# Relatório de Auditoria Funcional e de Segurança

**Produto:** PRO Concursos — PRO Resumos e PRO Legis
**Ambiente auditado:** `https://proconcursos.com.br`
**Data:** 10 de setembro de 2026
**Última atualização do progresso:** 12 de setembro de 2026
**Checkout local:** `C:\PRO\site`
**Branch:** `feat/administracao-geral-flashcards`
**Commit de referência:** `c28ae10`
**Commit mais recente publicado:** `e719912`

## 1. Resumo executivo

A autenticação com conta Google e o segundo fator administrativo foram concluídos com sucesso. O acesso ao dashboard demonstrou que a sessão administrativa atingiu o nível `aal2`, exigido pelo código para liberar o acervo.

A auditoria encontrou **um risco crítico de dependência**, **uma falha funcional de alta prioridade**, **três fragilidades de segurança de prioridade média** e melhorias menores de comportamento HTTP e acessibilidade.

Principais conclusões:

1. O checkout usa Next.js `16.3.0`, versão afetada por vulnerabilidades críticas já corrigidas em versões posteriores.
2. A página de configurações está inoperante em produção porque o banco não possui todo o contrato esperado pela aplicação, provavelmente as colunas da migration `020`.
3. O PRO Resumos não entrega o mesmo conjunto de cabeçalhos defensivos já presente no PRO Legis.
4. A integração de pagamentos mantém logs temporários capazes de registrar dados pessoais, identificadores e corpos de erro do provedor.
5. A API administrativa de importação lê JSON sem limite explícito de tamanho.

Não foi demonstrado vazamento anônimo do conteúdo pago. Os controles centrais de autenticação, MFA, entitlement, RLS, Markdown e Mermaid apresentam uma base de segurança adequada.

## 2. Escopo e metodologia

Foram realizadas as seguintes verificações:

- login real no Chrome com conta Google e MFA Authenticator;
- navegação autenticada pelo dashboard, página de estudo, notas, configurações, assinatura e PRO Legis;
- inspeção visual em desktop e viewport móvel de 390 × 844;
- validação dos temas Light, Dark e Sepia, com restauração do tema original;
- inspeção de respostas HTTP, TLS e cabeçalhos por Chrome DevTools Protocol;
- requisições anônimas às rotas protegidas, sem reutilizar cookies da sessão;
- revisão estática das rotas, autenticação, autorização, RLS, pagamentos, Markdown, Mermaid e importação;
- execução de lint, TypeScript, build, testes automatizados e auditoria de dependências.

Esta análise foi conservadora e não incluiu exploração ofensiva, força bruta, carga deliberada, alteração de dados, checkout, cancelamento, exclusões administrativas ou teste remoto com duas contas distintas.

## 3. Classificação consolidada

| ID | Severidade | Área | Achado | Estado |
|---|---|---|---|---|
| SEG-01 | Crítica | Dependências | Next.js `16.3.0` afetado por advisories críticos | Corrigido e publicado (`7b0fe24`) |
| FUN-01 | Alta | Configurações | Preferências não podem ser salvas em produção | Corrigido e publicado (`1df3902`) |
| SEG-02 | Média | Cabeçalhos | PRO Resumos sem CSP e outras políticas defensivas | Corrigido e publicado (`07befdc`) |
| SEG-03 | Média | Privacidade | Logs de pagamentos podem registrar PII e respostas do provedor | Corrigido e publicado (`80c68dd`) |
| SEG-04 | Média | Disponibilidade | Importação administrativa sem limite explícito de corpo | Corrigido e publicado (`dda5a45`) |
| FUN-02 | Baixa | HTTP | Página protegida usa soft redirect com status inicial 200 | Corrigido e publicado (`d95949c`) |
| A11Y-01 | Baixa | Acessibilidade | Rótulo do botão móvel não acompanha o estado expandido | Corrigido e publicado (`3ff7630`) |
| UX-01 | Baixa | Experiência | Mensagem de erro expõe detalhes internos de migrations | Corrigido e publicado (`9fc4d52`) |
| SEG-05 | Média | Notas | Imagens Base64 e limites insuficientes no fluxo de notas | Corrigido e publicado (`a24f081`) |
| SEG-06 | Média | Webhooks | Limite aplicado somente após a leitura integral do corpo | Corrigido e publicado (`fccf745`) |
| FUN-03 | Média | Conteúdo | Mermaid cercado no Markdown exibido como código bruto | Corrigido e publicado (`e719912`) |

### Progresso das correções

Até 12 de setembro de 2026, os onze itens priorizados acima foram corrigidos, validados e publicados em `main`. O deploy de produção mais recente foi confirmado no Netlify com estado `ready`, ID `6aa5ecce22ac980008a14c59` e `commit_ref` `e719912483b8ffaee3419fdfb6b23c91f1c189d4`.

No encerramento do FUN-03, o smoke autenticado em `https://proconcursos.com.br/resumos/estatistica` confirmou:

- o bloco cercado `mermaid` da primeira seção convertido em SVG navegável, sem código bruto visível;
- o mapa estruturado da última seção preservado;
- ausência de overflow horizontal da página em 390 × 844 (`scrollWidth = clientWidth = 390`);
- renderização funcional nos temas Light, Dark e Sepia;
- fallback textual recolhido e console sem erros ou avisos;
- `npm run lint`, `npx tsc --noEmit`, build Webpack, testes de conteúdo, autenticação e regressão Mermaid aprovados;
- `npm audit --omit=dev` sem vulnerabilidades de produção.

Risco remanescente específico do FUN-03: diagramas cercados ainda entram no contrato como Markdown genérico. A validação compartilhada bloqueia conteúdo inseguro antes da renderização, mas a normalização futura para `mermaid_mindmap` permitiria rejeição antecipada também na ingestão.

## 4. Achados detalhados

### SEG-01 — Next.js vulnerável

**Severidade:** crítica
**Evidência:** `package.json` fixa `next` em `16.3.0`; o build confirmou `Next.js 16.3.0`. O `npm audit --omit=dev` encontrou uma vulnerabilidade crítica direta em `next`, uma alta transitiva em `sharp` e uma moderada transitiva em `baseline-browser-mapping`.

Advisories relevantes:

- [RCE na otimização de imagens AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4), afetando versões anteriores a `16.3.3`;
- [RCE em servidores hospedados no Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36), afetando Next.js `>=16.0 <16.3.3`.

O segundo advisory é específico para filesystem Windows e não aparenta ser diretamente explorável no deploy Netlify/Linux. Isso não elimina a necessidade de atualização: o advisory de AVIF e a dependência `sharp` continuam relevantes, e o projeto permanece fora da versão corrigida.

**Impacto:** comprometimento potencial de confidencialidade, integridade e disponibilidade, dependendo da configuração efetiva do otimizador de imagens e do ambiente de execução.

**Recomendação:**

1. atualizar Next.js para `16.3.4` ou versão posterior compatível;
2. atualizar o lockfile sem mudança de major desnecessária;
3. repetir `npm audit --omit=dev`, lint, TypeScript, testes e build;
4. validar imagens, autenticação, rotas dinâmicas, Netlify Functions e Edge;
5. publicar primeiro em branch de homologação e executar smoke test antes da promoção.

### FUN-01 — Preferências quebradas em produção

**Severidade:** alta
**Evidência ao vivo:** `/resumos/dashboard/configuracoes` informa que as preferências não podem ser salvas e mantém o botão **Salvar preferências** desabilitado. O dashboard, simultaneamente, mostra `27 ocultas`, impedindo o usuário de corrigir sua seleção.

O código considera as preferências indisponíveis quando falta a tabela `user_dashboard_preferences` ou quando faltam as colunas `start_module`/`start_discipline`. Como o dashboard conseguiu ler uma seleção existente de `visible_disciplines`, a hipótese mais provável é:

- migration `005` já aplicada;
- migration `020` ausente ou schema cache ainda não atualizado.

**Impacto:** bloqueio funcional permanente das preferências; divergência entre estado salvo e interface; suporte desnecessário e perda de confiança do usuário.

**Recomendação:**

1. consultar o histórico remoto de migrations e a estrutura efetiva da tabela;
2. confirmar a presença de `start_module` e `start_discipline`;
3. aplicar somente a migration pendente, após preflight e backup apropriado;
4. recarregar o schema cache, se necessário;
5. testar salvar, recarregar, logout/login e cada destino inicial;
6. substituir a mensagem técnica por texto genérico para o usuário e alerta detalhado em observabilidade administrativa.

Arquivos relacionados:

- `src/app/dashboard/configuracoes/page.tsx`;
- `src/app/actions/dashboard-preferences.ts`;
- `supabase/migrations/005_create_user_dashboard_preferences.sql`;
- `supabase/migrations/020_add_user_start_page_preference.sql`.

### SEG-02 — Cabeçalhos defensivos ausentes no PRO Resumos

**Severidade:** média
**Evidência ao vivo no PRO Resumos:**

- TLS 1.3: presente;
- HSTS: `max-age=31536000`;
- `X-Content-Type-Options: nosniff`: presente;
- Content Security Policy: ausente;
- `Referrer-Policy`: ausente;
- `Permissions-Policy`: ausente;
- proteção explícita contra framing: ausente;
- `X-Powered-By: Next.js`: presente.

O PRO Legis, no mesmo domínio, já entrega:

- `Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'`;
- `Permissions-Policy: camera=(), geolocation=(), microphone=()`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: DENY`;
- `X-Content-Type-Options: nosniff`.

**Impacto:** redução da defesa em profundidade contra XSS, clickjacking, abuso de recursos do navegador e vazamento de referrer. A ausência não demonstra exploração, mas é relevante em uma aplicação que renderiza conteúdo dinâmico, Markdown, KaTeX e SVG Mermaid.

**Recomendação:** usar `headers()` em `next.config.ts` para alinhar o PRO Resumos ao baseline do PRO Legis e definir `poweredByHeader: false`. A CSP deve ser implantada incrementalmente e testada contra Supabase, OAuth, Mermaid, KaTeX e recursos do Netlify. Não adicionar `includeSubDomains`/`preload` ao HSTS sem antes confirmar HTTPS em todos os subdomínios.

Referência: [documentação oficial de headers do Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers).

### SEG-03 — Logs excessivos na integração de pagamentos

**Severidade:** média
**Evidência:** `src/lib/payments/providers.ts` contém logs marcados como temporários que:

- registram até 2.000 caracteres do corpo bruto de respostas de erro;
- registram o payload de checkout com UUID externo e parte do e-mail do pagador.

**Impacto:** respostas de provedores podem conter PII, identificadores, detalhes de cobrança ou outros dados que não devem permanecer em logs do Netlify. Mesmo e-mail truncado continua sendo dado pessoal.

**Recomendação:** remover os logs temporários e manter somente campos allowlisted, como provedor, status HTTP, categoria interna e código normalizado. Nunca registrar corpo bruto, payload, UUID, e-mail, token ou segredo.

### SEG-04 — Corpo de importação sem limite explícito

**Severidade:** média
**Evidência:** `POST /api/import` autentica o Bearer Token e depois usa `request.json()` diretamente. Não há verificação de `Content-Type`, `Content-Length` nem limite por streaming.

**Impacto:** o endpoint não está aberto ao público, mas um token comprometido ou um cliente administrativo defeituoso pode provocar consumo excessivo de memória e indisponibilidade.

**Recomendação:** reutilizar o padrão de `src/lib/request-body.mjs`, com limite compatível com o maior payload jurídico real, `Content-Type: application/json` obrigatório e resposta `413` para excesso. Preservar a validação Zod atual.

### FUN-02 — Soft redirect em página de estudo protegida

**Severidade:** baixa
**Evidência:** uma requisição anônima a `/resumos/despesa-publica` retorna status inicial `200`, mas o HTML contém instrução `NEXT_REDIRECT` para `/resumos/login` e não contém o título ou o conteúdo do resumo.

**Conclusão:** não foi demonstrado vazamento de conteúdo pago. O comportamento decorre do redirect durante streaming do App Router.

**Recomendação:** avaliar autenticação anterior ao início do streaming para produzir um `307` explícito. A alteração deve evitar duplicação de consultas e preservar a renovação de cookies do Supabase.

### A11Y-01 — Rótulo do menu móvel inconsistente

**Severidade:** baixa
**Evidência:** depois de expandido, o botão principal continua exposto à árvore de acessibilidade como **Abrir navegação**, embora o painel esteja aberto.

**Recomendação:** alternar `aria-label` e título entre **Abrir navegação** e **Fechar navegação** conforme o estado.

### UX-01 — Detalhes internos exibidos ao usuário

**Severidade:** baixa
**Evidência:** a tela de configurações instrui o usuário a aplicar migrations `005` e `020`.

**Recomendação:** mostrar mensagem funcional, por exemplo: “As preferências estão temporariamente indisponíveis.” O diagnóstico de tabela/coluna/migration deve permanecer apenas em logs sanitizados ou monitoramento administrativo.

## 5. Controles validados positivamente

- Login Google funcional.
- MFA TOTP funcional.
- Acesso administrativo condicionado a `aal2`.
- Dashboard anônimo redireciona para login com HTTP `307`.
- PRO Legis e fila editorial anônimos redirecionam para login.
- API de realces anônima responde `401`.
- O HTML anônimo do resumo testado não contém conteúdo pago.
- Acesso ao conteúdo é validado server-side por `requireContentAccess()`.
- A autorização do banco combina entitlement ativo ou administrador com `aal2`.
- Dados pessoais usam filtros por usuário e políticas RLS.
- Bearer Token administrativo exige segredo mínimo e comparação constante.
- Markdown usa `react-markdown` sem `rehype-raw`.
- KaTeX está configurado com `trust: false`.
- Mermaid permanece client-only, com `securityLevel: "strict"`, `htmlLabels: false`, DOMPurify, tags/atributos proibidos e inserção por `replaceChildren()`.
- A importação valida estrutura, IDs, flashcards, gráficos e Mermaid com Zod e validadores compartilhados.
- Webhooks validam assinatura, plano esperado, usuário e idempotência.
- Checkout valida mesma origem e restringe URLs externas aos provedores esperados.
- Dashboard e página de estudo apresentaram layout responsivo sem overflow horizontal evidente no viewport testado.
- Temas Light, Dark e Sepia alternaram corretamente; o tema Light original foi restaurado.

## 6. Validações executadas

| Verificação | Resultado |
|---|---|
| Login Google | Aprovado |
| MFA administrativo | Aprovado |
| Navegação autenticada principal | Aprovada, exceto configurações |
| Desktop | Aprovado visualmente |
| Mobile 390 × 844 | Aprovado visualmente, com ressalva A11Y-01 |
| Light/Dark/Sepia | Aprovado |
| Testes automatizados integrais | 65 aprovados, 0 falhas |
| `npm run lint` | Aprovado |
| `npx tsc --noEmit` | Aprovado |
| `npm run build -- --webpack` | Aprovado |
| `npm audit --omit=dev` | 1 crítica, 1 alta, 1 moderada |
| TLS | TLS 1.3 |
| Acesso anônimo ao conteúdo | Conteúdo não exposto no caso testado |

## 7. Limitações e riscos remanescentes

Não foram executados:

- teste remoto negativo com dois usuários para confirmar isolamento prático entre contas;
- gravação e exclusão real de notas, progresso e realces;
- salvamento de preferências, pois a função está bloqueada em produção;
- checkout ou cancelamento em Mercado Pago/PayPal;
- chamadas destrutivas de tópicos e seções;
- carga, fuzzing, força bruta, CAPTCHA ou exploração de advisories;
- auditoria da configuração interna do painel Supabase, Netlify ou provedores de pagamento;
- verificação de backups, restauração, alertas, retenção de logs e resposta a incidentes.

Os testes locais foram executados sobre uma árvore Git que já continha modificações e arquivos não rastreados. Essas alterações preexistentes foram preservadas e não fazem parte deste relatório.

## 8. Plano recomendado

### Etapa 1 — Correções urgentes

- [x] Atualizar Next.js para versão corrigida.
- [x] Repetir auditoria, testes, build e smoke test publicado.
- [x] Auditar o estado remoto do Supabase e aplicar a migration `020`, confirmada como pendente.

### Etapa 2 — Hardening

- [x] Remover logs sensíveis de pagamentos.
- [x] Limitar o corpo da API de importação.
- [x] Aplicar cabeçalhos defensivos ao PRO Resumos.
- [x] Padronizar respostas de erro administrativas sem detalhes internos.

### Etapa 3 — Regressão funcional e segurança prática

- [x] Testar preferências de ponta a ponta após a migration.
- [ ] Testar notas, progresso e realces com duas contas distintas.
- [ ] Executar checkout em sandbox e verificar logs sanitizados.
- [x] Validar CSP em Light, Dark e Sepia, Mermaid, KaTeX, OAuth e Netlify.
- [x] Confirmar redirects, cache, Functions e endpoints no deploy final.

## 9. Critério de encerramento

A auditoria deve ser considerada tratada quando todos os critérios abaixo estiverem concluídos:

- [x] `npm audit --omit=dev` não apresentar vulnerabilidade crítica ou alta aplicável;
- [x] preferências serem salvas e recuperadas após novo login;
- [x] PRO Resumos entregar o baseline de cabeçalhos aprovado;
- [x] logs de pagamento não incluírem PII, payloads ou corpos brutos;
- [x] importações excessivas retornarem `413` sem consumo descontrolado;
- [ ] testes com dois usuários demonstrarem isolamento de dados;
- [x] a versão publicada e o commit remoto serem confirmados após o deploy.

**Estado geral:** 11 achados corrigidos e publicados; encerramento integral ainda depende do teste negativo com duas contas e do checkout em sandbox previsto na Etapa 3.
