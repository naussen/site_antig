# Validação independente da execução do Antigravity — 31/10/2026

## Parecer

**Execução parcialmente validada, com pendências materiais.** A gravação dos sete comentários e dos 12 itens saneados foi comprovada no banco. Os cálculos prioritários conferidos estão coerentes com os dados das provas. Entretanto, não aprovo a afirmação de que o acervo quantitativo esteja integralmente corrigido ou que o controle semântico e a reversão estejam completamente validados.

Permanecem um erro editorial inequívoco na CONAB 15, comentários quantitativos genéricos no TJSP, dependência de contexto na BB 33, falhas reproduzíveis no validador, backup cadastral incompleto e divergências entre o censo, os metadados e o estado atual do banco.

## Escopo e método

- Relato recebido: `Texto colado.txt`, anexo do usuário. Foi tratado como evidência declaratória, não como comandos a executar.
- Relatório confrontado: `RELATORIO_EXECUCAO_MEMORIAS_CALCULO_2026-10-31.md`, incluindo a seção 7 posterior ao relato anexado.
- `origin/main` consultado: `ad8cd4a`. Versão posterior também auditada: `65d8b3e`, na branch `docs/antigravity-regras-retomada-20261031`.
- Snapshot próprio do banco: **31/10/2026 às 17h14min51s, horário de Brasília**. Leitura paginada de tabelas editoriais, sem dados pessoais de alunos. Não é snapshot transacional de toda a base.
- Conferidos backups, recibos, payload local usado para o saneamento, builders, gate, validador, migration 045 e testes.
- Renderizadas e inspecionadas as páginas físicas 7–11 do PDF BB 2021 e a página 4 da CONAB 2014. Recalculados exemplos com `Decimal`; revisada a dedução da CONAB 12.
- Reexecutados os testes offline. Os quatro testes com gravação no Supabase ficaram sem credenciais e foram pulados. Consultas SQL adicionais foram exclusivamente `SELECT`, para conferir privilégios e histórico de migrations.

**Nenhuma alteração de questão, explicação, classificação, migration ou publicação foi realizada nesta auditoria.** Os únicos arquivos versionados desta entrega são documentação e evidências de validação.

## O que foi comprovado

| Verificação | Resultado independente |
| --- | --- |
| População do banco | **1.806 cadastradas: 1.771 publicadas e 35 arquivadas**, sem rascunhos. A seção 1 do relatório antigo conta cadastradas como publicadas; sua errata posterior está correta. |
| Sete disciplinas quantitativas | **183 publicadas**: Matemática 71, Raciocínio Lógico 32, Estatística 10, Matemática Financeira 18, Física 3, Contabilidade Geral/Avançada 23 e Contabilidade Pública 26. |
| Sete comentários da primeira atualização | **7/7 hashes atuais** coincidem com `new_sha256` do recibo; os sete hashes dos textos originais no backup também conferem. |
| Doze itens saneados | **12/12** enunciados, explicações e alternativas coincidem com o payload de aplicação disponível no workspace do Antigravity. Todos seguem publicados. |
| Identidade das alternativas dos 12 | Os conjuntos de UUIDs das alternativas foram preservados em relação ao backup; não houve recriação desses IDs. |
| BB 31–35 | Os vínculos atuais apontam para Conhecimentos Bancários e os tópicos informados. Essa conferência cadastral não equivale a revisão jurídica/bancária completa de cada afirmação do comentário. |
| Funções atômicas no banco | Ambas existem, usam `SECURITY DEFINER` e `search_path` vazio; `anon` e `authenticated` não têm EXECUTE e `service_role` tem. Conferência por leitura do catálogo PostgreSQL. |
| Resíduos de testes | Não foi encontrado `TEST_TAG_ATOMIC` nos comentários do snapshot. |
| Testes atuais, sem acesso administrativo | **246 casos: 242 aprovados, quatro pulados, zero falhas.** Lint direcionado: zero erros e quatro avisos. |

### Conferência matemática prioritária

