# Relatório de prontidão para lançamento — 9 de outubro de 2026

## Escopo

Auditoria funcional, de banco de dados, segurança e responsividade do PRO Concursos, com ênfase na abertura para novos cadastros e assinaturas.

Ficaram deliberadamente fora do veredito a configuração e a validação financeira de Mercado Pago e PayPal, conforme solicitado. Nenhuma compra, assinatura, cancelamento, solicitação LGPD ou exclusão de dado real foi executada.

## Veredito executivo

**NO-GO para abrir cadastros e assinaturas neste momento.**

O estado técnico da aplicação é consistente: o deploy publicado corresponde à `origin/main`, os gates automatizados passaram, a sessão autenticada funcionou nas áreas principais, o isolamento RLS remoto passou com dois usuários efêmeros e não houve overflow horizontal nos viewports avaliados.

O bloqueio não decorre de uma falha funcional reproduzida na interface. Ele decorre das evidências obrigatórias ainda ausentes para um lançamento com usuários reais:

1. cadastro Google completo de uma conta nova;
2. confirmação da matriz de acesso na interface publicada com contas Google sintéticas;
3. ativação de backup nativo/PITR do Supabase ou aceitação formal do risco, seguida da execução do runbook de recuperação Auth e medição do RTO completo;
4. preflight da aplicação no runtime publicado e teste real de entrega dos alertas operacionais;
5. rotação coordenada do `CONTENT_ADMIN_TOKEN` do PRO Legis após sua classificação como segredo.

Esses pontos já constam como gates no próprio projeto. Abrir o cadastro antes de validá-los transfere o teste para os primeiros usuários.

## Achados críticos que exigem resolução antes da abertura

### P0-01 — Cadastro novo não foi concluído ponta a ponta

**Evidência:** em sessão sem cookies, `/resumos/login` exibiu exclusivamente “Continuar com Google” e o clique chegou corretamente ao identificador do Google OAuth. O fluxo foi interrompido antes de informar uma conta, portanto não houve criação de usuário, callback, criação de perfil ou primeiro acesso ao produto.

**Risco:** o provedor está habilitado, mas isso não prova que um usuário novo conclua o callback, receba o estado inicial correto e encontre uma experiência coerente sem assinatura.

**Ação obrigatória:** criar uma conta Google de teste dedicada, concluir o cadastro e validar callback, logout/login, ausência de privilégios administrativos e estado inicial sem entitlement.

**Critério de aceite:** conta nova criada sem erro; sessão exclusivamente Google; dashboard/conta acessíveis conforme a regra de produto; conteúdo pago bloqueado; nenhuma role ou entitlement concedido pelo navegador.

### P0-02 — Matriz de autorização e entitlement incompleta em produção

**Evidência positiva:** o teste remoto automatizado passou para visitante anônimo, usuário pendente, expirado, cancelado com prazo futuro e vencido, ativo, administrador AAL1 e administrador AAL2. A leitura real de `sections` acompanhou a função de acesso, o chargeback revogou o acesso e todas as fixtures efêmeras foram removidas.

**Lacuna:** a mesma matriz ainda não foi percorrida na interface publicada com identidades Google sintéticas. O teste de banco usa sessões efêmeras controladas e comprova RLS/funções, mas não substitui callback OAuth, guardas do Next.js e navegação entre módulos.

**Risco:** um erro de configuração remota pode liberar conteúdo sem pagamento, negar acesso a assinante válido ou permitir operação administrativa sem MFA, mesmo com testes estáticos corretos.

**Ação obrigatória:** executar o smoke remoto com contas sintéticas para cada estado, sem usar dados de cliente.

**Critério de aceite:** permissões e bloqueios coincidem com a matriz esperada em `/resumos`, `/legis`, Questões, Planner, Notas, Conta e Assinatura; administrador AAL1 não executa operação protegida e AAL2 executa.

### P0-03 — Produção está sem backup nativo e sem PITR

**Evidência positiva:** a primeira inspeção revelou que o backup antigo listava 16 usuários, mas omitia suas identidades OAuth. A coleta foi corrigida para consultar o detalhe de cada usuário e um novo backup foi produzido com 45 tabelas, 34.365 linhas, 16 usuários, 18 identidades e 1 bucket. A tarefa diária está ativa; existe chave portátil; a cópia off-site e seus hashes coincidem com a origem.

