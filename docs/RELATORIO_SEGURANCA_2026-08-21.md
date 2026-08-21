# Relatório de segurança — PRO Concursos

Data da revisão: 21/08/2026
Escopo: `C:\PRO\site` (PRO Resumos), `C:\PRO\legis` (PRO Legis), migrations compartilhadas do Supabase e superfícies públicas em `https://proconcursos.com.br/resumos` e `https://proconcursos.com.br/legis`.

## Conclusão executiva

O estado técnico é adequado para continuar uma homologação controlada, mas ainda não para receber o primeiro pagamento real. A aplicação já possui controles relevantes: autenticação Supabase validada no servidor, entitlement central, RLS, MFA AAL2 para administração editorial, separação entre token administrativo e chave privilegiada, validação de payload, proteção same-origin nas mutações pessoais e renderização defensiva de Markdown/Mermaid.

O lançamento comercial deve permanecer bloqueado até que pagamentos e webhooks sejam implementados, o estado remoto das migrations/RLS seja validado e os cenários autenticados de produção sejam testados. Os itens mais importantes fora do fluxo de cobrança são os headers incompletos no PRO Resumos, ausência de rate limit e auditoria nas APIs administrativas e exposição de mensagens internas em respostas `500` dessas APIs.

Classificação final: **GO para homologação; NO-GO para cobrança em produção**.

## Evidências positivas confirmadas

- `private.has_active_content_access()` concede acesso somente a entitlement `active`/`trialing` vigente ou a administrador com AAL2; `topics` e `sections` repetem a decisão no RLS (`supabase/migrations/009_enforce_paid_content_access.sql`).
- Páginas de conteúdo do Resumos usam a DAL `requireContentAccess()`; o Legis usa a mesma RPC nas páginas e APIs.
- Dados pessoais possuem RLS por `auth.uid()` e filtros explícitos por `user_id` nas operações mais sensíveis.
- O workflow Legis separa importação, revisão e publicação; revisor e publicador usam permissões distintas e MFA AAL2.
- O importador valida o Bearer Token antes de ler o corpo; a comparação é constant-time e exige segredo com pelo menos 32 bytes.
- Markdown é renderizado sem HTML bruto. Mermaid permanece client-only, `securityLevel: "strict"`, `htmlLabels: false`, passa por DOMPurify e entra no DOM com `replaceChildren()`.
- Nenhum `.env` ou candidato evidente a segredo está versionado nos dois repositórios.
- `npm audit --omit=dev` reportou zero vulnerabilidades conhecidas nos dois projetos na data da revisão.
- Em produção, acessos anônimos a `/resumos/dashboard`, `/legis` e `/legis/editorial` foram redirecionados para login.

## Achados e recomendações

### P0 — bloqueadores do primeiro pagamento

| Achado | Evidência/impacto | Correção exigida |
|---|---|---|
| Cobrança não está integrada ao entitlement | Não existem checkout, webhooks, ledger idempotente nem reconciliação. A tela de assinatura informa corretamente essa ausência. | Implementar o plano descrito em `PLANO_LANCAMENTO_PAGAMENTOS.md` antes de habilitar botões reais. |
| Estado remoto do banco não foi revalidado nesta revisão | As migrations locais estão corretas, mas testes locais não comprovam grants/policies do projeto hospedado. | Executar a matriz RLS no Supabase de homologação e depois em produção, incluindo dois usuários, assinatura expirada e admin AAL1/AAL2. |
| Fluxo autenticado entre Resumos e Legis ainda não foi testado ponta a ponta | O smoke público passou, mas não valida compartilhamento real de cookies, entitlement e logout. | Testar manualmente no domínio canônico com contas controladas antes do lançamento. |

### P1 — corrigir antes ou junto do lançamento

