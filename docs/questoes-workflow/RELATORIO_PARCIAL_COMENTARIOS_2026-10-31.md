# Progresso parcial e handoff da revisão de comentários

## Interrupção e escopo real

**Interrompido em 31/10/2026, às 15h05 de Brasília, por orientação do usuário: a execução deve continuar no Antigravity.** O processo Python desta conversa foi encerrado e a ausência de outro executor `review_comments.py run` foi conferida. Nenhuma nova chamada ao Vertex ou gravação editorial foi iniciada após essa orientação.

Workspace preservado: `C:\PRO\worktrees\questoes-revisao-comentarios-20261031`.
Branch do checkpoint: `fix/questoes-comentarios-20261031`.
Base anterior à execução: `177eb43`.

Esta é uma execução **parcial**, com ferramentas ainda em desenvolvimento. Não houve certificação do acervo, conclusão da campanha, merge em main ou deploy.

## Números reconciliados na parada

| Registro | Quantidade | Significado |
| --- | ---: | --- |
| Questões no snapshot | 1.806 | 1.771 publicadas e 35 arquivadas. |
| População desta campanha | 1.771 | Publicadas; nenhuma draft encontrada para incluir. |
| Itens com parecer final automatizado salvo | **307** | 17,33% da população, em 18 disciplinas. Não equivalem a aprovação humana. |
| Pareceres `correct` | **24** | Propostas provisórias; não são 24 atualizações no banco nem 24 liberações editoriais. |
| Pareceres `hold` | **283** | Retenções por conteúdo, fonte, entrada ou validação local. Parte precisa de reavaliação pelos defeitos do executor descritos abaixo. |
| Sem parecer final salvo | **1.464** | Incluem itens ainda não iniciados e etapas parcialmente executadas. |
| Checkpoints de chamadas concluídas | **341** | Incluem piloto, revisões cegas, confronto e reavaliações; não representam 341 questões diferentes. |
| Artefatos de erro de lote | **11** | Nove `ClientError`, um `JSONDecodeError` e um `ValueError`; houve respostas 429 por capacidade/quota. Não somar esses lotes ao número de questões examinadas. |
| Questões associadas a PDF local por hash | 1.659 | Os outros 112 itens não tiveram o PDF localizado por esse preparador. Isso não prova inexistência da fonte. |

Reconciliação: **1.771 = 307 + 1.464**; **307 = 24 + 283**. A seleção priorizou os defeitos conhecidos e grupos de origem; não foi amostra aleatória. Esses números não estimam a taxa geral de erro.

O [índice congelado do progresso](PROGRESSO_PARCIAL_COMENTARIOS_2026-10-31.json) lista os 307 IDs, estados, bloqueios, hashes e referências aos checkpoints. `summary.json` em scratch é um contador operacional e pode estar desatualizado em relação ao instante da parada; o índice congelado e este relatório usam os arquivos realmente existentes após encerrar o processo.

## Alteração efetivamente aplicada por esta conversa

**Uma questão:** CONAB 2014, Assistente Administrativo, original 11.

- `external_id`: `exam:conab-2014-assistente-adm:item:011`;
- UUID: `0af846ba-4893-4534-bb1b-781145d06053`;
- substituído comentário genérico por dedução explícita: aplica na bolsa → não cria gado → planta → não vende a fazenda; conclusão A;
- texto publicado é idêntico ao do autor cego e recebeu confronto em outra execução, além da conferência local da dedução;
- SHA-256 UTF-8 do comentário aplicado: `fa72b770ee66f88674448558b58a0e8ff6bab35a6a84ed0c7ab2d7ed762ce37e`;
- aplicação transacional pelo CLI administrativo Supabase, após dry-run, com comparação de conteúdo anterior, questão, opções, chave e relações, além de backup e SQL de reversão;
- releitura em **15h07 de Brasília** confirmou texto/hash, estado `published` e referência de fonte preservada. Essa releitura não alterou dados.

Artefatos locais: `scratch/revisao-execucao-20261031/patch-002/{patch.json,dry-run.sql,apply.sql,rollback.sql,receipt.json}` e `applied-verification.json`.

**Não reaplicar esse patch. Não executar `rollback.sql` durante a retomada normal.** O campo `applied: false` dos pareceres da IA descreve a etapa de revisão e não foi usado como recibo do publicador; para esta questão, prevalecem o recibo e a releitura acima. Não interpretar esse campo como autorização para repetição.

## Alterações concorrentes preservadas

O primeiro dry-run (`patch-001`) continha três questões. Ele abortou porque o comentário da CONAB 14 já havia mudado desde o snapshot. **A transação foi revertida integralmente; nenhuma das três foi gravada por esse teste.** Só depois foi preparado o patch restrito à CONAB 11.

