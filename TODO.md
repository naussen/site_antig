# TODO — Segurança, pagamentos e operação

Este documento consolida somente pendências futuras identificadas nas revisões de segurança. Itens concluídos ficam no final para evitar regressões e retrabalho.

## P0 — Antes do primeiro usuário pagante

### Autenticação Google-only

- [x] Remover do login público os fluxos de cadastro, entrada, link mágico e recuperação por e-mail/senha; manter somente Google OAuth para usuários regulares.
- [x] Remover da área de Conta a criação, redefinição e troca de senha e atualizar Suporte e os documentos operacionais que anunciavam senha ou link mágico.
- [x] Migrar o acesso administrativo para Google OAuth com `app_metadata.role = admin` e MFA TOTP/AAL2; em 26/09/2026 os dois administradores tinham Google e TOTP verificado, e o formulário por senha foi removido do código.
- [x] Desabilitar no Supabase de produção o provedor de e-mail/senha após validar Google + TOTP, sem criar bypass ou conta fixa alternativa; confirmado em 26/09/2026.
- [x] Testar diretamente na API de produção que login por senha, link mágico e cadastro por e-mail são recusados com `email_provider_disabled`, mantendo Google habilitado; confirmado em 26/09/2026.
- [x] Não solicitar escopos Google adicionais aos padrões mínimos de identidade do Supabase; persistir somente os dados básicos necessários ao produto.

### Pagamentos e entitlements

- [x] Disponibilizar Mercado Pago e PayPal como opções de lançamento, mantendo uma assinatura mensal única.
- [ ] Avaliar Stripe ou Pagar.me apenas se houver necessidade comercial não atendida; evitar três integrações simultâneas no primeiro lançamento.
- [x] Implementar checkout exclusivamente por páginas hospedadas dos provedores, sem receber ou armazenar dados de cartão no PRO Resumos.
- [x] Criar Route Handlers server-side separados para os webhooks do Mercado Pago e do PayPal.
- [x] Validar criptograficamente a origem de cada webhook conforme a documentação vigente do provedor.
- [x] Consultar a assinatura na API oficial antes de conceder acesso; nunca confiar em `status`, preço, plano ou `user_id` enviados pelo navegador.
- [x] Criar persistência idempotente de eventos por `provider + event_id`, impedindo processamento duplicado e replay.
- [x] Mapear os estados dos provedores para `active`, `trialing`, `pending`, `past_due`, `canceled` e `expired` em `public.user_entitlements`.
- [x] Atualizar `user_entitlements` somente no backend com `service_role`, vinculando o pagamento ao UUID confirmado do Supabase Auth.
- [x] Tratar estados de renovação, atraso, cancelamento, expiração, estorno/reversão do PayPal e eventos recebidos fora de ordem.
- [x] Implementar bloqueio persistente por reembolso, reversão ou chargeback nos dois provedores, com vínculo verificado entre pagamento, assinatura e usuário e proteção contra reativação posterior; a política comercial de contestação continua operacional.
- [x] Implementar reconciliação periódica entre o banco e as APIs dos provedores para corrigir webhooks perdidos.
- [x] Registrar auditoria persistente e mínima de checkout e cancelamento, complementando eventos de webhook e transações verificadas, sem tokens, dados de cartão, payloads completos, e-mail ou cookies.
- [ ] Configurar alertas para falhas reiteradas de webhook, divergências de reconciliação e concessões/revogações anormais.
- [ ] Criar `OPS_ALERT_WEBHOOK_URL` na Netlify, testar recebimento sintético seguro para reconciliação e backup e registrar o responsável operacional.
- [ ] Testar nos sandboxes: pagamento aprovado, recusado, pendente, duplicado, cancelado, expirado e estornado. Em 26/09/2026 foi publicado o contexto isolado `sandbox-financeiro`, com Mercado Pago `test`, PayPal `sandbox` e URL própria confirmados no runtime. Permanecem ausentes as credenciais dos dois provedores e um Supabase de teste com Service Role própria; o preview continua fechado para checkout até esses dados serem cadastrados.

### Plano e segurança do Supabase

