# Conta Amigos

Uma única conta comum, com notas e progresso compartilhados, sem permissões administrativas e sem MFA. Login dedicado em `/resumos/login/amigos`; identificador interno `amigos@acesso.proconcursos.invalid` (não é caixa postal).

## Ativação

1. Aplicar `supabase/migrations/053_shared_friend_account.sql` no banco compartilhado, após validar em staging. A migration altera também triggers de `auth.users` e `auth.mfa_factors`; exige proprietário do banco.
2. Na configuração privada de Functions da Netlify, cadastrar `RESEND_API_KEY`, `SHARED_ACCOUNT_MAIL_FROM` (remetente verificado no Resend) e `SHARED_ACCOUNT_ROTATION_SECRET` (segredo aleatório de pelo menos 32 bytes). Preservar as variáveis Supabase já existentes. Não incluir esses valores no Git, no build ou em mensagens.
3. Publicar a branch revisada. A função `rotate-friend-password` só executa com `CONTEXT=production`; checa a cada hora e renova após 15 dias, independentemente da virada do mês. A primeira execução cria a conta e envia a senha exclusivamente para `nvpezat@gmail.com`.
4. Confirmar recebimento real e executar os testes manuais abaixo. Até essa confirmação, não considerar a conta ativada.

Operação local controlada, quando as variáveis estiverem disponíveis no ambiente: `node scripts/rotate-friend-password.mjs`. Não imprime a senha. Nunca executar com credenciais de produção durante testes automatizados.

## Comportamento e segurança

- A exceção de senha requer e-mail exato, `app_metadata.shared_account` atribuída pelo servidor e sessão com AMR password. Administradores continuam exigindo Google e AAL2.
- Índice único em `auth.users` impede uma segunda identidade marcada. A tabela singleton possui RLS e acesso exclusivo de service role.
- Trigger bloqueia alteração de senha/e-mail/telefone por convidados; somente uma atualização administrativa com novo `app_metadata.rotation_nonce` permite trocar credenciais. Outro trigger impede cadastro de fatores MFA nessa identidade.
- Acesso ao acervo usa o entitlement existente (`shared_friends`), preservando RLS e isolamento das notas de outros usuários.
- A senha deriva de HMAC-SHA256 sobre UUID aleatório de rotação com segredo exclusivo. Não é persistida em texto claro. Não trocar o segredo enquanto houver entrega pendente: isso produziria outra senha para a mesma tentativa.
- Lease de cinco minutos evita execuções concorrentes. Falha de e-mail conserva a rotação e repete a mesma senha na próxima execução; o Resend recebe chave de idempotência. Após a janela de retenção do provedor, uma repetição pode gerar e-mail duplicado com a mesma senha.
- Trocar senha impede novos logins com a anterior; sessões já autenticadas seguem a política do Supabase. Esta implementação não promete desconexão simultânea de todos os dispositivos.
- Todos os amigos podem ler, editar e apagar os dados dessa conta. Não inserir dados pessoais. Contas individuais são a opção recomendada quando houver necessidade de privacidade ou autoria.

## Validação antes da ativação

`node --test tests/shared-friend-account.test.mjs`, `npm run test:auth`, `npm run test:content`, `npm run test:api-auth`, lint, typecheck e build.

Em banco de staging, comprovar: segunda identidade marcada rejeitada; usuário comum e anônimo sem leitura/escrita na tabela de controle e sem execução da RPC; `auth.updateUser` não troca senha/e-mail da conta Amigos; cadastro de MFA rejeitado; rotação administrativa aceita; concorrência e vencimento de 15 dias; login Amigos sem MFA; notas editáveis na conta Amigos e invisíveis para outro usuário; importação/administração negadas. Verificar mobile e temas Light/Dark/Sepia, envio real e senha anterior recusada após rotação.

## Suspender e reverter

Suspender o agendamento na hospedagem e expirar o entitlement da conta por operação administrativa. Não apagar a conta ou tabela de controle: contêm identificação das notas e estado de entrega. Os demais usuários e o login Google não precisam mudar.

## Verificação desta entrega

Validados: 69 testes Node (17 de autenticação, 49 de conteúdo e 3 de proteção administrativa), lint sem erros (13 avisos preexistentes), TypeScript, build webpack com Next.js 16.4.3 e variáveis públicas fictícias, e auditoria de dependências de produção sem vulnerabilidades. Nenhuma dependência foi adicionada.

Pendentes: execução de `supabase/tests/053_shared_friend_account.test.sql` em banco de teste, teste real de isolamento com dois usuários, aplicação da migration remota, configuração do provedor, publicação e confirmação de entrega. Sem runtime PostgreSQL local ou acesso de migração remoto disponível nesta execução. O comando de inicialização do servidor local foi rejeitado pela revisão automática (`blocked by policy`), portanto a validação visual em navegador não foi realizada. A conta ainda não foi criada e nenhum e-mail foi enviado.

Referências: [Scheduled Functions Netlify](https://docs.netlify.com/build/functions/scheduled-functions/), [envio Resend](https://resend.com/docs/api-reference/emails/send-email), [sessões Supabase](https://supabase.com/docs/guides/auth/sessions).