Comparando o snapshot inicial com o snapshot pós-aplicação, foram observadas oito mudanças de comentário: **uma desta conversa e sete concorrentes**. Todas as questões, alternativas, chaves e relações de disciplina/tópico comparadas permaneceram iguais entre esses dois snapshots. Não foram consultados dados pessoais para essa conferência.

As sete mudanças concorrentes correspondem a BB 16/26/28/29, CONAB 14 e PF 2018 41/42, conforme os registros da outra worktree. Isso é compatível com o trabalho em `C:\PRO\worktrees\questoes-memoria-calculo-20261031`, que passou a registrar o commit **`89756c7`**. Atribuição e completude devem ser reconferidas na retomada; não contar essas sete como correções desta conversa.

Essa outra branch altera alguns dos mesmos builders/gates e inclui a migration `044_fix_question_trigger_security_definer.sql`. **Não reaplicar migration nem sobrescrever os arquivos dessa branch por suposição.** O Antigravity deve comparar os dois conjuntos e preservar o trabalho concorrente.

## Situação dos três exemplos iniciais

| Identidade compatível com os filtros informados | Situação nesta execução |
| --- | --- |
| BB 35, renda fixa | Há candidato do Codex, fonte primária recuperada e nova revisão independente com `correct`. **Não foi aplicado.** A ressalva de gabarito não definitivo foi preservada no candidato final. |
| BB 32, fuga de capitais | Proposta produzida, mas retida. Falta texto-base comum no cadastro e há pendências documentais/fonte. **Não foi aplicado.** |
| TJSP 76, anuidades por gráficos | Proposta produzida, mas retida. Os gráficos não constam nos campos editoriais consultados e a solução gerada também necessita conferência de números e do termo “sempre”. **Não foi aplicado.** |

“Questão 4/5” continua sendo ordinal da tela, dependente de filtros e ocultações. Usar os IDs do relatório inicial, não o ordinal, na retomada.

## Implementação preparada, ainda sujeita a revisão

- `review_comments.py`: inventário por ID/hash, associação a PDFs, execução Vertex/ADC em lotes pequenos, autor cego, resolvedor independente e confronto, cache, fontes HTTP com allowlist, contas por AST restrita/Decimal e registros de retenção. O executor não escreve no banco e não executa código produzido pela IA.
- `comment_patch.py`: prepara backup lógico por ID e SQL de dry-run/aplicação/rollback. A transação verifica o estado esperado e preserva os demais campos. Não cria tabelas, funções permanentes ou migrations. **Não usar as 24 propostas em massa antes dos ajustes e da revisão abaixo.**
- `editorial_guard.py` e seis builders: saídas antigas passam a `held`, comentários não revisados ficam separados no manifesto, e declarações estáticas de revisão não liberam publicação. É um bloqueio preventivo, não a autoria definitiva dos comentários. Os builders precisam depois consumir resultados reais aprovados.
- `build_full_campaign_data.py`: resolve sua própria worktree e impede declarar a campanha pronta quando não existe item efetivamente liberado. Não foi executada uma regeneração integral com essas alterações.
- `tests/test_comment_review.py`: testes offline de aritmética, rejeição de código, IDs, URLs, SQL e retenção dos builders.

Nenhuma dessas mudanças de código foi promovida para produção. Não houve mudança de dependências ou schema nesta conversa. `node_modules` desta worktree é uma junction local para as dependências existentes e não deve ser commitido.

## Pontos obrigatórios antes de retomar chamadas ou aplicar propostas

