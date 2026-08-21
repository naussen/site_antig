# Plano de bloqueio de acesso sem assinatura

Data: 21/08/2026
Objetivo: impedir que contas comuns sem assinatura ativa usem PRO Resumos e PRO Legis, preservando acesso administrativo/editorial já cadastrado.

## Decisão arquitetural recomendada

Não impedir a criação da sessão Supabase. Autenticação identifica a pessoa; autorização decide o que ela pode acessar. Uma conta sem assinatura precisa manter uma sessão restrita para iniciar checkout, acompanhar confirmação, cancelar tentativa, sair, exportar/excluir dados e exercer direitos de privacidade.

Na prática, “bloquear o login” deve significar: **após autenticar, a pessoa sem entitlement não entra no produto e é enviada para a área de assinatura**. Bloquear a emissão do token no Supabase tornaria a vinculação segura do pagamento mais difícil e incentivaria identificação por e-mail, que é inferior ao UUID autenticado.

## Estado atual

- A função compartilhada `has_active_content_access()` já aceita `active`/`trialing` vigente e administrador com AAL2.
- Dashboard principal, configurações e páginas de estudo do Resumos já chamam `requireContentAccess()`.
- O layout `/dashboard` exige apenas sessão; `/dashboard/assinatura` precisa continuar acessível sem entitlement.
- A central de notas do Resumos exige login, mas não exige assinatura.
- O Legis protege catálogo, leitor, amostra e APIs pessoais com entitlement.
- Revisor e publicador do Legis não são papéis paralelos: o modelo atual exige `app_metadata.role="admin"`, permissão `legis.review`/`legis.publish` e AAL2. Portanto já entram pela exceção administrativa.
- Os formulários permitem cadastro, senha, magic link e Google; depois do login, a rota de destino é responsável por aplicar o gate.

## Matriz de acesso desejada

| Identidade/estado | Landing/login | Checkout/assinatura | Resumos/Legis | Editorial | Conta/privacidade |
|---|---:|---:|---:|---:|---:|
| Anônimo | sim | não | não | não | não |
| Autenticado sem entitlement | sim | sim | não | não | sim, mínimo |
| `pending`/`past_due`/`canceled`/`expired` sem tolerância | sim | sim | não | não | sim, mínimo |
| `active`/`trialing` vigente | sim | sim | sim | não | sim |
| Admin AAL1 | sim | sim | não; exigir MFA | não | sim |
| Admin AAL2 | sim | sim | sim | conforme permissão | sim |
| Revisor AAL2 | sim | sim | sim | revisar | sim |
| Publicador AAL2 | sim | sim | sim | publicar | sim |

Não criar exceção por e-mail e não usar `user_metadata`. A autoridade permanece em `app_metadata`, emitida pelo backend administrativo, mais AAL2.

## Implementação recomendada

### 1. Centralizar a decisão

- Manter `private.has_active_content_access()` como fonte de verdade do banco.
- Criar uma função server-only que retorne um estado explícito: `anonymous`, `mfa_required`, `subscription_required` ou `allowed`.
- Reutilizar essa função em páginas, Route Handlers e Server Actions. Não duplicar regras de status em componentes.
- Falha de consulta ao entitlement deve negar acesso, nunca liberar por fallback.

### 2. Redirecionar imediatamente após autenticação

- No callback de OAuth/magic link, após trocar o código por sessão, consultar o estado e escolher destino seguro.
- No login com senha, o destino final continua sendo uma página server-side; essa página aplica o mesmo gate.
- Usuário sem assinatura vai para `/resumos/dashboard/assinatura` com mensagem neutra.
- Admin/revisor/publicador AAL1 vai para `/resumos/admin` ou `/legis/admin` para concluir TOTP.
- Preservar `next` apenas após sanitização contra open redirect.

### 3. Cobrir todas as superfícies do Resumos

