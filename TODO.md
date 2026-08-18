# TODO — Segurança, pagamentos e operação

Este documento consolida somente pendências futuras identificadas nas revisões de segurança. Itens concluídos ficam no final para evitar regressões e retrabalho.

## P0 — Antes do primeiro usuário pagante

### Pagamentos e entitlements

- [ ] Definir o lançamento inicial com Mercado Pago como provedor principal no Brasil e decidir se o PayPal entra no lançamento ou em uma segunda etapa.
- [ ] Avaliar Stripe ou Pagar.me apenas se houver necessidade comercial não atendida; evitar três integrações simultâneas no primeiro lançamento.
- [ ] Implementar checkout exclusivamente pelos SDKs ou páginas hospedadas dos provedores, sem receber ou armazenar dados de cartão no PRO Resumos.
- [ ] Criar Route Handlers server-side separados para os webhooks do Mercado Pago e do PayPal.
- [ ] Validar a assinatura criptográfica de cada webhook usando o corpo bruto da requisição e a documentação vigente do provedor.
- [ ] Consultar o evento ou pagamento na API oficial do provedor antes de conceder acesso; nunca confiar em `status`, preço, plano ou `user_id` enviados pelo navegador.
- [ ] Criar persistência idempotente de eventos por `provider + event_id`, impedindo processamento duplicado e replay.
- [ ] Mapear os estados dos provedores para `active`, `trialing`, `pending`, `past_due`, `canceled` e `expired` em `public.user_entitlements`.
- [ ] Atualizar `user_entitlements` somente no backend com `service_role`, vinculando o pagamento ao UUID confirmado do Supabase Auth.
- [ ] Tratar renovação, atraso, cancelamento, expiração, estorno, chargeback e eventos recebidos fora de ordem.
- [ ] Implementar reconciliação periódica entre o banco e as APIs dos provedores para corrigir webhooks perdidos.
- [ ] Registrar auditoria sem tokens, dados de cartão, payloads completos ou informações pessoais desnecessárias.
- [ ] Configurar alertas para falhas reiteradas de webhook, divergências de reconciliação e concessões/revogações anormais.
- [ ] Testar nos sandboxes: pagamento aprovado, recusado, pendente, duplicado, cancelado, expirado e estornado.

### Plano e segurança do Supabase

- [ ] Antes de aceitar pagamentos, revisar o plano do Supabase e realizar o upgrade necessário.
- [ ] Ativar a proteção contra senhas vazadas assim que o plano contratado disponibilizar o recurso.
- [ ] Confirmar no ambiente de produção a política mínima de senha e manter MFA obrigatório para contas administrativas.
- [ ] Definir backup, retenção e recuperação compatíveis com usuários pagantes; avaliar PITR conforme o plano contratado.

### Hospedagem e publicação

- [ ] Confirmar `CONTENT_ADMIN_TOKEN` em todos os escopos necessários da hospedagem, sempre como segredo server-side e nunca com prefixo `NEXT_PUBLIC_`.
- [ ] Confirmar que `SUPABASE_SERVICE_ROLE_KEY` existe somente no backend e não é disponibilizada em previews públicos ou bundles client-side.
- [ ] Validar o deploy da branch publicada e executar smoke tests em `/admin`, `/dashboard`, `/dashboard/assinatura` e em uma página de estudo.
- [ ] Testar em produção uma conta sem entitlement, uma assinatura ativa, uma expirada e o administrador com AAL1/AAL2.

## P1 — Hardening após a integração inicial

### Autorização e testes

- [ ] Criar testes de integração RLS negativos com dois usuários distintos, garantindo que nenhum deles leia ou altere notas, progresso, preferências ou entitlement do outro.
- [ ] Automatizar testes de leitura do acervo para `anon`, autenticado sem assinatura, assinatura ativa, assinatura expirada, admin AAL1 e admin AAL2.
- [ ] Executar `supabase/scripts/fase3_validacao_rls.sql` após toda mudança futura de schema, grants ou policies.
- [ ] Impedir em revisão de código qualquer nova policy de `topics` ou `sections` baseada apenas em `TO authenticated USING (true)`.
- [ ] Manter toda Server Action e Route Handler com autorização própria próxima ao acesso aos dados; não depender apenas de layout, botão oculto ou estado React.

### Administração e segredos

- [ ] Definir periodicidade e procedimento seguro de rotação do `CONTENT_ADMIN_TOKEN`.
- [ ] Adicionar monitoração e limitação de abuso aos endpoints administrativos sem registrar o Bearer Token.
- [ ] Manter `CONTENT_ADMIN_TOKEN` apenas para automação/CLI. Se surgir painel administrativo no navegador, autorizar suas ações no backend pela sessão Supabase, `app_metadata.role = admin` e MFA `aal2`.
- [ ] Documentar recuperação da conta administrativa e do TOTP sem criar senha fixa, bypass público ou segredo alternativo no frontend.
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
