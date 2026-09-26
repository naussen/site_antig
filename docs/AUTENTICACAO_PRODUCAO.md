# Autenticação em produção

O PRO Concursos aceita somente Google OAuth. O site não recebe nem armazena a
senha Google. Ainda trata os dados básicos autorizados pelo usuário, como UUID,
e-mail e nome, além dos dados funcionais vinculados à conta.

Nunca salve Client Secret do Google, Service Role, token administrativo ou
sessões no Git.

## Login público

A entrada ocorre em `https://proconcursos.com.br/resumos/login`. O callback
`/resumos/auth/callback` valida se a sessão contém uma identidade Google. Sessões
emitidas por e-mail, senha ou outro provedor são encerradas e rejeitadas também
no proxy e nos guardas server-side.

No Supabase, mantenha o Google habilitado em **Authentication > Sign In /
Providers > Google**. No Google Cloud, use um cliente OAuth do tipo **Web
application** e cadastre a callback exibida pelo próprio Supabase como
**Authorized redirect URI**. Não coloque Client ID ou Client Secret em arquivos
versionados.

## Conta administrativa: Google + TOTP

O administrador deve primeiro entrar uma vez pelo Google. Depois, promova a
conta existente sem criar senha:

```powershell
node --env-file-if-exists=.env.local scripts/bootstrap-admin.mjs --email administrador@exemplo.com
```

O script exige identidade Google já vinculada e apenas adiciona
`app_metadata.role = "admin"`. Em seguida, acesse:

```text
https://proconcursos.com.br/resumos/admin
```

A rota exige Google e TOTP/AAL2. Se não houver fator verificado, a própria tela
orienta o cadastro pelo QR code. Dashboard e acervo permanecem bloqueados para
administradores enquanto a sessão estiver em AAL1.

No Supabase hospedado, mantenha TOTP habilitado em **Authentication >
Multi-Factor**. Não crie senha fixa, bypass público ou segredo alternativo no
frontend para recuperação administrativa.

## Desativar e-mail e senha no Supabase

Esta etapa deve ocorrer somente depois de o código Google-only estar publicado e
o acesso de pelo menos uma conta administrativa ter sido validado com Google +
TOTP:

1. confirme em produção o login de usuário pelo Google;
2. confirme `/resumos/admin` com uma conta administrativa e TOTP;
3. em **Authentication > Sign In / Providers**, desabilite o provedor **Email**;
4. mantenha **Google** habilitado;
5. encerre sessões antigas por e-mail e repita os testes público e administrativo;
6. confirme que chamadas diretas de cadastro, senha e magic link são recusadas.

Pela Management API, o campo correspondente é `external_email_enabled=false`.
Essa mutação é operacional e não deve ser executada antes do deploy, pois a
versão antiga do formulário administrativo ainda dependeria de senha.

O arquivo `supabase/config.toml` mantém `auth.enable_signup=true` para permitir o
primeiro acesso social e define `auth.email.enable_signup=false` para não abrir
cadastro local por e-mail.

## URLs permitidas

Em **Supabase > Authentication > URL Configuration**, configure:

- Site URL: `https://proconcursos.com.br/resumos`
- Redirect URL: `https://proconcursos.com.br/resumos/auth/callback`
- Desenvolvimento: `http://localhost:3000/resumos/auth/callback`

Adicione URLs de preview apenas durante testes controlados e remova-as quando
deixarem de ser necessárias.

## Assinatura e autorização

Autenticação não concede acesso ao acervo. O backend e o RLS consultam o
entitlement ativo; administradores dependem também de TOTP/AAL2. Pagamentos são
processados pelos provedores externos, sem trânsito dos dados completos do cartão
pelo PRO Concursos.

## Recuperação operacional

- Perda de acesso Google: recuperar a Conta Google pelos canais do Google.
- Perda do TOTP com sessão Google válida: usar o procedimento administrativo
  controlado do Supabase para remover o fator comprometido e cadastrar um novo,
  registrando a intervenção.
- Perda simultânea de Google e TOTP: usar somente a recuperação de propriedade do
  projeto/conta Supabase; não reabilitar senha temporária no aplicativo.
