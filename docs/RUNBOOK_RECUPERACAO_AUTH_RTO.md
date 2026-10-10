# Runbook de recuperação OAuth/MFA e medição de RTO

## Objetivo e estado atual

Este runbook orienta a recuperação do Google OAuth, do acesso administrativo com TOTP/AAL2 e do serviço completo após incidente. Ele não contém credenciais e não autoriza redução temporária dos controles de autenticação.

Estado confirmado em 09/10/2026:

- o login público aceita somente Google OAuth;
- administradores dependem de identidade Google, `app_metadata.role = admin` e TOTP/AAL2;
- o backup lógico diário, criptografado e off-site foi restaurado com sucesso em Supabase local isolado;
- o projeto de produção retornou `pitr_enabled: false` e `backups: []`;
- o restore automatizado do projeto aceita somente destino local e rejeita banco remoto;
- segredos OAuth, fatores TOTP e sessões ativas não fazem parte do backup lógico.

Consequentemente, os passos locais deste documento são executáveis, mas o RTO completo de reconstrução remota permanece **não medido** até existir um projeto isolado de homologação e um método aprovado para restaurar nele.

## Regras inegociáveis

1. Não reabilitar login por senha, magic link ou e-mail como atalho de recuperação.
2. Não remover a exigência de AAL2 do código, das APIs ou das policies.
3. Não promover uma conta por e-mail antes de confirmar que ela já possui identidade Google legítima.
4. Não vincular ou mesclar identidades automaticamente apenas porque os e-mails coincidem.
5. Não registrar Client Secret, Service Role, QR code, segredo TOTP, token, cookie ou frase de recuperação em ticket, chat, terminal compartilhado ou evidência.
6. Não restaurar sobre produção durante ensaio. Usar ambiente isolado e dados sintéticos.
7. Não apagar cliente OAuth, usuário, fator ou projeto durante diagnóstico. Revogação definitiva ocorre somente após validação do substituto.
8. Manter novos checkouts fechados até o término do restore, da reconciliação e do smoke autenticado.

## Papéis mínimos

Uma mesma pessoa pode acumular papéis apenas quando não houver outra disponível, mas deve registrar essa exceção.

| Papel | Responsabilidade |
| --- | --- |
| Coordenador do incidente | Declara o incidente, escolhe a estratégia e controla os marcos do cronômetro. |
| Executor técnico | Opera Supabase, Google Cloud, hospedagem e restore. |
| Verificador | Confere identidade, destino, hashes, testes e aprovação do retorno. |
| Responsável de negócio | Autoriza retorno de cadastros e cobranças após a reconciliação. |

Para remoção administrativa de um fator MFA, exigir executor e verificador distintos sempre que possível. O operador não deve aprovar sozinho uma troca de fator solicitada por mensagem ou e-mail.

## Pré-requisitos que devem existir antes do incidente

- duas contas humanas com acesso de proprietário/administrador à organização Supabase, protegidas por MFA da própria plataforma;
- dois responsáveis autorizados no projeto Google Cloud/Google Auth Platform;
- acesso de proprietário à hospedagem e ao DNS;
- inventário dos nomes das variáveis e dos locais onde são configuradas, sem copiar seus valores;
- último `.probackup`, `.key.recovery` e `.summary.json` em armazenamento off-site;
- frase de recuperação guardada separadamente;
- repositórios, migrations e SHAs publicados identificáveis;
- contato e procedimento de escalonamento do suporte Supabase;
- relógio em UTC e planilha ou ticket para registrar marcos sem dados pessoais.

Se um desses pré-requisitos faltar, registrar a lacuna. Não compensar criando uma credencial compartilhada ou armazenando segredo no repositório.

## Classificação rápida do incidente

| Sintoma | Estratégia inicial |
| --- | --- |
| Usuários Google falham, banco e `/api/health` respondem | Recuperação do Google OAuth. |
| Um administrador entra pelo Google, mas perdeu o TOTP | Recuperação de fator MFA. |
| Conta Google administrativa também foi perdida | Recuperação da Conta Google antes de qualquer ação no aplicativo. |
| Banco íntegro, mas deploy quebrou autenticação | Rollback da aplicação para o último SHA aprovado. |
| Banco corrompido ou indisponível com backup nativo | Restore nativo/PITR pelo Supabase. |
| Projeto perdido e sem backup nativo | Reconstrução isolada pelo backup lógico; não apontar produção antes dos gates. |

## Procedimento A — recuperar Google OAuth