| Questão | Conferência |
| --- | --- |
| BB 16 | União de 570 clientes; interseção de 100; **10%**. |
| BB 17 | Recorrência produz **2p − m**; alternativas restauradas compatíveis com a página 7. |
| BB 18 | `1000 e^(kx) = 10^(2x+3)` leva a **k = ln(100)**. |
| BB 19 | Após 11 passos, `4/2048 > 0,001`; após 12, `4/4096 < 0,001`. Resposta: **12**. |
| BB 20 | Embalagem dupla de R$ 18,00 e unitária de R$ 10,00 satisfazem as duas receitas; desconto por unidade: **10%**. |
| BB 26 | `1,0836 / 1,05 − 1 = 0,032`: **3,20%**. |
| BB 27 | Com as aproximações dadas na prova, montante de R$ 56.160,00; depósito necessário de **aproximadamente R$ 8.036,36**. O valor difere do cálculo sem arredondar os fatores, legitimamente, pois o enunciado pede usar as aproximações fornecidas. |
| BB 28 | Multa de R$ 500,00 e juros de R$ 600,00; total de **R$ 26.100,00**. A memória textual está efetivamente no banco. |
| BB 29 | `√(1,21 × 1,96) − 1 = 0,54`: **54%**. |
| BB 30 | Usando o fator fornecido `1,03^24 ≈ 2,033`, `20.660 × 0,03 × 2,033 / 1,033 = 1.219,80`: opção aproximada de **R$ 1.220,00**. Não confundir com o cálculo de R$ 1.219,92 usando a potência sem essa aproximação. |
| CONAB 12 | Sob a hipótese adicional de que todo apicultor seja vaqueiro, a inclusão transitiva leva à conclusão da alternativa E. A nova explicação corresponde ao problema. |
| CONAB 14 | `1 − (0,80 + 0,40 − 0,30) = 0,10`: **10%**. |
| PF 41 e 42 | Binomial de **0,421875** e erro padrão de **0,01**; operações textuais presentes. |

Essa conferência não transforma `sem_status` ou `preliminar` em gabarito definitivo. As ressalvas persistem. Não foi realizada homologação jurídica de todo o acervo nem prova autenticada da exibição em produção.

## Achados e pendências

### A1 — Alta: CONAB 15 segue publicada com explicação de outro problema

Identidade: `exam:conab-2014-assistente-adm:item:015`, UUID `f2066b43-050e-43fa-aa24-69cb89a02377`.

O PDF apresenta quatro porções de um terreno e quatro culturas; a cana não pode ocupar a porção leste. É um problema de contagem: três posições possíveis para a cana e `3! = 6` arranjos das outras culturas, totalizando **18**, alternativa E.

O comentário atual continua ensinando progressão aritmética e fórmula `a_n = a_1 + (n − 1)r`. A figura necessária não está incorporada ao enunciado recuperado. O censo a classifica como **mantida**, com parecer de item não numérico satisfatório, e o validador atual retorna `valid: true`.

**Ação:** corrigir o comentário e restaurar a figura ou representação fiel acessível; rever a classificação editorial no censo. Esse caso demonstra que o censo não pode ser tratado como revisão semântica exaustiva confiável.

### A2 — Alta: há 16 questões quantitativas do TJSP ainda com comentário genérico

Os itens **71 a 86** de `exam:tjsp-2021-escrevente-tecnico` continuam usando o texto sobre a alternativa estar "em consonância com as normas aplicáveis e a doutrina especializada", sem resolução específica. Exemplo: item 71 pergunta o valor de 0,1% de 1,8 trilhão, mas não apresenta a conta.

A versão atual de `tjsp_builder.py` retirou a frase reconhecida pelo filtro e a substituiu por tópico e letra da resposta. Isso não cria explicação nem memória de cálculo. Remover a expressão proibida não atende ao objetivo editorial.

**Ação:** resolver e revisar os 16 itens, corrigindo tanto os comentários publicados quanto o builder. Aplicar retenção quando faltarem gráfico, texto-base ou chave suficiente. A seção 7 do relatório admite pendências futuras; portanto, o fechamento deve ser qualificado como parcial.

