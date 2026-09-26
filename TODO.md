# TODO — Segurança, pagamentos e operação

Atualizado em: 26 de setembro de 2026.

Este documento consolida as pendências futuras identificadas nas revisões de segurança e lançamento. Implementações concluídas ficam no final para evitar regressões e retrabalho. Estados externos de Supabase, Netlify e provedores precisam ser reconfirmados quando a data da evidência estiver indicada.

## P0 — Antes do primeiro usuário pagante

### Pagamentos e entitlements

- [ ] Impedir novo checkout quando existir assinatura `pending` ou `past_due`: consultar e reconciliar o vínculo atual no provedor antes de permitir outra assinatura, evitando substituir a única linha de `user_entitlements` enquanto a assinatura anterior ainda pode cobrar.
- [ ] Exigir `PAYPAL_ENVIRONMENT` com valor explícito `sandbox` ou `live`, falhar fechado em valor ausente/inválido e incluí-lo na condição que habilita o PayPal na interface.
- [ ] Confirmar no ambiente de produção as credenciais, plano, preço e URLs de webhook dos provedores sem registrar ou expor segredos.
- [ ] Confirmar no histórico da Netlify que a função agendada `reconcile-payments` executa diariamente com sucesso e que `PAYMENTS_RECONCILIATION_TOKEN` está configurado no escopo correto.
- [ ] Registrar auditoria sem tokens, dados de cartão, payloads completos ou informações pessoais desnecessárias.
- [ ] Configurar alertas para falhas reiteradas de webhook, divergências de reconciliação e concessões/revogações anormais.
- [ ] Testar nos sandboxes: pagamento aprovado, recusado, pendente, duplicado, cancelado, expirado e estornado.
- [ ] Executar canário financeiro real somente depois de todos os gates P0, com confirmação humana imediatamente antes da transação, e validar cobrança, webhook, entitlement, cancelamento e ausência de renovação indevida.

### Plano e segurança do Supabase

- [ ] Reconfirmar o plano atual da organização e realizar o upgrade necessário antes de aceitar pagamentos; a última confirmação da Management API, em 16/09/2026, indicava plano Free.
- [ ] Reconfirmar e ativar a proteção contra senhas vazadas; a última confirmação, em 16/09/2026, indicava `password_hibp_enabled = false`.
- [ ] Definir backup e retenção compatíveis com usuários pagantes; em 26/09/2026 a CLI ainda não listava backup recuperável e indicava PITR desativado.
- [ ] Executar e documentar pelo menos um teste de restauração antes do canário financeiro; existência de backup sem restauração comprovada não encerra este gate.
- [ ] Confirmar na Netlify a chave publishable atual do Supabase e remover qualquer chave legada desativada dos ambientes local, preview e produção, sem registrar seus valores.

### Hospedagem e publicação

- [ ] Confirmar `CONTENT_ADMIN_TOKEN` em todos os escopos necessários da hospedagem, sempre como segredo server-side e nunca com prefixo `NEXT_PUBLIC_`.
- [ ] Configurar `CONTENT_ADMIN_TOKEN` antes de voltar a usar a rota HTTP administrativa `/api/import`; enquanto ausente, importações devem ocorrer somente por procedimento backend controlado e auditado.
- [ ] Confirmar que `SUPABASE_SERVICE_ROLE_KEY` existe somente no backend e não é disponibilizada em previews públicos ou bundles client-side.
- [ ] Executar smoke autenticado pós-deploy em `/admin`, `/dashboard`, `/dashboard/conta`, `/dashboard/assinatura`, `/dashboard/planner` e em uma página de estudo, cobrindo desktop, mobile e os temas Light, Dark e Sepia.
- [ ] Testar em produção uma conta sem entitlement, uma assinatura ativa, uma expirada e o administrador com AAL1/AAL2.

## P1 — Hardening após a integração inicial

### Autorização e testes

- [ ] Automatizar testes de leitura do acervo para `anon`, autenticado sem assinatura, assinatura ativa, assinatura expirada, admin AAL1 e admin AAL2.
- [ ] Executar e registrar `supabase/scripts/fase3_validacao_rls.sql` sobre o schema atual, incluindo a migration 026, e repeti-lo após toda futura mudança de schema, grants ou policies.
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
- [ ] Documentar recuperação da conta administrativa e do TOTP sem criar senha fixa, bypass público ou segredo alternativo no frontend.
- [ ] Revisar periodicamente quem possui role administrativa em `app_metadata` e remover acessos não utilizados.

