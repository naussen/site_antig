# Relatório de prontidão para lançamento — 9 de outubro de 2026

## Escopo

Auditoria funcional, de banco de dados, segurança e responsividade do PRO Concursos, com ênfase na abertura para novos cadastros e assinaturas.

Ficaram deliberadamente fora do veredito a configuração e a validação financeira de Mercado Pago e PayPal, conforme solicitado. Nenhuma compra, assinatura, cancelamento, solicitação LGPD ou exclusão de dado real foi executada.

## Veredito executivo

**NO-GO para abrir cadastros e assinaturas neste momento.**

O estado técnico da aplicação é consistente: o deploy publicado corresponde à `origin/main`, os gates automatizados passaram, a sessão autenticada funcionou nas áreas principais, o isolamento RLS remoto passou com dois usuários efêmeros e não houve overflow horizontal nos viewports avaliados.

O bloqueio não decorre de uma falha funcional reproduzida na interface. Ele decorre de quatro evidências obrigatórias ainda ausentes para um lançamento com usuários reais:

1. cadastro Google completo de uma conta nova;
2. matriz remota de acesso para usuário sem entitlement, ativo, pendente/atrasado, expirado/cancelado e administrador em AAL1/AAL2;
3. restauração real do backup em ambiente Supabase/PostgreSQL isolado e confirmação do backup nativo do Supabase;
4. preflight separado corretamente por ambiente e teste real de entrega dos alertas operacionais;
5. rastreabilidade do deploy do PRO Legis até um SHA aprovado.

Esses pontos já constam como gates no próprio projeto. Abrir o cadastro antes de validá-los transfere o teste para os primeiros usuários.

## Achados críticos que exigem resolução antes da abertura

### P0-01 — Cadastro novo não foi concluído ponta a ponta

**Evidência:** em sessão sem cookies, `/resumos/login` exibiu exclusivamente “Continuar com Google” e o clique chegou corretamente ao identificador do Google OAuth. O fluxo foi interrompido antes de informar uma conta, portanto não houve criação de usuário, callback, criação de perfil ou primeiro acesso ao produto.

**Risco:** o provedor está habilitado, mas isso não prova que um usuário novo conclua o callback, receba o estado inicial correto e encontre uma experiência coerente sem assinatura.

**Ação obrigatória:** criar uma conta Google de teste dedicada, concluir o cadastro e validar callback, logout/login, ausência de privilégios administrativos e estado inicial sem entitlement.

**Critério de aceite:** conta nova criada sem erro; sessão exclusivamente Google; dashboard/conta acessíveis conforme a regra de produto; conteúdo pago bloqueado; nenhuma role ou entitlement concedido pelo navegador.

### P0-02 — Matriz de autorização e entitlement incompleta em produção

**Evidência:** foram comprovados o redirecionamento anônimo para login, a sessão administrativa com acesso ativo e o isolamento RLS de dois usuários. Não foram comprovados, na interface publicada, usuário comum sem entitlement, ativo, pendente/atrasado, expirado/cancelado nem administrador em AAL1.

**Risco:** um erro de configuração remota pode liberar conteúdo sem pagamento, negar acesso a assinante válido ou permitir operação administrativa sem MFA, mesmo com testes estáticos corretos.

**Ação obrigatória:** executar o smoke remoto com contas sintéticas para cada estado, sem usar dados de cliente.

**Critério de aceite:** permissões e bloqueios coincidem com a matriz esperada em `/resumos`, `/legis`, Questões, Planner, Notas, Conta e Assinatura; administrador AAL1 não executa operação protegida e AAL2 executa.

### P0-03 — Recuperação de desastre ainda não foi demonstrada

**Evidência positiva:** o backup lógico mais recente foi validado com sucesso, cobrindo 45 tabelas, 34.364 linhas, Auth, migrations e arquivos; a tarefa diária está ativa; existe chave portátil; a cópia off-site existe e o SHA-256 coincide com a origem.

**Lacuna:** não foi localizada evidência de restore real em PostgreSQL/projeto Supabase isolado nem confirmação atual do backup nativo/PITR do Supabase. O próprio `docs/OPERACAO_LANCAMENTO.md` exige ambos antes de cobranças reais.