- [ ] Considerar upgrade do Supabase quando o site atingir aproximadamente 50 assinantes; até lá permanecer no plano Free e não depender de recursos pagos para o lançamento.
- [x] Remover a dependência operacional de proteção contra senhas vazadas: usuários regulares e administradores autenticam somente por Google, e o provedor de e-mail/senha está desabilitado. Reavaliar a proteção se senhas forem reintroduzidas após futuro upgrade.
- [x] Confirmar no ambiente de produção senha mínima de 12 caracteres com minúscula, maiúscula e número, reautenticação para troca de senha e TOTP habilitado.
- [x] Implementar backup lógico externo ao Supabase, criptografado, com retenção de 30 dias e ensaio automatizado de descriptografia, hashes e contagens; primeira cópia validada em 26/09/2026.
- [x] Copiar o backup, a chave portátil e o resumo para armazenamento fora do computador, com SHA-256 conferido; comprovado em 09/10/2026 pelo preflight do host de backup.
- [x] Executar uma restauração real em Supabase local isolado; em 09/10/2026 foram recompostas 45 tabelas/34.365 linhas, 16 usuários, 18 identidades e 1 bucket, com 98 chaves estrangeiras e 4 cenários RLS validados em 27,1 s. O ensaio não substitui PITR/backup nativo.

### Hospedagem e publicação

- [ ] Confirmar `CONTENT_ADMIN_TOKEN` em todos os escopos necessários da hospedagem, sempre como segredo server-side e nunca com prefixo `NEXT_PUBLIC_`.
- [ ] Configurar `CONTENT_ADMIN_TOKEN` antes de voltar a usar a rota HTTP administrativa `/api/import`; enquanto ausente, importações devem ocorrer somente por procedimento backend controlado e auditado.
- [ ] Confirmar que `SUPABASE_SERVICE_ROLE_KEY` existe somente no backend e não é disponibilizada em previews públicos ou bundles client-side.
- [x] Alterar a política Netlify do Site para exigir aprovação de previews não confiáveis e marcar `CONTENT_ADMIN_TOKEN`/`SUPABASE_SECRET_KEY` do PRO Legis como segredos; confirmado no painel em 09/10/2026.
- [ ] Rotacionar o `CONTENT_ADMIN_TOKEN` do PRO Legis após a inspeção autorizada que precedeu sua classificação como segredo, atualizar o consumidor legítimo e invalidar o valor anterior.
- [x] Validar o deploy da branch publicada e executar smoke tests em `/admin`, `/dashboard`, `/dashboard/assinatura` e em uma página de estudo; `origin/main`, Netlify e os gates coincidiram no SHA `fcee3c0` em 09/10/2026.
- [ ] Testar na interface de produção uma conta Google sem entitlement, uma assinatura ativa, uma expirada e o administrador com AAL1/AAL2; a matriz de banco/RLS foi automatizada e aprovada em 09/10/2026.

## P1 — Hardening após a integração inicial

### Autorização e testes

- [x] Criar teste pgTAP negativo com dois usuários distintos, cobrindo leitura e alteração de notas, progresso, preferências, entitlement e solicitações LGPD do outro.
- [x] Automatizar testes remotos de leitura do acervo para `anon`, autenticado sem assinatura, assinatura ativa, assinatura expirada/cancelada, admin AAL1 e admin AAL2; fixtures efêmeras aprovadas e removidas em 09/10/2026.
- [ ] Executar `supabase/scripts/fase3_validacao_rls.sql` após toda mudança futura de schema, grants ou policies.
- [ ] Impedir em revisão de código qualquer nova policy de `topics` ou `sections` baseada apenas em `TO authenticated USING (true)`.
- [ ] Manter toda Server Action e Route Handler com autorização própria próxima ao acesso aos dados; não depender apenas de layout, botão oculto ou estado React.

### Proteção contra IDOR e enumeração