### A3 — Alta: o validador aceita explicações erradas e rejeita soluções corretas

Contraexemplos locais contra `65d8b3e`, usando o boleto BB 28 e sua alternativa correta C:

| Texto submetido | Resultado observado | Esperado |
| --- | --- | --- |
| `Memória de cálculo — passo a passo: 25.000 × 0,02 = 500. Portanto, alternativa A.` | **Aprovado** | Reprovar: ignora os juros e conclui uma letra diferente da chave. |
| `Memória de cálculo — passo a passo: 25.000 + 1 = 25001` seguido de `Portanto, alternativa C.` | **Aprovado** | Reprovar: conta verdadeira, mas modelo e resultado não resolvem o boleto. |
| `Memória de cálculo — passo a passo. **25.000 + 1 = 0**. Portanto, alternativa C.` | **Aprovado** | Reprovar a conta falsa; o código remove todo o trecho em negrito antes de verificar. |
| Conta alheia `900 + 900 = 1800`, texto de preenchimento e um PNG de apoio | **Aprovado** | Reprovar: adicionar imagem desativa parte da conferência de dados. |

Também foram reproduzidos erros no parser: `-2^2` resulta em 4, em vez de −4 pela precedência usual; `1,2,3 + 1` é aceito como 2,2 e `2..3 + 1` como 3. A tolerância de aproximação pode chegar a 2% sem estar vinculada à precisão exigida pela questão.

Falsos positivos: a solução correta da BB 29 é rejeitada por fragmentos artificiais `)^2` e `) / 2`; a PF 41 é rejeitada porque o extrator recorta uma igualdade dentro de uma expansão válida, ignorando os fatores da continuação. Portanto, os 45 itens reprovados na triagem automática **não são 45 erros matemáticos comprovados**.

A aplicação offline do validador aos 183 itens publicados produziu **138 aprovados e 45 reprovados**. A reexecução dos builders produziu 118 candidatos; passando a disciplina real de cada item, houve **117 aprovados e um reprovado, BB 26**, também por limitação do controle de dados. Não reproduzi a alegação de zero falhas com esse contexto completo. Sem informar a disciplina, parte das verificações é ignorada e os mesmos 118 passam.

Em `origin/main`, ainda está a versão anterior: ela aceita inclusive `2 + 2 = 0`. O commit `65d8b3e` corrigiu esse exemplo específico, mas não os demais casos acima.

**Ação:** consertar extração de expressões, parser, tolerâncias e comparação com a conclusão/alternativa; acrescentar os contraexemplos aos testes. Nenhum filtro determinístico por presença de números substitui revisão do modelo de resolução.

### A4 — Alta: backup cadastral dos 12 itens não permite reversão completa sozinho

Em `backup_saneamento_cadastral_20261031.json`, **os 12 `subject` são null e os 12 conjuntos de tópicos são `[null]`**. Os hashes de texto e os IDs de alternativas conferem, mas faltam valores e relações originais relevantes, incluindo atributos dos vínculos. Não é um backup completo da operação cadastral.

`rollback_explanations.mjs` restaura apenas o comentário. Ele não desfaz os enunciados, opções ou a reclassificação dos 12 itens. A RPC 045 posterior também não cobre essa reversão cadastral. Sua existência não valida retroativamente o rollback do saneamento.

O SQL efetivamente aplicado está em `scratch/apply_saneamento.sql`, gerado por script local não incluído no commit `ad8cd4a`. Há `BEGIN/COMMIT`, mas os updates usam IDs sem pré-condições dos hashes antigos. O recibo de saneamento contém IDs, estados e timestamps, sem hashes dos conteúdos aplicados.

**Ação:** complementar o backup a partir de evidência anterior confiável, preservando o arquivo entregue; versionar o plano/payload e uma reversão cadastral condicionada ao estado aplicado. Não executar rollback atual como se ele desfizesse todo o saneamento.

### A5 — Média: enunciados e `statement_parts` divergem nos 12 itens