1. **Revalidar os pareceres offline.** O processo longo carregou uma versão anterior do validador que confundia o final de `https:/` com unidade Windows. O arquivo atual já corrige a regex e tem teste, mas os pareceres salvos durante a execução não foram todos recalculados. Preservar os originais e reavaliar as condições locais sem pagar novamente por resolução já válida. Isso não autoriza remover outros bloqueios.
2. **Não confiar só em `correct`.** BB 19/20 e CONAB 12 aparecem entre os 24, embora existam problemas de extração. O preparador de patch atual recusa os padrões conhecidos. Critérios essenciais devem ser rechecados com fonte e apresentação reais.
3. **Separar “fonte acessível” de “afirmação comprovada”.** O fetch valida domínio/HTTP/conteúdo, mas texto recuperado não comprova automaticamente que sustenta a conclusão. URLs genéricas, páginas que só entregam shell JavaScript e referências inventadas precisam continuar reprovadas. Houve timeouts no Planalto e páginas do BCB que retornaram apenas shell; isso é uma limitação de acesso, não prova de erro do conteúdo.
4. **Revisar qualquer texto alterado pelo revisor.** Se o confronto reescreveu o rascunho, uma aprovação do rascunho anterior não basta. Exigir parecer independente sobre o hash do comentário final. A CONAB 11 aplicada não sofreu essa reescrita; o candidato final da BB 35 foi submetido à exigência de preservação exata.
5. **Conferir cálculo e segurança fora do modelo.** Conferir unidades, hipóteses, precisão e resultados; a AST restrita só confere as expressões fornecidas e não prova que elas modelam a questão. Impedir fórmulas ou código arbitrário e não usar a presença de cabeçalhos como evidência semântica.
6. **Preservar checkpoints compatíveis.** Houve mudanças de prompt/política/formato durante o piloto. Nem todos os checkpoints antigos contêm `request_payload` ou o campo de hash do prompt individual. Conferir estágio, modelo, política e hashes; não renomear arquivos para forçar reaproveitamento. Mudança de namespace do hash pode exigir migração verificada do índice, evitando repetir chamadas compatíveis.
7. **Consolidar falhas e limites.** Os retries atuais são limitados e alguns lotes ficaram sem conclusão. Custos/uso de respostas falhadas ou truncadas não foram todos registrados; melhorar a captura de uso e os limites antes de ampliar a execução. `summary` e estado `correct` não são contabilidade de faturamento nem autorização automática de publicação.
8. **Atualizar o snapshot e detectar concorrência.** Há sete comentários concorrentes conhecidos e um aplicado aqui. Antes de qualquer patch, reler os dados, invalidar as revisões da versão antiga que mudou e reconciliar todos os deltas. Não atualizar o hash esperado apenas para fazer uma gravação passar.

## Uso do Vertex e estimativa de custo

Configuração existente do PYGEM, ADC e `gemini-3.5-flash`; nenhuma chave, `.env` ou credencial foi alterada ou copiada para os documentos. Houve geração real de teste e chamadas reais de revisão. Não foi conferido o saldo de créditos ou o faturamento da conta.

Nos 341 checkpoints salvos: **1.181.017 tokens de entrada**, **588.126 de resposta**, **38.131 de pensamento**, total informado de **1.807.274 tokens**. A soma das estimativas dos checkpoints é **US$ 49,799838**.

Essa é uma **estimativa bruta por tabela**, que cobra conservadoramente todas as queries de grounding e não desconta franquia, créditos ou descontos. Também não inclui integralmente respostas com falha não salvas e chamadas fora desses checkpoints. **Não é valor faturado nem saldo consumido confirmado.** Base de preços consultada: [Google Cloud](https://cloud.google.com/model-garden/pricing). Não reiniciar as 1.771 questões do zero.

## Verificação realizada e limites

- 83 testes Node de conteúdo, autenticação administrativa, contrato/importação e workflow: passaram.
- Nove testes Python novos e cinco testes existentes do workflow: passaram; nenhuma chamada paga nesses testes.
- Lint: zero erros, sete avisos preexistentes.
- Build Webpack e verificação TypeScript integrada: passaram.
- `git diff --check`: passou antes do handoff; verificação documental executada na entrega.
- Releitura da CONAB 11: comentário aplicado confere com o hash aprovado; questão, opções, chave e relações preservadas na comparação dos snapshots.
- Smoke autenticado em produção: CONAB 11 localizada pela busca; o novo comentário e os símbolos foram exibidos, e “Ver resposta” manteve os contadores observados sem responder a questão.

**Não realizados:** censo completo, revisão humana especializada, auditoria adicional pós-correção, matriz controlada desktop/mobile e três temas, restauração real de rollback e validação integral dos geradores alterados. A captura de página inteira teve timeout; não há screenshot salvo como evidência entregue. Não declarar qualidade integral ou correção de segurança concluída com base nos testes acima.

## Arquivos operacionais e próximo passo

Diretório que deve ser preservado integralmente: `C:\PRO\worktrees\questoes-revisao-comentarios-20261031\scratch\revisao-execucao-20261031`.

Entradas úteis: `inventory.json`, `catalog-before.json`, `catalog-after-001.json`, `records/`, `calls/`, `record-history/`, `http-sources/`, `errors/`, `handoff-summary.json`, `supplemental.json`, `candidates.json`, logs e os dois diretórios de patch. **Scratch é ignorado pelo Git:** os dados continuam nesta máquina, mas não são transportados por um clone da branch. O índice versionado contém hashes para conferir a cópia; se mudar de máquina, transferir os artefatos de forma controlada, sem incluir credenciais.

O próximo executor deve usar o [prompt atualizado de retomada](PROMPT_AUDITORIA_CORRECAO_COMENTARIOS_2026-10-31.md), começar pelos ajustes offline e pela conciliação com a outra worktree, e só então continuar a revisão e as correções. Nenhuma nova execução foi agendada pelo Codex.