O novo pacote foi restaurado em Supabase local isolado em 27,1 segundos de carga/validação: as contagens coincidiram, 98 chaves estrangeiras ficaram sem órfãos e quatro cenários RLS passaram para assinante, não assinante e administrador AAL1/AAL2. O restaurador possui trava pelo nome e label do projeto local e também recompõe objetos do Storage quando existirem.

**Evidência remota:** em 09/10/2026, a CLI Supabase 2.109.1 autenticada consultou diretamente o projeto de produção e retornou `pitr_enabled: false` e `backups: []`. Portanto, não há PITR ativo nem backup nativo disponível para restauração. A documentação vigente do Supabase reserva backups diários automáticos aos planos Pro, Team e Enterprise; para o plano Free, recomenda exportações regulares e cópias off-site.

**Lacuna:** o backup lógico não recebe pela API hashes de senha, segredos OAuth, fatores TOTP nem sessões ativas; por isso, não recompõe sozinho todo o plano de recuperação de Auth.

**Runbook:** `docs/RUNBOOK_RECUPERACAO_AUTH_RTO.md` documenta recuperação sem bypass do Google OAuth/TOTP, invalidação de sessões, gates de retorno e o cronômetro de RPO/RTO. O procedimento ainda precisa ser executado em projeto remoto isolado; os 27,1 segundos medidos não constituem RTO completo.

**Risco:** um backup íntegro no formato próprio pode ainda falhar na reconstrução operacional completa quando mais necessário.

**Ação obrigatória:** antes da abertura, ativar um plano com backup diário nativo ou PITR, ou registrar aceitação formal do risco residual baseada no backup lógico diário já validado. Executar o runbook em projeto remoto isolado, incluindo reconfiguração OAuth e recuperação/reinscrição MFA. Adotar RPO operacional máximo de 24 horas para o backup lógico e medir o RTO completo, incluindo infraestrutura e reconfiguração Auth; os 27,1 segundos medidos cobrem apenas carga e validação locais com o ambiente já disponível.

**Critério de aceite:** evidência do backup nativo/PITR ou aceitação formal e documentada do risco residual, além do runbook OAuth/MFA executado com sucesso e RTO completo medido.

### P0-04 — Preflight da aplicação e entrega de alertas ainda não foram comprovados no runtime publicado

**Evidência positiva:** `/resumos/api/health` retornou `200`, com banco e reconciliação em estado `ok`. A migration operacional está funcional e o job de reconciliação possui heartbeat recente.

**Evidência positiva:** os preflights foram separados. O gate da aplicação não recebe mais a frase de recuperação; o gate do host Windows aprovou tarefa agendada, idade do backup, descriptografia, chave portátil e hashes das cópias off-site.

**Evidência do runtime:** o painel autenticado da Netlify confirmou em produção os nomes de `NEXT_PUBLIC_SUPABASE_URL`, chave pública Supabase, chave administrativa Supabase, `CONTENT_ADMIN_TOKEN`, base de pagamentos e token de reconciliação. `OPS_ALERT_WEBHOOK_URL` não existe no projeto.

**Lacuna:** o preflight da aplicação não pode aprovar enquanto o canal de alerta estiver ausente. A entrega real de alertas de falha de reconciliação e backup não foi acionada nem observada.

**Risco:** falhas podem permanecer silenciosas justamente durante os primeiros cadastros e assinaturas.

**Ação obrigatória:** executar o preflight da aplicação no ambiente publicado, tratando Mercado Pago/PayPal separadamente conforme o escopo; disparar um alerta sintético seguro de reconciliação e um de backup e confirmar o recebimento.

**Critério de aceite:** todos os indicadores não financeiros aplicáveis aprovados no respectivo ambiente, alerta recebido sem segredo ou dado pessoal e runbook com responsável e resposta esperada.

### Resolvido durante a auditoria — proveniência do deploy do PRO Legis

**Evidência:** `/legis`, o catálogo, a leitura por artigo, a leitura integral, os três temas e a sessão compartilhada funcionaram em produção. O painel autenticado da Netlify confirmou o deploy de produção `6ac71017711cf30008d0910a`, publicado a partir de `main@486d693`. Esse SHA coincide com `origin/main` do repositório PRO Legis.

O GitHub confirmou o `Release gate` desse commit como aprovado: `npm run verify:deploy`, auditoria de produção em nível alto e build webpack concluíram no job `verify`. A documentação do gateway foi alinhada ao estado publicado.