- [ ] Adicionar testes automáticos com dois usuários comprovando que alterar o ID de nota, progresso, preferência ou entitlement nunca permite ler, atualizar ou excluir registros de terceiros.
- [ ] Exigir em toda futura rota de objeto pessoal a identidade obtida da sessão no servidor e filtrar simultaneamente por `id` e `user_id = user.id`, mantendo o RLS como segunda barreira.
- [ ] Retornar `404` tanto para objeto inexistente quanto para objeto pertencente a outro usuário, evitando revelar a existência do registro.
- [ ] Manter UUIDs aleatórios para objetos pessoais e impedir a introdução de IDs numéricos sequenciais expostos em URLs ou APIs.
- [ ] Implementar rate limit distribuído ou na borda da hospedagem para `POST /api/import` e para os `DELETE` administrativos de tópicos e seções; responder `429` com `Retry-After` e não usar memória local do processo serverless.
- [ ] Registrar auditoria das operações administrativas com ator ou integração, operação, objeto, data, origem e resultado, sem armazenar Bearer Token, JWT, cookie ou payload sensível.
- [ ] Separar credenciais por finalidade: painel humano com sessão Supabase, role administrativa e MFA `aal2`; `CONTENT_ADMIN_TOKEN` restrito a automação server-to-server, com token distinto por integração quando aplicável.
- [ ] Se futuramente for necessário impedir coleta automatizada do acervo global, reavaliar o acesso direto pelo Data API e servir o conteúdo por backend com rate limit; tratar isso como requisito antiabuso, não como IDOR.

### Administração e segredos

- [ ] Definir periodicidade e procedimento seguro de rotação do `CONTENT_ADMIN_TOKEN`.
- [ ] Adicionar monitoração e limitação de abuso aos endpoints administrativos sem registrar o Bearer Token.
- [ ] Manter `CONTENT_ADMIN_TOKEN` apenas para automação/CLI. Se surgir painel administrativo no navegador, autorizar suas ações no backend pela sessão Supabase, `app_metadata.role = admin` e MFA `aal2`.
- [x] Documentar recuperação da conta administrativa e do TOTP sem criar senha fixa, bypass público ou segredo alternativo no frontend.
- [ ] Revisar periodicamente quem possui role administrativa em `app_metadata` e remover acessos não utilizados.

### Dados pessoais e privacidade

- [ ] Reavaliar a decisão de manter notas e imagens em texto puro antes de permitir documentos sensíveis, compartilhamento ou uso corporativo.
- [ ] Informar claramente ao usuário que notas atuais não possuem criptografia ponta a ponta e não devem conter senhas, cartões ou documentos sigilosos.
- [ ] Definir política de retenção, exportação e exclusão de notas, imagens e dados de progresso.
- [ ] Avaliar criptografia de aplicação somente quando houver modelo de ameaça e fluxo de recuperação de chaves definidos; não adicionar criptografia improvisada.

## P2 — Operação contínua

- [ ] Revisar trimestralmente grants, policies RLS, funções `SECURITY DEFINER`, `search_path` e objetos novos no schema `public`.
- [ ] Monitorar dependências e aplicar atualizações de segurança do Next.js, Supabase e bibliotecas após testes de regressão.
- [ ] Criar resposta a incidentes para vazamento de token, conta administrativa comprometida e concessão incorreta de entitlement.
- [ ] Registrar métricas de autorização negada sem armazenar JWTs, cookies ou conteúdo das notas.

## Regras que não podem regredir

- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` ou `CONTENT_ADMIN_TOKEN` em Client Components, `localStorage`, HTML, logs ou variáveis `NEXT_PUBLIC_*`.
- Nunca conceder assinatura a partir de uma confirmação produzida somente pelo frontend.
- Nunca usar `user_metadata` como fonte de role ou privilégio.
- Nunca usar visibilidade de botão ou redirecionamento client-side como controle de acesso real.

## Concluído nas revisões anteriores

- [x] Restringir grants do Data API por menor privilégio.
- [x] Separar `CONTENT_ADMIN_TOKEN` da Supabase Service Role.
- [x] Proteger endpoints administrativos no backend com Bearer Token dedicado.
- [x] Corrigir o `search_path` de `public.update_updated_at_column()`.
- [x] Reconciliar o histórico remoto das migrations `001` a `009`.
- [x] Ativar e exigir TOTP/AAL2 para a conta administrativa.
- [x] Criar `user_entitlements` e bloquear `topics/sections` para usuários sem assinatura ativa.
- [x] Centralizar a autorização do acervo em uma DAL `server-only`.
- [x] Manter RLS de notas, progresso e preferências baseado em `auth.uid()`.