Use este procedimento quando o provedor estiver desabilitado, o segredo tiver sido perdido/comprometido ou o callback falhar.

1. Declarar o incidente e registrar `T0` em UTC.
2. Confirmar que `/resumos/api/health` e o banco estão saudáveis. Se não estiverem, seguir o procedimento de desastre completo.
3. Confirmar no Google Auth Platform o projeto e o cliente Web corretos, sem expor o segredo.
4. Conferir as origens autorizadas e a callback apresentada pelo próprio painel do Supabase. Não deduzir a callback por memória.
5. Se o segredo estiver comprometido ou indisponível, criar um novo segredo no mesmo cliente OAuth. Manter o anterior ativo durante a transição quando ele ainda for confiável.
6. Atualizar o provedor Google em Supabase Authentication usando o novo segredo. O segredo fica somente no cofre/painel do provedor.
7. Conferir no Supabase a Site URL e a allowlist de redirects de produção. Não adicionar wildcard ou preview público.
8. Executar os testes, nesta ordem:
   - iniciar login em janela sem sessão;
   - concluir callback com conta sintética não administrativa;
   - confirmar que um usuário existente mantém o mesmo usuário/identidade;
   - confirmar que conta sem entitlement não lê conteúdo pago;
   - confirmar login de administrador em AAL1 e bloqueio do acervo;
   - confirmar TOTP e elevação para AAL2.
9. Se um novo Client ID tiver sido inevitável, comparar cuidadosamente os identificadores das identidades. Não mesclar contas pelo e-mail; interromper e investigar qualquer duplicação.
10. Somente após os testes, desabilitar o segredo antigo. Monitorar um novo login público e um administrativo. Depois da janela de rollback definida no incidente, excluir o segredo antigo.
11. Registrar `T_OAUTH` quando login novo, login existente e AAL2 estiverem aprovados.

Critério de saída: Google-only preservado, callback válido, usuários existentes sem duplicação, usuário comum sem privilégio e administrador bloqueado em AAL1/liberado em AAL2.

## Procedimento B — recuperar MFA administrativo

### B1. Ainda existe outro fator ou sessão AAL2 válida

1. Confirmar a identidade Google e o papel administrativo na sessão.
2. Usar a API oficial de MFA para remover somente o fator perdido, já em AAL2.
3. Cadastrar e verificar o novo TOTP em dispositivo controlado pelo administrador.
4. Encerrar outras sessões, entrar novamente pelo Google e confirmar AAL1 antes do desafio e AAL2 depois dele.
5. Confirmar que operações administrativas falham em AAL1 e funcionam apenas em AAL2.

### B2. Todos os fatores do administrador foram perdidos

1. O solicitante entra novamente pelo Google e permanece em AAL1. Isso comprova o primeiro fator, mas não autoriza operação administrativa.
2. Um operador autorizado confirma, por canal independente, a identidade do solicitante e a propriedade da conta Google. Não aceitar como única prova uma mensagem enviada pela própria conta potencialmente comprometida.
3. O verificador confere o UUID do usuário e a presença de identidade Google no Supabase. Não selecionar o usuário apenas pelo texto do e-mail.
4. Pelo painel administrativo do Supabase, se a função estiver disponível, ou pela Auth Admin API em processo local controlado, remover somente o fator TOTP verificado daquele UUID. A operação administrativa `deleteFactor` encerra as sessões ativas do usuário.
5. Não imprimir o UUID completo, o identificador do fator ou qualquer token no registro público do incidente.
6. O administrador entra novamente pelo Google. Sem fator verificado, `/resumos/admin` deve apresentar o cadastro de TOTP.
7. Escanear o QR code diretamente no autenticador; não capturar tela nem copiar o segredo para o ticket.
8. Confirmar o código, verificar AAL2 e repetir o teste negativo em AAL1 e positivo em AAL2.
9. Registrar quem solicitou, quem executou, quem verificou, horário e resultado, sem segredos.

### B3. Perda simultânea de Google e TOTP

1. Recuperar primeiro a Conta Google pelos canais oficiais do Google.
2. Se a propriedade do projeto Google ou Supabase também estiver perdida, usar o processo de recuperação de conta/propriedade desses provedores.
3. Somente depois de recuperar e validar a identidade Google executar B2.
4. É proibido criar senha temporária, conta administrativa fixa ou bypass no frontend.

Critério de saída: fator antigo removido, todas as sessões anteriores invalidadas, novo TOTP verificado, AAL1 bloqueado e AAL2 aprovado.

## Procedimento C — recuperação completa do serviço

