# Pagamentos — Mercado Pago e PayPal

## Configuração de produção

O checkout é hospedado pelo provedor. O site não recebe nem armazena dados de cartão. O acesso só é liberado após webhook autenticado e nova consulta à API oficial.

Use estas variáveis server-side na hospedagem (Netlify):

```env
PAYMENTS_APP_URL=https://proconcursos.com.br
PAYMENTS_MONTHLY_PRICE_BRL=0.10
PAYMENTS_RECONCILIATION_TOKEN=gere-um-token-aleatorio-com-pelo-menos-32-bytes

MERCADO_PAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN_DE_PRODUCAO
MERCADO_PAGO_WEBHOOK_SECRET=SUA_ASSINATURA_SECRETA_DE_PRODUCAO
MERCADO_PAGO_ENVIRONMENT=production
MERCADO_PAGO_TEST_PAYER_EMAIL=
```

`PAYMENTS_APP_URL` deve ser exatamente `https://proconcursos.com.br`, sem `/resumos`, `/dashboard`, query ou fragmento. Essa é a URL pública/comercial do pagamento. O código acrescenta internamente `/resumos` apenas nas rotas técnicas do aplicativo.

O valor provisório é **R$ 0,10 por mês**, sem período gratuito.

## Passo a passo no Mercado Pago

1. Acesse **Suas integrações** e abra a aplicação que será usada em produção.
2. Ative/consulte as credenciais de produção e copie o Access Token para `MERCADO_PAGO_ACCESS_TOKEN`.
3. Na configuração de Webhooks, gere e copie a assinatura secreta para `MERCADO_PAGO_WEBHOOK_SECRET`.
4. Cadastre esta URL de produção: `https://proconcursos.com.br/resumos/api/payments/webhooks/mercado-pago`.
5. Habilite os eventos `subscription_preapproval` e `subscription_authorized_payment`.
6. Configure `MERCADO_PAGO_ENVIRONMENT=production` e deixe `MERCADO_PAGO_TEST_PAYER_EMAIL` vazio.
7. Configure `PAYMENTS_MONTHLY_PRICE_BRL=0.10` na hospedagem.

A API utilizada é a de assinaturas (`POST /preapproval`), com recorrência mensal em BRL. A URL de retorno técnica leva o usuário ao aplicativo; ela não muda a URL comercial principal do produto.

## Publicação da aplicação

1. Aplique `supabase/migrations/018_create_payment_integration.sql` no projeto Supabase compartilhado.
2. Cadastre as variáveis acima no escopo de produção da Netlify. Nunca use `NEXT_PUBLIC_` para credenciais.
3. Publique a branch de produção.
4. Verifique que `https://proconcursos.com.br` e o webhook respondem em HTTPS.
5. Sem executar cobrança, confirme que o webhook sem assinatura retorna `401`.
6. Quando aceitar o lançamento financeiro, faça uma única assinatura real de R$ 0,10 e confirme o webhook, `user_entitlements` e o acesso da conta.

O teste real foi abortado nesta entrega. Não misture Access Token/segredo de teste com os de produção e não reutilize assinaturas criadas em outro ambiente.

## Reconciliação automática

A função Netlify `reconcile-payments` executa diariamente às 06:00 UTC. Ela usa `PAYMENTS_RECONCILIATION_TOKEN` para chamar `/resumos/api/payments/reconcile` e corrigir webhooks perdidos. O token deve ter pelo menos 32 bytes aleatórios.

## Validação local sem cobrança

```powershell
npm run test:payments
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

Não use a rota de diagnóstico ou qualquer endpoint que crie uma assinatura para testar produção. O endpoint de diagnóstico foi removido.

Referências oficiais: [criar assinatura](https://www.mercadopago.com.br/developers/pt/reference/online-payments/subscriptions/create-preapproval/post) e [Webhooks de assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks).