**Risco:** um backup íntegro no formato próprio pode ainda falhar na reconstrução operacional completa quando mais necessário.

**Ação obrigatória:** restaurar em ambiente isolado, validar migrations, Auth, Storage, funções, grants, RLS e os fluxos de dois usuários; registrar RPO, RTO e divergências. Confirmar no painel do Supabase a política de backup nativo aplicável ao plano atual.

**Critério de aceite:** relatório de restore reproduzível, com contagens conferidas e smoke dos módulos; evidência do backup nativo ou aceitação formal e documentada do risco residual.

### P0-04 — Preflight mistura responsabilidades de ambientes diferentes

**Evidência positiva:** `/resumos/api/health` retornou `200`, com banco e reconciliação em estado `ok`. A migration operacional está funcional e o job de reconciliação possui heartbeat recente.

**Lacuna:** o preflight local retornou `false` para `content_admin`, `operations_alert` e `portable_backup`; esse resultado local não prova a configuração da Netlify. Além disso, o mesmo script exige credenciais da aplicação publicada e a frase/destino do backup executado no Windows. Colocar a frase de recuperação do backup na Netlify apenas para obter `true` seria incorreto e aumentaria a exposição de um segredo de recuperação. A entrega real de alertas de falha de reconciliação e backup não foi acionada nem observada.

**Risco:** falhas podem permanecer silenciosas justamente durante os primeiros cadastros e assinaturas.

**Ação obrigatória:** separar o preflight em verificações do runtime Netlify e verificações do host de backup; nunca copiar a frase de recuperação para a hospedagem. Executar cada parte no ambiente correto, tratando Mercado Pago/PayPal separadamente conforme o escopo; disparar um alerta sintético seguro de reconciliação e um de backup e confirmar o recebimento.

**Critério de aceite:** todos os indicadores não financeiros aplicáveis aprovados no respectivo ambiente, alerta recebido sem segredo ou dado pessoal e runbook com responsável e resposta esperada.

### P0-05 — Deploy do PRO Legis não possui proveniência confirmada nesta auditoria

**Evidência positiva:** `/legis`, o catálogo, a leitura por artigo, a leitura integral, os três temas e a sessão compartilhada funcionaram em produção.

**Lacuna:** o gateway do site encaminha `/legis` para `pro-legis-mvp.netlify.app`. Foi confirmado que `origin/main` do repositório PRO Legis está em `486d693`, mas a API pública da Netlify não permitiu confirmar o `commit_ref` do deploy de destino. A documentação do gateway ainda descreve a ativação como pendente, embora ela já esteja publicada.

**Risco:** uma zona que compartilha autenticação e assinatura pode estar funcional, mas não necessariamente corresponder ao código aprovado em `main` ou ao mesmo processo de release.

**Ação obrigatória:** registrar no release o SHA efetivamente publicado do PRO Legis, confirmar que o site de origem e o gateway pertencem ao mesmo controle operacional e atualizar a documentação do gateway.

**Critério de aceite:** SHA do deploy do PRO Legis igual ao commit aprovado, gate do repositório aprovado e registro conjunto dos SHAs de Site e Legis.

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
- teste remoto com dois usuários efêmeros: aprovado para notas, progresso, preferências, realces, imagens, entitlements, LGPD e Planner;
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
2. Criar contas Google sintéticas e executar a matriz de cadastro/entitlement/AAL.
3. Executar o restore isolado e registrar RPO/RTO.
4. Confirmar backup nativo do Supabase ou registrar aceitação formal do risco.
5. Separar e rodar o preflight nos ambientes corretos e testar a entrega dos alertas.
6. Confirmar e registrar o SHA publicado do PRO Legis.
7. Repetir o smoke móvel e desktop após qualquer ajuste resultante.
8. Somente depois executar a configuração e os testes financeiros de Mercado Pago e PayPal já reservados para a etapa final.

## Limitações desta auditoria

- não foi criado usuário Google novo;
- não foi realizada transação financeira;
- não foi enviado pedido LGPD;
- não foram cancelados nem excluídos dados reais;
- não foi executado restore em infraestrutura externa;
- não foi acessado o painel de billing do Supabase;
- o conteúdo jurídico não foi submetido a uma revisão material nesta execução.