### C1. Com backup nativo ou PITR ativo

1. Registrar `T0`, horário estimado do incidente e último ponto íntegro conhecido.
2. Fechar cadastros e checkouts e preservar webhooks para reconciliação, quando seguro.
3. Selecionar no Supabase o ponto imediatamente anterior ao incidente. Restaurar causa indisponibilidade; comunicar a janela.
4. Executar o restore pelo mecanismo nativo. Não interromper o processo.
5. Revalidar extensões, funções, triggers, RLS, grants, jobs, Auth, Realtime e metadados do Storage.
6. Restaurar separadamente objetos do Storage quando necessário; backup de banco preserva metadados, não o conteúdo dos objetos.
7. Reconfigurar ou rotacionar Google OAuth conforme o procedimento A.
8. Reinscrever MFA administrativo conforme B apenas se os fatores não estiverem disponíveis.
9. Executar os gates da seção “Validação para retorno”.

### C2. Sem backup nativo: backup lógico externo

Este é o estado atual. O fluxo aprovado hoje termina no Supabase local isolado:

```powershell
supabase start -x studio,imgproxy,edge-runtime,logflare,vector
npm run backup:restore:local -- --backup "CAMINHO_DO_BACKUP.probackup" --db-container supabase_db_site --confirm-local-project site
```

O comando valida hashes, contagens, chaves estrangeiras e quatro cenários RLS. Ele não aceita destino remoto.

Para um desastre real de produção:

1. Validar o pacote e a chave portátil em máquina autorizada.
2. Restaurar localmente e registrar `T_LOCAL_RESTORE`.
3. Criar um novo projeto Supabase isolado na região planejada, sem apontar domínio ou produção.
4. Aplicar migrations e configurações de infraestrutura compatíveis.
5. Usar apenas método de migração remota previamente revisado e ensaiado. **Hoje esse método ainda não existe no repositório; este é um stop condition.**
6. Restaurar objetos do Storage a partir da cópia off-site.
7. Recriar configurações que não pertencem ao banco: Auth, Google OAuth, URLs, chaves, Realtime, extensões e variáveis da hospedagem.
8. Tratar usuários e identidades como dados sensíveis. Não inventar fator TOTP nem mesclar identidades pelo e-mail.
9. Reinscrever administradores em MFA e executar os gates completos.
10. Somente após aprovação, atualizar hospedagem/DNS e manter checkouts fechados até reconciliar pagamentos e entitlements.

Sem o passo 5 testado em homologação, não declarar RTO completo nem capacidade comprovada de recuperação remota.

## Roteiro para medir o RTO completo

### Escopo do ensaio

O ensaio deve usar projeto Supabase e deploy de homologação isolados, dados sintéticos e uma cópia válida do backup. Não usar clientes reais, produção ou credenciais de produção no destino.

O cronômetro começa na declaração do incidente, não no início do comando de restore, e termina apenas quando o serviço está apto a reabrir.

### Objetivos provisórios

| Cenário | RPO máximo | RTO alvo provisório |
| --- | ---: | ---: |
| Reparo somente do Google OAuth | sem perda de dados | 60 minutos |
| Recuperação de TOTP administrativo | sem perda de dados | 60 minutos |
| Restore nativo/PITR no mesmo projeto | ponto selecionado | 4 horas |
| Reconstrução integral em novo projeto | 24 horas | 8 horas |

Os alvos são internos e provisórios. O resultado medido prevalece e deve ser usado para aceitar o risco ou financiar melhorias.

### Marcos obrigatórios

| Marco | Definição |
| --- | --- |
| `T0` | incidente declarado e cronômetro iniciado |
| `T_TRIAGEM` | estratégia escolhida e responsáveis definidos |
| `T_ARTEFATO` | backup, chave e hashes validados |
| `T_INFRA` | destino isolado disponível e configurações básicas aplicadas |
| `T_DADOS` | banco, Auth acessível e Storage restaurados |
| `T_OAUTH` | login Google novo e existente aprovados |
| `T_MFA` | administrador aprovado em AAL2 |
| `T_APP` | deploy conectado ao destino e `/api/health` saudável |
| `T_SEGURANCA` | RLS, autorização e testes negativos aprovados |
| `T_GO` | responsável autoriza reabertura; cronômetro encerrado |

Registrar para cada marco: horário UTC, minutos desde `T0`, executor, evidência não sensível, espera externa e desvio encontrado.

### Execução do ensaio