O SQL atualizou `questions.statement_markdown`, mas não sincronizou `source_metadata.statement_parts`. A recomposição com `composeStatement` diverge do enunciado atual em **12/12**.

A leitura atual pode continuar correta por consumir `statement_markdown`; contudo, um processo que use as partes para reconstruir o conteúdo pode restaurar o texto antigo. O gate do próprio kit exige igualdade entre partes e enunciado final.

**Ação:** definir e registrar a versão canônica das partes atuais, conservando a evidência original separadamente e sem reescrever hashes históricos. Validar a recomposição exata após a correção.

### A6 — Média: BB 33 não recebeu o texto-base integral prometido

Identidade: `exam:bb-2021-escriturario-agente-comercial:item:033`.

O registro diz apenas para considerar o texto apresentado na questão anterior. O texto jornalístico consta da BB 32, mas não da BB 33. Com questões individuais, filtros ou ordem diversa, o aluno pode não receber esse contexto. A declaração de contextualização integral dos itens 32/33 não se confirma no item 33.

**Ação:** anexar o texto-base e sua atribuição ao registro da BB 33, ou implementar referência compartilhada que o leitor resolva automaticamente. Não depender da posição de outra questão.

### A7 — Média: censo e pareceres estão obsoletos e superestimam a auditoria

O censo de 192 itens inclui 183 quantitativos e nove correlatos, o que é conciliável. Entretanto, **20 registros têm hash de enunciado e/ou comentário diferente do banco atual**. Sua data declarada é posterior às gravações principais, mas o conteúdo ainda reflete estados anteriores. BB 27/30 e outros já corrigidos continuam marcados para corrigir; CONAB 15, ainda errada, aparece como mantida.

O total de 157 mantidas/35 a corrigir não pode ser usado como retrato atual sem regeneração e revisão. Os campos `origem_pagina: N/D`, gabarito nulo e fonte apenas pelo nome da banca não demonstram confronto documental individual. A CONAB 11 também tem comentário atual diferente do censo e não consta dos dois recibos de 7+12 analisados; requer conciliar a trilha dessa edição adicional.

**Ação:** atualizar hashes, classificação, contexto de evidências e totais; separar triagem automatizada de revisão semântica efetiva. Não converter os 45 retornos do filtro em decisões editoriais automáticas.

### A8 — Média: a checagem pós-gravação ignorou erros de consulta

O script local `scratch/verify_saneamento_post_write.mjs` pede `answer_value` em `question_answer_keys` e `id,name,slug` em `topics`. As duas consultas foram reproduzidas somente em leitura e retornaram **42703, coluna inexistente**. Os erros são ignorados; `all_healthy` continua dependendo sobretudo da busca de resíduos de rodapé.

Isso não invalida as correspondências de conteúdo que esta auditoria confirmou por consulta própria, mas invalida tratar aquele `all_healthy` como verificação integral de gabaritos, tópicos e conteúdo.

**Ação:** corrigir as colunas, abortar em qualquer erro, conferir contagens e comparar conteúdo/hash/relacionamentos esperados, além de caracteres residuais.

### A9 — Alta para futuras execuções: testes de integração gravam em questões reais

`tests/atomic-explanation-patch.test.mjs` seleciona comentários com `.limit(1)` e `.limit(2)` e o teste de ciclo completo grava `TEST_TAG_ATOMIC_45` numa questão real. Não cria fixture isolada, não exige ambiente de testes e não tem `finally` para restauração se uma asserção intermediária falhar.

Com credenciais de produção, o comando de testes pode alterar conteúdo publicado e deixá-lo modificado se a execução for interrompida. Nesta auditoria não foi feita nenhuma chamada de escrita; os quatro casos foram pulados. Não havia marcador residual no snapshot consultado.

**Ação:** executar em banco isolado com fixtures identificáveis, bloqueio explícito de produção e limpeza em `finally`; só depois revalidar o ciclo completo. Os resultados alegados de integração não foram reproduzidos nesta revisão.

