# Plano de lançamento e pagamentos — PRO Concursos

Data: 21/08/2026
Objetivo: colocar PRO Resumos + PRO Legis em produção com uma conta e uma assinatura global, usando Mercado Pago e PayPal sem receber dados de cartão no aplicativo.

## Recomendação executiva

Lançar primeiro o Mercado Pago no Brasil e ativar o PayPal após a primeira semana estável de reconciliação, mantendo o código dos dois provedores pronto e testado antes do anúncio. Ativar simultaneamente duplica cenários de cancelamento, disputa, webhook fora de ordem e suporte. Se houver exigência comercial de ambos no primeiro dia, usar exatamente o mesmo modelo de entitlement e a mesma máquina de estados.

O checkout deve ser hospedado pelo provedor. O site cria a intenção/assinatura no backend e recebe apenas identificadores; nunca coleta, transmite ou armazena número de cartão, CVV ou token de cartão próprio.

## Decisões comerciais obrigatórias

Antes do desenvolvimento, registrar por escrito:

- preço, moeda (`BRL` no lançamento), periodicidade e nome público do plano;
- existência e duração de teste grátis;
- regra de `past_due`, período de tolerância e momento exato de revogação;
- cancelamento imediato ou ao fim do período pago;
- reembolso, chargeback, cupom e mudança de preço;
- vedação ou tratamento de duas assinaturas simultâneas para o mesmo usuário;
- termos de uso, política de privacidade/LGPD, política de cancelamento e atendimento;
- emissão fiscal/contábil e responsável por conciliação financeira.

## Arquitetura mínima

### Fonte de verdade

`public.user_entitlements` continua sendo a decisão final de acesso. O frontend nunca grava essa tabela. Somente handlers server-side, após validação do provedor, usam a chave privilegiada.

Manter a semântica atual:

- `active` e `trialing`: acesso permitido enquanto `access_until` for nulo ou futuro;
- `pending`, `past_due`, `canceled` e `expired`: acesso negado, salvo se a regra comercial definir tolerância futura em `access_until`;
- admin editorial: acesso somente com `app_metadata.role = "admin"` e AAL2.

### Persistência adicional

Criar migration no histórico canônico `C:\PRO\site\supabase\migrations` para:

1. `billing_checkout_sessions`: vincular um UUID autenticado a uma tentativa de checkout, provedor, plano, estado aleatório, expiração e identificador externo.
2. `billing_webhook_events`: chave única `(provider, event_id)`, tipo, resource ID, hash do payload, timestamps de recebimento/processamento, resultado e código de erro. Não guardar payload integral indefinidamente.
3. Campos de controle em `user_entitlements` ou tabela `billing_subscriptions`: `plan_code`, `provider_customer_id`, `provider_updated_at`, `current_period_end`, `cancel_at_period_end` e motivo técnico normalizado.

Se `user_entitlements.user_id` continuar como chave primária, o produto deve impedir duas assinaturas ativas por usuário. Caso a empresa queira múltiplas assinaturas futuras, criar `billing_subscriptions` como histórico N:1 e derivar um único entitlement agregado.

## Máquina de processamento do webhook

1. Receber HTTPS e impor limite pequeno de body.
2. Validar assinatura do provedor antes de processar.
3. Inserir o `event_id` no ledger; duplicata retorna `2xx` sem reaplicar efeito.
4. Consultar assinatura/pagamento diretamente na API oficial.
5. Validar ambiente, conta recebedora, plan ID, moeda, valor e identificador da assinatura.
6. Resolver o usuário somente por vínculo criado no backend; não confiar em `user_id` vindo do browser.
7. Ignorar evento mais antigo que `provider_updated_at` já aplicado.
8. Atualizar assinatura, entitlement e auditoria em transação.
9. Responder rapidamente; tarefas lentas seguem para processamento assíncrono confiável.
10. Reconciliar periodicamente todas as assinaturas não terminais e eventos com erro.

## Mercado Pago

### Configuração externa

1. Criar uma aplicação própria em **Suas integrações**.
2. Configurar primeiro credenciais de teste e contas/cartões de teste.
3. Criar um plano mensal pela API `/preapproval_plan` ou assinatura controlada via `/preapproval`; registrar o ID do plano por ambiente.
4. Configurar URL de retorno canônica e HTTPS.
5. Cadastrar webhook de produção para os tópicos necessários, no mínimo assinatura, cobrança autorizada/pagamento, estorno e chargeback.
6. Guardar Access Token e segredo do webhook somente na Netlify, server-side.
7. Ativar credenciais de produção apenas após sandbox e revisão da conta recebedora.

Variáveis sugeridas:

```text
MERCADO_PAGO_ENV=sandbox|production
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
MERCADO_PAGO_PLAN_ID=
```

Nenhuma deve usar prefixo `NEXT_PUBLIC_`. O plan ID pode ser exposto, mas mantê-lo no servidor reduz divergência de configuração.

### Implementação