**Estado:** critério de proveniência atendido em 09/10/2026. Deve ser repetido em toda release conjunta.

### P0-05 — Rotação do token administrativo do PRO Legis

**Evidência:** `CONTENT_ADMIN_TOKEN` e `SUPABASE_SECRET_KEY` estavam classificados pela Netlify como valores provavelmente sensíveis, mas não marcados como segredo. Ambos foram corrigidos durante a auditoria e agora aparecem como `Secret values`, nos escopos Builds, Functions e Runtime. O valor do token administrativo ficou legível no formulário autorizado de edição antes da nova classificação ser salva.

**Risco:** embora o valor não tenha sido publicado neste relatório, ele deixou de satisfazer o princípio de segredo desconhecido após a inspeção automatizada e pode ter estado acessível pela UI/API/CLI a membros autorizados enquanto não era classificado como segredo.

**Ação obrigatória:** gerar um novo `CONTENT_ADMIN_TOKEN`, atualizar de forma coordenada o PRO Legis e o consumidor administrativo legítimo, publicar novamente e invalidar o valor anterior. Não registrar o token em logs, commits ou mensagens.

**Critério de aceite:** importação administrativa funciona com o novo token; o anterior recebe `401`; a variável permanece marcada como segredo; nenhuma cópia versionada ou em log é encontrada.

### Resolvido durante a auditoria — proteção de previews não confiáveis

O Site permitia `Deploy without restrictions`, configuração que entrega todas as variáveis a previews de autores não confiáveis. A política foi alterada para `Require approval` e a confirmação visual do estado salvo foi obtida. Nenhum valor foi aberto durante essa alteração.

## Achados relevantes, mas não bloqueadores imediatos

### P1-01 — Ambiente local usa chave pública legada

O teste oficial `test-rls-two-users` interrompeu antes de criar fixtures porque o `.env.local` não possui `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A produção já usa a chave pública moderna; com essa chave pública mantida apenas em memória, o teste remoto passou e removeu as fixtures.

**Recomendação:** atualizar o ambiente local sem registrar nem versionar a chave. Isso evita que o principal teste remoto de isolamento falhe no próximo release.

### P1-02 — CSP é parcial

A produção envia HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Referrer-Policy` e uma CSP que protege `base-uri`, `object-src`, `frame-ancestors` e `form-action`.

A CSP não define `default-src`, `script-src`, `connect-src`, `img-src` ou `style-src`. Portanto, ela protege contra enquadramento e destinos indevidos de formulário, mas não funciona como barreira abrangente contra carregamento de scripts/recursos.

**Recomendação:** evoluir em modo `Content-Security-Policy-Report-Only`, inventariar origens legítimas e só então aplicar a política restritiva. Não tratar CSP como substituto para validação e sanitização.

### P1-03 — Auditoria npm distingue produção de desenvolvimento

`npm audit --omit=dev` encontrou 5 vulnerabilidades baixas e nenhuma alta/crítica. O audit completo encontrou 5 altas na cadeia de desenvolvimento do ESLint/`eslint-config-next`; a correção automática sugerida exige downgrade incompatível do Next.js.

**Recomendação:** acompanhar atualização compatível da cadeia de lint. Não executar `npm audit fix --force`.

### P1-04 — Documentação operacional está parcialmente desatualizada

O `TODO.md` ainda marca como pendentes o smoke publicado e a cópia off-site, embora ambos tenham sido comprovados nesta auditoria. O `CHANGELOG.md` mantém mudanças implantadas sob “Não publicado”. `docs/GATEWAY_PRODUCAO.md` ainda afirma que `/legis` retorna 404 e que a ativação está pendente, embora a rota esteja operacional.

**Recomendação:** atualizar o checklist somente depois de anexar as evidências desta auditoria e preservar separadamente os itens ainda não comprovados.

### P2-01 — Identidade exibida pelo OAuth

O início do Google OAuth informa ao usuário que ele prosseguirá para o domínio técnico do projeto Supabase. Isso é compatível com o fluxo atual, mas reduz a continuidade visual com `proconcursos.com.br`.

**Recomendação:** avaliar domínio personalizado de Auth e configuração de marca no consentimento Google quando houver justificativa operacional. Não é bloqueador de segurança.

## Validações aprovadas

### Código, build e release

