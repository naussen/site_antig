# Autenticação em produção

Este documento separa o que é configuração externa do que é comportamento do
site. Nunca salve Client Secret do Google, senha SMTP ou service role no Git.

## Conta administrativa prática

A rota exclusiva de entrada administrativa é:

```text
https://proconcursos.com.br/resumos/admin
```

Para criar uma conta já confirmada, sem depender do envio de e-mail:

```powershell
node --env-file-if-exists=.env.local scripts/bootstrap-admin.mjs --email administrador@exemplo.com
```

Se a conta não existir, o comando gera uma senha temporária forte e a mostra uma
única vez. Se já existir, preserva a senha atual, confirma o e-mail e adiciona
`app_metadata.role = "admin"`.

O papel controla a tela de entrada e exige MFA/TOTP antes de liberar sessões
administrativas. Os endpoints HTTP de importação e exclusão exigem um
`CONTENT_ADMIN_TOKEN` independente. A `SUPABASE_SERVICE_ROLE_KEY` permanece
somente dentro do servidor para acessar o Supabase após essa validação.

Gere o token administrativo com um gerador criptograficamente seguro, configure-o
somente no ambiente do servidor e nunca reutilize a Service Role. O token deve ter
pelo menos 32 bytes aleatórios.

## MFA da conta administrativa

O projeto exige AAL2 para contas com `app_metadata.role = "admin"`. Depois do
login em `/resumos/admin`, escaneie o QR code com um aplicativo autenticador e
confirme o código TOTP de seis dígitos. Enquanto o segundo fator não for validado,
Dashboard e páginas de estudo redirecionam a conta administrativa para `/admin`.

No Supabase hospedado, mantenha TOTP habilitado em **Authentication > Multi-Factor**.

## Segurança de senha

Novos cadastros por senha exigem pelo menos 12 caracteres, com letras minúsculas,
maiúsculas e números. A troca de senha também exige reautenticação recente.

A ativação de **Leaked Password Protection** foi tentada no projeto hospedado, mas
a Supabase recusou a configuração com HTTP 402 porque o recurso exige plano pago.
Até o upgrade, o Security Advisor continuará exibindo esse alerta.

## Assinatura paga

Autenticação e assinatura permanecem separadas. Todo usuário cadastrado pode
acessar o acervo somente enquanto a assinatura paga estiver ativa. O projeto ainda
não possui provedor, webhook nem tabela de assinatura; portanto esse bloqueio não
está implementado. A futura integração deve registrar plano, estado, início e
término e verificar o entitlement no servidor e no RLS. Nunca trate um botão
oculto no cliente como autorização.

## URLs do Supabase Auth

Em **Supabase > Authentication > URL Configuration**, configure:

- Site URL: `https://proconcursos.com.br/resumos`
- Redirect URL: `https://proconcursos.com.br/resumos/auth/callback`
- Desenvolvimento: `http://localhost:3000/resumos/auth/callback`

Quando o domínio próprio estiver ativo, adicione também o callback correspondente
sem remover a URL da Netlify antes da validação.

## Login com Google

1. No Google Cloud, crie um cliente OAuth do tipo **Web application**.
2. Adicione `https://proconcursos.com.br` como origem JavaScript.
3. Em **Supabase > Authentication > Sign In / Providers > Google**, copie a
   callback URL exibida pelo próprio Supabase e cadastre-a no Google como
   **Authorized redirect URI**.
4. Preencha Client ID e Client Secret no painel do Supabase, habilite Google e
   salve.
5. Não coloque essas credenciais em arquivos do projeto.

## Confirmação por e-mail

O SMTP padrão do Supabase é apenas para testes e pode recusar destinatários ou
atingir limites muito baixos. Em produção, configure um provedor SMTP próprio em
**Supabase > Authentication > Emails > SMTP Settings** e mantenha **Confirm email**
habilitado.

Depois de salvar, confira os logs de autenticação, cadastre um endereço novo,
valide caixa de entrada e spam, abra o link e confirme o retorno para
`/resumos/auth/callback`.