| Achado | Evidência/impacto | Correção recomendada |
|---|---|---|
| Headers defensivos incompletos no Resumos | Em produção, `/resumos` enviou apenas `X-Content-Type-Options`; o Legis também envia anti-framing, referrer, permissions policy e CSP parcial. | Centralizar headers no `next.config.ts` do Resumos e testar base path, assets, OAuth, Mermaid e temas. Implantar CSP completa por etapas, começando em report-only se necessário. |
| APIs administrativas sem rate limit distribuído | `/api/import` e os DELETEs dependem de um Bearer Token forte, mas tentativas e abuso não são limitados. | Aplicar rate limit na borda ou armazenamento compartilhado, resposta `429` com `Retry-After` e alerta de anomalias. Não usar memória do processo serverless. |
| APIs administrativas devolvem detalhes internos | Os catches de importação/exclusão retornam `details: err.message`, o que pode expor nomes de tabela, restrições ou comportamento interno. | Responder mensagem pública genérica e registrar somente código/correlation ID em log protegido. |
| Falta ledger/auditoria de operações administrativas | Exclusões e importações não deixam trilha operacional estruturada. | Registrar ator de integração, ação, objeto, resultado, timestamp e correlation ID, sem token ou payload integral. |
| Política de senha do formulário não é controle suficiente | Os 12 caracteres e composição são verificados no cliente; o estado equivalente no Supabase hospedado não foi comprovado. | Confirmar política no painel/Management API e habilitar proteção contra senhas vazadas após upgrade do plano. |
| Cadastro público está aberto sem proteção antiabuso comprovada | Resumos e Legis permitem `signUp`, magic link e Google. Isso é compatível com aquisição, mas pode gerar contas/e-mails abusivos. | Configurar SMTP próprio, limites, CAPTCHA quando aplicável, monitoramento de Auth e resposta uniforme contra enumeração. |

### P2 — hardening e redução de risco residual

| Achado | Evidência/impacto | Recomendação |
|---|---|---|
| CSP do Legis é útil, porém parcial | Restringe `base-uri`, `object-src`, `frame-ancestors` e `form-action`, mas não define `default-src`, `script-src`, `connect-src`, `img-src` ou `style-src`. | Evoluir com nonces/hashes compatíveis com Next.js e Supabase, primeiro em report-only; não liberar `unsafe-eval`. |
| Leitura canônica do Legis usa cliente administrativo em cache | Após o gate e uma consulta RLS, `law-reader-data.ts` usa chave privilegiada para índice/artigo. Um erro futuro no encadeamento ampliaria o impacto. | Preferir uma RPC `SECURITY DEFINER` estreita que aceite somente versão publicada/autorizada, ou documentar e testar formalmente a pré-condição antes de cada leitura privilegiada. |
| Ausência de política operacional completa | Não há evidência de alertas, SLO, runbook de incidente, restauração testada e rotação periódica de segredos. | Definir responsáveis, retenção de logs, rotação, backup/PITR, restauração e resposta a comprometimento/entitlement incorreto. |
| Decisão de acesso a dados pessoais após expiração precisa ser explícita | O Legis documenta portabilidade de dados pessoais após expiração; o pedido atual sugere bloquear toda a área. | Manter uma área mínima de conta/exportação/exclusão ou documentar juridicamente outra decisão. Nunca depender apenas de esconder navegação. |

## Verificações executadas

### PRO Resumos

- 31 testes automatizados aprovados (`test:content`, `test:api-auth`, `test:site-paths`, `test:highlights`).
- `npm run lint`: aprovado.
- `npx tsc --noEmit`: aprovado.
- `npm run build -- --webpack`: aprovado.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- Busca por sinks perigosos: somente fixture maliciosa de teste; nenhum sink novo em `src`.

### PRO Legis

- 46 testes automatizados aprovados.
- `npm run lint`, `npm run typecheck` e `npm run build -- --webpack`: aprovados.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- `npm run smoke:production`: aprovado em todas as verificações públicas.
- Busca por sinks perigosos: nenhum resultado em código de aplicação.

## Limitações da revisão

- Não foram usados segredos, contas reais ou chamadas pagas.
- Não foi inspecionado o painel remoto do Supabase, Netlify, Mercado Pago ou PayPal.
- Não foram executados testes autenticados em produção, pentest ativo, DAST, carga ou restauração de backup.
- `npm audit` cobre advisories conhecidos; não prova ausência de vulnerabilidades lógicas ou ainda não publicadas.

## Critério de aceite de segurança para lançamento

1. Pagamentos e webhooks idempotentes aprovados em sandbox e produção controlada.
2. Matriz RLS remota aprovada com dois usuários e todos os estados de entitlement.
3. Conta sem assinatura não lê Resumos nem Legis por página, API ou Data API.
4. Admin/revisor/publicador exigem `role=admin`, permissão específica quando aplicável e MFA AAL2.
5. Headers defensivos do Resumos implantados sem regressão.
6. APIs administrativas com rate limit, erros públicos genéricos e auditoria.
7. Smoke autenticado cross-zone, cancelamento, expiração, estorno e reconciliação aprovados.
8. Backup/restauração, alertas e runbook de incidente testados.
