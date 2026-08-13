# Autenticação em produção

Este documento separa o que é configuração externa do que é comportamento do
site. Nunca salve Client Secret do Google, senha SMTP ou service role no Git.

## Conta administrativa prática

A rota exclusiva de entrada administrativa é:

```text
https://proconcursos-resumos.netlify.app/resumos/admin
```

Para criar uma conta já confirmada, sem depender do envio de e-mail:

```powershell
node --env-file-if-exists=.env.local scripts/bootstrap-admin.mjs --email administrador@exemplo.com
```

Se a conta não existir, o comando gera uma senha temporária forte e a mostra uma
única vez. Se já existir, preserva a senha atual, confirma o e-mail e adiciona
`app_metadata.role = "admin"`.

O papel controla a nova tela de entrada. Atualmente, ele não substitui a
`SUPABASE_SERVICE_ROLE_KEY`: importações e exclusões administrativas continuam
restritas aos scripts e endpoints de servidor.

## Assinatura futura

Autenticação e assinatura devem permanecer separadas. O Google/Supabase confirma
a identidade; uma tabela própria deve registrar plano, estado, início e término
da assinatura. O servidor deve verificar essa tabela antes de entregar páginas e
dados do dashboard. Nunca trate um botão oculto no cliente como autorização.

## URLs do Supabase Auth

Em **Supabase > Authentication > URL Configuration**, configure:

- Site URL: `https://proconcursos-resumos.netlify.app/resumos`
- Redirect URL: `https://proconcursos-resumos.netlify.app/resumos/auth/callback`
- Desenvolvimento: `http://localhost:3000/resumos/auth/callback`

Quando o domínio próprio estiver ativo, adicione também o callback correspondente
sem remover a URL da Netlify antes da validação.

## Login com Google

1. No Google Cloud, crie um cliente OAuth do tipo **Web application**.
2. Adicione `https://proconcursos-resumos.netlify.app` como origem JavaScript.
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
