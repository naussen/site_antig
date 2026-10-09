# Operação de lançamento e atualizações

## Gate P0 para cobrança

Cobranças reais permanecem bloqueadas operacionalmente até que todos os itens abaixo tenham evidência:

1. migration `035_launch_operations_hardening.sql` aplicada no Supabase compartilhado;
2. `npm run release:preflight:app` com todos os indicadores `true` no ambiente da aplicação publicada;
3. plano Supabase com backup nativo ativo;
4. backup lógico completo, chave portátil e cópia off-site;
5. restore executado em projeto Supabase isolado;
6. Mercado Pago e PayPal validados em sandbox: criação, retorno abandonado, webhook duplicado, cancelamento, falha, estorno e chargeback;
7. um canário real de baixo valor por provedor, autorizado previamente pelo responsável humano;
8. alertas de falha de reconciliação e backup testados;
9. smoke autenticado de `/resumos` e `/legis` em celular e desktop;
10. release criada a partir de worktrees limpas de `origin/main`.

No host Windows responsável pelo backup, execute separadamente:

```powershell
npm run release:preflight:backup
```

Esse comando valida a tarefa agendada, a idade do backup, a descriptografia por DPAPI, a chave portátil e os hashes da cópia off-site. O preflight da aplicação imprime somente booleanos e nunca deve receber a frase de recuperação do backup. A frase permanece exclusivamente no host de backup, protegida por DPAPI durante o repouso.

## Ordem de uma release

1. Abrir branch curta a partir de `origin/main`.
2. Para banco, usar migration aditiva e compatível com Site e LEGIS.
3. Validar Deploy Preview com Supabase de homologação e dados sintéticos.
4. Exigir o workflow `Release gate` nos dois repositórios.
5. Aplicar a migration antes do código que dependa obrigatoriamente dela.
6. Publicar primeiro componentes compatíveis com schema antigo e novo.
7. Executar smoke público e autenticado.
8. Acompanhar `/resumos/api/health`, webhooks e logs por no mínimo 60 minutos.
9. Registrar SHA do Site, SHA do LEGIS e migrations aplicadas.

O `netlify.toml` executa lint, TypeScript e todos os testes Node antes do build. Um deploy reprovado não é publicado.

## Rollback

- Aplicação: publicar o último deploy Netlify aprovado e registrar o incidente.
- Banco: preferir correção adiante; não apagar coluna ou tabela na mesma release que deixa de usá-la.
- Conteúdo: arquivar/restaurar versões e manifests; não substituir textos oficiais por cópia não versionada.
- Pagamentos: desabilitar novos checkouts, manter webhooks e reconciliar o estado diretamente nos provedores.

## Restore trimestral

1. Criar projeto Supabase isolado, sem usuários reais ativos.
2. Restaurar o backup nativo ou dump integral.
3. Restaurar objetos de Storage a partir da cópia off-site.
4. Usar o backup lógico para conferência de tabelas, contagens, Auth e arquivos.
5. Validar migrations, funções, RLS, grants e dois usuários sintéticos.
6. Validar notas, realces, Planner, Questões, entitlement e leitura LEGIS.
7. Registrar RPO, RTO, divergências e ação corretiva.

## Monitoramento mínimo

- `/resumos/api/health` deve responder `200`; `503` indica banco indisponível ou reconciliação sem sucesso há mais de 26 horas;
- `ops_job_runs` registra somente estado, horário, métricas agregadas e código seguro de erro;
- a função de reconciliação roda a cada seis horas e, assim como o backup, envia alerta genérico por `OPS_ALERT_WEBHOOK_URL` quando falha;
- o backup diário deve gerar `.probackup`, `.key.dpapi`, `.key.recovery` e `.summary.json` quando a recuperação portátil estiver habilitada;
- nenhuma notificação ou log pode conter payload do provedor, token, cookie, e-mail completo ou conteúdo pessoal.