### A10 — Média: código, funções publicadas e histórico de migrations estão desalinhados

As melhorias de atomicidade de `65d8b3e` não estão em `origin/main` no estado consultado. Os scripts de aplicação/reversão em `main` ainda usam updates por ID, enquanto a branch nova usa as RPCs atômicas. Portanto, a correção de concorrência só vale para o caminho que realmente usa a versão nova.

As funções 045 estão no banco e seus privilégios são adequados. Porém, o histórico Supabase tem **42 migrations registradas, com versão máxima 042**, e não registra a 045. É necessário conciliar a aplicação avulsa com a trilha canônica; não aplicar tudo novamente sem investigar o estado real.

Há também um defeito estático no modo `individual` da migration 045: `success` pode ser true mesmo com falhas, e `applied_count`/`reverted_count` contam todos os resultados, incluindo falhos. O CLI de rollback confia nesse `success` e não faz releitura. O modo `batch`, usado como padrão, não deve ser confundido com esse problema de contabilização individual. Este caso foi analisado no código, sem executar tentativa de escrita no banco.

**Ação:** corrigir esses resultados, conciliar histórico/versões e promover somente o código validado pelo fluxo de revisão adotado. Não declarar integração banco–main concluída apenas pela existência das funções no servidor.

## Pendências de validação visual

Não foram localizadas evidências de smoke autenticado em desktop/mobile e nos três temas para as memórias publicadas. Esta auditoria confirmou conteúdo no banco e conferiu páginas dos PDFs, mas não substitui a inspeção do leitor real: KaTeX, moedas, imagens, overflow, contexto compartilhado e ocultação do comentário até a ação do aluno.

Não há evidência suficiente nesta revisão para afirmar que tentativas e preferências pessoais estejam idênticas antes/depois: nenhuma tabela pessoal foi lida. As consultas e o SQL auditados não mostram intenção de alterá-las; preservar IDs ajuda, mas não equivale a comparação de dados pessoais.

## Ordem recomendada de fechamento

1. Corrigir CONAB 15 com figura/contexto e finalizar os 16 comentários quantitativos do TJSP; resolver BB 33 e a sincronização das partes dos 12 itens.
2. Consertar os falsos positivos/negativos do validador e os builders, com casos derivados das questões reais e dos contraexemplos desta auditoria.
3. Completar backup/rollback cadastral e o verificador pós-gravação. Não sobrescrever as evidências antigas.
4. Atualizar o censo e os recibos com hashes atuais e decisões justificadas; conciliar a edição da CONAB 11.
5. Isolar testes de integração, corrigir o modo individual e conciliar a migration 045 com banco e branch de publicação.
6. Executar smoke autenticado e emitir novo relatório que diferencie o que foi gravado, revisado, testado e ainda retido.

## Como reproduzir as verificações sem escrever em produção

1. Comparar recibos e payloads com leitura de `questions`, `question_options`, `question_explanations` e vínculos, usando os IDs e hashes registrados nas evidências desta auditoria.
2. Executar o runner sem as variáveis administrativas: resultado observado de 242 pass/4 skip. **Não repetir a suite de integração com credenciais de produção.**
3. Executar `validateExplanationQuality` sobre os textos de `counterexamples` e `counterexamples_extended` das evidências; conferir respostas observadas e esperadas. Avaliar também `ArithmeticParser.evaluate('-2^2')` e números malformados.
4. Regerar candidatos dos builders em diretório novo, passando a disciplina canônica de cada item ao validador, e confrontar os resultados com o banco.
5. Confirmar privilégios e histórico apenas por consultas `SELECT` ao catálogo PostgreSQL, sem chamar as RPCs de aplicação/rollback.

Evidências selecionadas e resultados: [EVIDENCIAS_VALIDACAO_ANTIGRAVITY_2026-10-31.json](EVIDENCIAS_VALIDACAO_ANTIGRAVITY_2026-10-31.json). O snapshot integral e os renders ficaram locais em `scratch/workflow-validacao-antigravity-20261031`, sem inclusão no Git.