1. Preparar backup sintético e registrar o timestamp do dado mais recente recuperável.
2. Declarar o cenário sem aviso prévio ao executor e iniciar `T0`.
3. Validar artefatos com `npm run backup:verify`.
4. Executar a estratégia C1 ou C2 no ambiente isolado.
5. Configurar Google OAuth de homologação com callback e segredo próprios.
6. Criar/usar contas Google sintéticas autorizadas para o ensaio.
7. Reinscrever TOTP administrativo sem registrar QR code ou segredo.
8. Publicar o deploy isolado e executar a validação para retorno.
9. Simular rollback se um gate falhar; medir também o tempo de decisão e reversão.
10. Encerrar em `T_GO`, calcular métricas e destruir ou arquivar com segurança os dados sintéticos conforme a política do ensaio.

### Cálculos

```text
RTO completo = T_GO - T0
RPO observado = horário do incidente simulado - timestamp do dado mais recente recuperado
tempo técnico = soma dos períodos de execução ativa
tempo de espera = suporte + provisionamento + DNS + deploy + aprovações
```

Não subtrair espera de provedor ou aprovação do RTO completo. Registrar tempo técnico separadamente apenas para diagnóstico.

## Validação para retorno

Todos os itens abaixo precisam passar no destino recuperado:

- `/resumos/api/health` responde `200` com indicadores aplicáveis saudáveis;
- migrations esperadas estão presentes;
- contagens e hashes do backup conferem;
- não existem chaves estrangeiras órfãs;
- usuário anônimo e autenticado sem entitlement não leem conteúdo pago;
- assinante ativo lê o acervo e estados expirado/cancelado permanecem bloqueados;
- isolamento de notas, progresso, preferências, Planner, Questões e realces passa com dois usuários;
- administrador AAL1 permanece bloqueado e AAL2 é liberado;
- login Google funciona para conta nova sintética e conta existente;
- não houve duplicação ou vinculação indevida de identidade;
- Storage entrega objetos esperados e não expõe bucket privado;
- PRO Resumos e PRO Legis reconhecem a mesma sessão e entitlement;
- desktop e celular não apresentam erro crítico;
- logs não contêm token, cookie, e-mail integral, QR code ou segredo;
- reconciliação de pagamentos/entitlements foi executada antes de reabrir checkout.

## Critério de aprovação do ensaio

O ensaio é aprovado somente quando:

1. todos os marcos possuem horário e evidência;
2. RPO e RTO completos foram calculados;
3. nenhum segredo ou dado pessoal apareceu nos registros;
4. os testes negativos de acesso passaram;
5. o ambiente voltou por procedimento reproduzível, não por correção improvisada;
6. todo desvio possui responsável e prazo;
7. um segundo executor consegue repetir o procedimento.

Falha em qualquer item mantém o gate de recuperação em NO-GO.

## Registro mínimo do exercício ou incidente

```text
ID do exercício/incidente:
Data e cenário:
Coordenador / executor / verificador:
Backup e timestamp recuperado (sem caminho sensível):
T0:
T_TRIAGEM:
T_ARTEFATO:
T_INFRA:
T_DADOS:
T_OAUTH:
T_MFA:
T_APP:
T_SEGURANCA:
T_GO:
RPO observado:
RTO completo:
Tempo técnico:
Tempo de espera:
Resultado: APROVADO | REPROVADO
Desvios e ações corretivas:
```

## Depois da recuperação

1. Rotacionar credenciais que possam ter sido comprometidas, uma por vez e com teste entre rotações.
2. Revogar sessões anteriores quando aplicável.
3. Desabilitar e depois excluir segredos OAuth antigos somente após a janela de rollback.
4. Comparar transações, webhooks e entitlements desde o ponto recuperado.
5. Comunicar eventual perda de dados com base no RPO observado.
6. Atualizar este runbook, o relatório de lançamento e o checklist com tempos reais.
7. Repetir o exercício trimestralmente e após mudança relevante em Auth, backup ou infraestrutura.

## Referências oficiais

- Supabase: `https://supabase.com/docs/guides/auth/auth-mfa`
- Supabase Auth Admin `deleteFactor`: `https://supabase.com/docs/reference/javascript/auth-admin-deletefactor`
- Supabase Google OAuth: `https://supabase.com/docs/guides/auth/social-login/auth-google`
- Supabase backups e PITR: `https://supabase.com/docs/guides/platform/backups`
- Supabase restore para novo projeto: `https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore`
- Google OAuth clients e rotação de segredo: `https://support.google.com/cloud/answer/15549257`