- `POST /api/billing/mercado-pago/checkout`: exige sessão, cria vínculo idempotente e retorna apenas URL hospedada de aprovação.
- `POST /api/webhooks/mercado-pago`: valida `x-signature`, `x-request-id` e `data.id`, deduplica e consulta `/preapproval/{id}`, `/authorized_payments/{id}` ou `/v1/payments/{id}` conforme o evento.
- `POST /api/billing/mercado-pago/cancel`: exige sessão e confirmação; atualiza a assinatura no provedor e aguarda confirmação/reconciliação para o estado final.

Referências oficiais:

- [Visão geral de Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview)
- [API de Assinaturas](https://www.mercadopago.com.br/developers/pt/reference/online-payments/subscriptions/overview)
- [Validação de Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Credenciais de teste e produção](https://www.mercadopago.com.br/developers/pt/docs/credentials)

## PayPal

### Configuração externa

1. Criar app Business no PayPal Developer Dashboard.
2. Criar produto e plano mensal no sandbox; usar `PayPal-Request-Id` único nas criações.
3. Configurar webhook HTTPS e registrar o Webhook ID do ambiente.
4. Assinar eventos `BILLING.SUBSCRIPTION.*` e os eventos de pagamento, reembolso e reversão aplicáveis.
5. Guardar Client Secret e Webhook ID somente no servidor. O Client ID usado pelo SDK pode ser público.
6. Repetir produto, plano e webhook em produção; IDs de sandbox nunca são reutilizados.

Variáveis sugeridas:

```text
PAYPAL_ENV=sandbox|production
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_PLAN_ID=
```

### Implementação

- Preferir criação server-side da assinatura e redirecionamento para o link de aprovação. Se o botão do JavaScript SDK for usado, o backend ainda deve consultar e validar a assinatura antes de conceder acesso.
- `POST /api/billing/paypal/checkout`: exige sessão, cria vínculo idempotente, informa `plan_id` controlado no servidor e associa um identificador interno não adivinhável.
- `POST /api/webhooks/paypal`: valida a assinatura localmente ou pelo endpoint oficial `verify-webhook-signature`, usando o Webhook ID correto, e depois consulta a assinatura/pagamento.
- `POST /api/billing/paypal/cancel`: exige sessão e confirma que a assinatura pertence ao usuário antes de chamar o provedor.

Referências oficiais:

- [Integração de assinaturas](https://developer.paypal.com/subscriptions/integrate/)
- [Eventos de assinatura](https://developer.paypal.com/docs/subscriptions/reference/webhooks/)
- [Configuração e verificação de webhooks](https://developer.paypal.com/api/rest/webhooks/rest/)

## UX e área de assinatura

- Exibir preço, periodicidade, renovação automática, termos e política de cancelamento antes do redirecionamento.
- Não mostrar “ativo” com base no retorno do checkout. Exibir “processando” até confirmação server-side.
- Mostrar provedor, estado normalizado, próxima cobrança/fim de acesso e ação de cancelamento.
- Bloquear novo checkout enquanto houver sessão de compra válida ou assinatura ativa.
- Permitir retry seguro para falhas e fornecer correlation ID ao suporte.
- Manter logout, privacidade, exportação e exclusão de conta acessíveis sem assinatura.

## Testes obrigatórios

### Automatizados

- assinatura inválida, ausente, repetida e com timestamp antigo;
- body excessivo, MIME incorreto e evento desconhecido;
- evento duplicado/replay e concorrência simultânea;
- plan ID, moeda, valor e conta recebedora divergentes;
- usuário A tentando cancelar/consultar assinatura do usuário B;
- criação idempotente de checkout;
- transições `pending -> active -> past_due/canceled/expired`;
- refund/chargeback e evento fora de ordem;
- nenhuma resposta/log contém segredo ou payload sensível.

### Sandbox e produção controlada

- aprovação, recusa, pendência, renovação, cancelamento, expiração, estorno e chargeback;
- webhook temporariamente indisponível e posterior retry;
- reconciliação corrigindo evento perdido;
- entitlement efetivamente bloqueando Resumos, Legis e Data API;
- compra em mobile, desktop e nos três temas;
- dois provedores não criam acesso duplicado.

## Sequência de lançamento

1. Fechar decisões comerciais, termos, privacidade e suporte.
2. Fazer upgrade/backup do Supabase e validar restauração.
3. Implementar migrations, adaptadores de provedor e ledger idempotente.
4. Implementar Mercado Pago, testes e reconciliação.
5. Implementar PayPal sobre a mesma interface e máquina de estados.
6. Aplicar o bloqueio de acesso descrito em `PLANO_BLOQUEIO_LOGIN_ASSINATURA.md`.
7. Homologar com contas e valores de teste.
8. Ativar produção sem anúncio, realizar uma compra real de baixo risco por provedor e conferir conciliação.
9. Abrir para grupo piloto, monitorar por 48–72 horas e só então divulgar amplamente.
10. Manter kill switch para ocultar novos checkouts sem revogar assinaturas válidas.

## Critério de GO/NO-GO

GO somente se webhooks, reconciliação, RLS remota, cancelamento, suporte, políticas legais, alertas e backup estiverem aprovados. Qualquer concessão de acesso baseada apenas no navegador ou na URL de retorno é **NO-GO imediato**.