### Dados pessoais e privacidade

- [ ] Impor limite de bytes antes de ler o JSON público de `POST /api/privacy-requests`; o limite de caracteres após `request.json()` não protege o processo contra corpo excessivo.
- [ ] Substituir ou complementar o limite por e-mail do canal LGPD com controle distribuído por origem/sessão e proteção contra abuso que não dependa de memória local do processo serverless.
- [ ] Criar fila, alerta e procedimento operacional para atender protocolos LGPD, confirmar identidade, registrar decisão e cumprir o prazo informado ao titular.
- [ ] Reavaliar a decisão de manter notas e imagens em texto puro antes de permitir documentos sensíveis, compartilhamento ou uso corporativo.
- [ ] Informar claramente ao usuário que notas atuais não possuem criptografia ponta a ponta e não devem conter senhas, cartões ou documentos sigilosos.
- [ ] Definir política de retenção, exportação e exclusão de notas, imagens e dados de progresso.
- [ ] Avaliar criptografia de aplicação somente quando houver modelo de ameaça e fluxo de recuperação de chaves definidos; não adicionar criptografia improvisada.

## P2 — Operação contínua

- [ ] Avaliar Stripe ou Pagar.me somente se Mercado Pago ou PayPal não atenderem a uma necessidade comercial comprovada; evitar três integrações simultâneas no lançamento.
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

- [x] Implementar Mercado Pago e PayPal como opções de assinatura mensal em checkout hospedado, sem receber ou armazenar número completo do cartão ou CVV.
- [x] Criar webhooks server-side com validação criptográfica, reconsulta à API oficial, idempotência por `provider + event_id` e ordenação temporal baseada em estado confiável.
- [x] Mapear os estados dos provedores e atualizar `user_entitlements` somente no backend, vinculando assinatura e pagamento ao UUID confirmado do Supabase Auth.
- [x] Implementar cancelamento no provedor preservando apenas o período já pago e bloqueio persistente por reembolso, reversão ou chargeback nos dois provedores.
- [x] Implementar reconciliação diária no código por função agendada da Netlify; a comprovação operacional das execuções permanece em P0.
- [x] Corrigir a CSP para permitir somente os hosts de checkout já aceitos pela allowlist do backend.
- [x] Corrigir os CTAs de assinatura para preservar o destino após o login e informar com precisão que senha Google e dados completos do cartão permanecem nos respectivos provedores.
- [x] Registrar fornecedor, preço de lançamento de R$ 9,90 por mês, atendimento e direito de arrependimento de sete dias nas páginas institucionais e na documentação comercial.
- [x] Criar área de Conta separada das preferências de estudo, com segurança da conta, assinatura e canal LGPD público/autenticado com protocolo.
- [x] Publicar as superfícies de Conta, cancelamento e solicitações LGPD; em 26/09/2026 as rotas públicas responderam conforme esperado para usuário sem sessão ou método não permitido.
- [x] Confirmar em produção senha mínima de 12 caracteres com minúscula, maiúscula e número, reautenticação para troca de senha e TOTP habilitado em 16/09/2026.
- [x] Aplicar remotamente as migrations 024 e 025 e executar teste negativo com dois usuários reais, cobrindo dados pessoais, entitlements e bloqueio contra reativação após chargeback.
- [x] Aplicar remotamente a migration 026 do Planner e estender o teste com dois usuários para impedir leitura, alteração ou associação cruzada de planos e blocos; fixtures temporárias removidas ao final.
- [x] Restringir grants do Data API por menor privilégio.
- [x] Separar `CONTENT_ADMIN_TOKEN` da Supabase Service Role.
- [x] Proteger endpoints administrativos no backend com Bearer Token dedicado.
- [x] Corrigir o `search_path` de `public.update_updated_at_column()`.
- [x] Reconciliar o histórico remoto das migrations `001` a `009`.
- [x] Ativar e exigir TOTP/AAL2 para a conta administrativa.
- [x] Criar `user_entitlements` e bloquear `topics/sections` para usuários sem assinatura ativa.
- [x] Centralizar a autorização do acervo em uma DAL `server-only`.
- [x] Manter RLS de notas, progresso e preferências baseado em `auth.uid()`.