- `origin/main`: `fcee3c0cbad2f2844cb0b8590f81ef62d6cc94e0`.
- Deploy Netlify publicado: mesmo SHA, estado `ready`.
- GitHub Actions do SHA: `Release gate` e `Regressão visual` concluídos com sucesso.
- `npm run verify:deploy`: aprovado.
- ESLint: aprovado.
- Next typegen + `tsc --noEmit`: aprovado.
- `npm run test:release`: 176/176 testes aprovados.
- `npm run build -- --webpack`: aprovado com Next.js 16.3.8.

### Autenticação e autorização

- sessão real existente foi reconhecida no Chrome;
- login público oferece somente Google;
- OAuth chegou ao Google sem erro de provedor;
- rota privada e página de estudo redirecionam usuário anônimo para `/resumos/login`;
- painel administrativo anônimo apresenta login, sem expor a interface de importação;
- APIs de importação, privacidade, cancelamento e imagens rejeitaram chamadas anônimas;
- nenhuma senha, OTP, token ou cookie foi lido ou registrado.

### Banco de dados e persistência

- `/resumos/api/health`: banco e reconciliação `ok`;
- teste remoto com usuários efêmeros: aprovado para notas, progresso, preferências, realces, imagens, entitlements, LGPD, Planner e leitura do acervo em todos os estados de acesso;
- administrador AAL1 permaneceu bloqueado e a mesma sessão foi liberada somente após TOTP/AAL2;
- tentativa cruzada de leitura/escrita foi bloqueada por RLS;
- browser não conseguiu alterar entitlement nem consultar bloqueios financeiros internos;
- fixtures de teste foram removidas ao final;
- preferência de tema foi alterada, persistiu após reload e foi restaurada para Claro.

### Funcionalidade autenticada

- Dashboard, estudo, Notas, Planner, Questões, Preferências, Conta e Assinatura carregaram sem erro de console;
- PRO Resumos e PRO Legis compartilharam a mesma sessão;
- catálogo do PRO Legis, leitor por artigo e leitor integral carregaram;
- temas Claro, Escuro/Noturno e Sépia responderam aos controles e o estado original foi restaurado;
- nenhum dado de nota, progresso, Planner, questão ou LGPD foi alterado de forma permanente.

### Responsividade

Rotas críticas foram verificadas em desktop, tablet `768 × 1024` e celular `390 × 844`:

- Dashboard;
- página de estudo;
- Questões;
- Planner;
- Conta;
- catálogo do PRO Legis;
- leitor integral do PRO Legis.

Não houve overflow horizontal global nas rotas verificadas. A navegação móvel permaneceu disponível e os títulos principais ficaram acessíveis.

### Cabeçalhos e superfície web

- HTTPS com HSTS;
- `nosniff`;
- negação de framing;
- câmera, geolocalização e microfone desabilitados por política;
- política de referer restritiva;
- formulários limitados à própria origem e aos hosts explicitamente permitidos de checkout;
- busca estática não encontrou `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` ou `rehype-raw` no código de produção.

## Sequência mínima para transformar o veredito em GO

1. Atualizar a chave pública local para o formato moderno, sem versioná-la.
2. Criar contas Google sintéticas e repetir na interface a matriz de cadastro/entitlement/AAL já aprovada no banco.
3. Ativar backup nativo/PITR do Supabase ou aceitar formalmente o risco residual, executar o runbook OAuth/MFA em projeto remoto isolado e medir o RTO completo.
4. Criar `OPS_ALERT_WEBHOOK_URL`, rodar o preflight da aplicação no runtime publicado e testar a entrega dos alertas.
5. Rotacionar coordenadamente o `CONTENT_ADMIN_TOKEN` do PRO Legis e confirmar que o valor anterior foi invalidado.
6. Repetir o smoke móvel e desktop após qualquer ajuste resultante.
7. Somente depois executar a configuração e os testes financeiros de Mercado Pago e PayPal já reservados para a etapa final.

## Limitações desta auditoria

- não foi criado usuário Google novo;
- não foi realizada transação financeira;
- não foi enviado pedido LGPD;
- não foram cancelados nem excluídos dados reais;
- o restore foi executado apenas no Supabase local isolado, não em projeto remoto de homologação;
- não foi acessado o painel de billing do Supabase;
- o conteúdo jurídico não foi submetido a uma revisão material nesta execução.