- Manter `requireContentAccess()` em `/dashboard`, configurações e `[topicId]`.
- Definir deliberadamente o comportamento de `/dashboard/notas`: recomendação é uma visualização restrita de exportação/exclusão após expiração, sem acesso ao acervo; se o requisito for bloqueio total, aplicar o gate também à página e documentar como o usuário exercerá portabilidade.
- Alterar `/api/highlights` para exigir entitlement em todas as operações, ou documentar formalmente por que realces pessoais permanecem acessíveis após expiração.
- Revisar futuros Route Handlers e Server Actions para autorização própria; o layout não protege APIs.

### 4. Preservar exceções administrativas com segurança

- Não cadastrar `role="reviewer"` isolado, porque as policies atuais reconhecem `role="admin"`.
- Revisor: `role="admin"` + `legis_permissions` contendo `legis.review` + AAL2.
- Publicador: `role="admin"` + `legis_permissions` contendo `legis.publish` + AAL2.
- Admin comum: `role="admin"` + AAL2.
- Antes de ativar o bloqueio, executar o utilitário de auditoria editorial com os UUIDs já cadastrados e testar login de cada conta. Não registrar e-mail ou UUID no relatório público.

### 5. Repetir a barreira no banco

- Preservar RLS de `topics`, `sections`, leis, versões, fragmentos e flashcards com `private.has_active_content_access()`.
- Dados pessoais continuam isolados por `auth.uid()`; decidir separadamente se exigem também entitlement.
- O webhook altera entitlement somente via backend privilegiado.
- Testar acesso direto pelo Data API; redirecionamento de página não é controle de segurança.

## Ordem segura de ativação

1. Auditar contas admin/revisor/publicador e MFA AAL2.
2. Criar contas de teste para todos os estados de entitlement.
3. Implementar o classificador compartilhado e testes unitários.
4. Cobrir callback, páginas, APIs e Server Actions.
5. Aplicar/validar migrations em homologação.
6. Executar matriz RLS com dois usuários.
7. Testar Resumos e Legis no mesmo domínio, incluindo logout e retorno entre zonas.
8. Ativar o gate em produção antes de abrir checkout público.
9. Monitorar negações anormais e manter rollback apenas do roteamento; não enfraquecer RLS.

## Testes de aceite

- Anônimo recebe redirect/`401` em toda superfície privada.
- Conta sem entitlement nunca recebe conteúdo, mesmo chamando Supabase diretamente.
- `pending`, `past_due`, `canceled` e `expired` obedecem exatamente à regra comercial.
- Conta ativa entra nas duas zonas sem novo login.
- Admin AAL1 não acessa conteúdo nem editorial; AAL2 acessa.
- Revisor não publica; publicador distinto não revisa quando não possui essa permissão.
- Alteração client-side de botão, cookie não validado, `user_metadata`, query string ou corpo JSON não concede acesso.
- Usuário A não lê/altera assinatura, notas, progresso ou realces do usuário B.
- Callback rejeita URLs externas e prefixos parecidos.
- Área de assinatura não entra em loop de redirect.
- Cancelamento/expiração revogam acesso após webhook ou reconciliação dentro do SLA definido.

## Riscos de implementação

- Colocar o gate no layout inteiro de `/dashboard` causará loop em `/dashboard/assinatura`; separar rotas protegidas ou manter gates nas páginas.
- Tratar revisor como novo valor de `role` quebrará a exceção atual do RLS.
- Confiar no e-mail do pagador pode conceder acesso à conta errada; o vínculo nasce da sessão autenticada.
- Revogar dados pessoais junto com o conteúdo pode conflitar com portabilidade/privacidade; obter decisão jurídica antes.
- Cache e redirects podem manter estado visual antigo; respostas privadas não devem ser cacheadas de forma compartilhada.

## Critério de conclusão

O bloqueio estará concluído somente quando página, API e Data API negarem conteúdo a uma conta sem entitlement, enquanto admin/revisor/publicador cadastrados funcionarem exclusivamente com AAL2 e a área mínima de assinatura/conta continuar acessível.
