# Pagamentos — Mercado Pago e PayPal

O PRO Concursos usa uma assinatura mensal única. O checkout ocorre nas páginas hospedadas dos provedores; o site não recebe nem armazena dados de cartão. O direito de acesso só é atualizado por webhooks verificados e após uma nova consulta à API oficial.

## 1. Aplicar a migration

Aplique `supabase/migrations/018_create_payment_integration.sql` no projeto Supabase compartilhado. Ela adiciona a trilha idempotente de eventos, a data da última atualização do provedor e a função atômica que mantém `user_entitlements`.

## 2. Variáveis server-side

Configure na hospedagem, nunca com prefixo `NEXT_PUBLIC_`:

```env
PAYMENTS_APP_URL=https://proconcursos.com.br/resumos
PAYMENTS_MONTHLY_PRICE_BRL=29.90
PAYMENTS_RECONCILIATION_TOKEN=

MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=

PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_PLAN_ID=
PAYPAL_WEBHOOK_ID=
```

`PAYMENTS_APP_URL` deve ser a URL pública base que realmente entrega o app, incluindo o prefixo `/resumos`. O valor não deve conter query ou fragmento; uma barra final é normalizada.

## 3. Mercado Pago

1. Crie uma aplicação em **Suas integrações** e obtenha o Access Token de teste.
2. Configure a assinatura secreta de webhook e copie-a para `MERCADO_PAGO_WEBHOOK_SECRET`.
3. Use como URL de notificação `https://SEU-DOMINIO/resumos/api/payments/webhooks/mercado-pago`.
4. Habilite os tópicos `subscription_preapproval` e `subscription_authorized_payment`.
5. Defina o preço mensal compartilhado em `PAYMENTS_MONTHLY_PRICE_BRL` com ponto decimal.
6. Valide no ambiente de teste antes de substituir pelo Access Token de produção.

O plano do Mercado Pago é criado por assinatura com recorrência mensal em BRL. O backend confere moeda, valor e pagamento aprovado novamente antes de conceder acesso; a mera autorização da assinatura não libera o acervo.

## 4. PayPal

1. Crie um REST App no PayPal Developer Dashboard.
2. Crie um produto do tipo serviço e um plano mensal em BRL com o mesmo valor de `PAYMENTS_MONTHLY_PRICE_BRL`; copie o ID do plano para `PAYPAL_PLAN_ID`.
3. Cadastre `https://SEU-DOMINIO/resumos/api/payments/webhooks/paypal` como webhook do mesmo REST App.
4. Assine os eventos `BILLING.SUBSCRIPTION.CREATED`, `ACTIVATED`, `UPDATED`, `EXPIRED`, `CANCELLED`, `SUSPENDED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, `PAYMENT.SALE.COMPLETED`, `REFUNDED` e `REVERSED`.
5. Copie o ID do webhook para `PAYPAL_WEBHOOK_ID`.
6. Mantenha `PAYPAL_ENVIRONMENT=sandbox` nos testes; altere para `live` somente junto com credenciais, plano e webhook de produção.

O plano é conferido por ID. Um evento de outro plano do mesmo aplicativo não libera acesso.

## 5. Testes de aceite

Execute:

```powershell
npm run test:payments
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

Nos sandboxes, teste: checkout cancelado, aprovação, renovação, evento duplicado, suspensão, falha de cobrança, cancelamento, expiração, reembolso e reversão. Confirme em `payment_webhook_events` que não há payloads ou dados de cartão e, em `user_entitlements`, que o UUID, provedor, assinatura, estado e validade estão corretos.

Antes de produção, configure monitoramento de respostas 5xx nos webhooks e uma reconciliação periódica independente. A validade defensiva expira depois do próximo ciclo mais três dias (ou 38 dias sem data de próxima cobrança), mas não substitui reconciliação.

## 6. Reconciliação automática

A função Netlify `reconcile-payments` executa diariamente às 06:00 UTC. Ela chama a rota autenticada `/api/payments/reconcile`, reconsulta assinaturas próximas do vencimento ou sem validade definida e registra somente métricas agregadas. `PAYMENTS_RECONCILIATION_TOKEN` deve ter pelo menos 32 bytes aleatórios e existir no escopo de Functions.
