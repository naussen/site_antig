# Prompt de retomada após parecer técnico

Abra `C:\PRO\worktrees\questoes-memoria-calculo-20261031` no Antigravity e copie o bloco integral. Este documento não executa correções e não afirma que as pendências já foram sanadas.

```text
Execute a correção das pendências técnicas e editoriais identificadas na revisão do trabalho de memórias de cálculo do PROQuestões. Preserve as melhorias já aplicadas. Não refaça a campanha do zero nem execute rollback de produção para demonstrar seu funcionamento.

Workspace: C:\PRO\worktrees\questoes-memoria-calculo-20261031.
Leia AGENTS.md aplicável e docs/questoes-workflow/RELATORIO_EXECUCAO_MEMORIAS_CALCULO_2026-10-31.md, seus backups/recibos, scripts/questions-workflow/explanation_validator.mjs, apply_explanation_patches.mjs, rollback_explanations.mjs, gate.mjs e os testes relacionados. Inspecione também o mecanismo efetivamente usado no saneamento dos 12 itens e todos os caminhos administrativos que possam publicar o mesmo contrato.

PARECER DE ENTRADA — VERIFIQUE NOVAMENTE, NÃO ASSUMA CORREÇÃO
1. O validador aprovou estes dois comentários em uma questão com boleto de R$ 25.000, juros de 2% e atraso de 12 dias:
   a) “Memória de cálculo — passo a passo: 2 + 2 = 0”;
   b) “Memória de cálculo — passo a passo: 900 + 900 = 1800. Portanto o boleto de 25000 será de 1800.”
   A primeira conta é falsa. A segunda usa uma conta verdadeira para sustentar uma conclusão sem correspondência com o problema. Regex e cabeçalho não provam qualidade semântica.
2. O aplicador conferia o hash em uma leitura anterior e depois fazia UPDATE somente pelo question_id. Isso permite sobrescrita entre a checagem e a gravação. Um loop de requests separados não é transação atômica do lote.
3. O rollback restaurava por ID, sem exigir que o estado atual fosse exatamente a versão aplicada. Pode apagar uma edição legítima posterior.
4. O relatório declarava 1.806 publicadas; a consulta da revisão encontrou 1.771 publicadas e 35 arquivadas. Também não foi demonstrada revisão individual completa das 188 quantitativas.
5. Foram confirmados os hashes dos sete comentários do primeiro recibo e a existência dos 12 itens saneados, sem caracteres privados nos enunciados/comentários consultados. Isso não comprova fidelidade integral das alternativas, qualidade de todo o acervo ou exibição nos três temas/mobile.

FASE 1 — ESTADO ATUAL E RECONCILIAÇÃO
Confira Git/status/diff e alterações concorrentes. Crie ou mantenha branch própria; não altere main, histórico, credenciais ou trabalho preexistente. Registre plano curto, escopo, riscos e critérios de aceite antes de editar.
Obtenha snapshot editorial paginado recente. Recalcule publicadas/arquivadas/drafts e a população quantitativa; não copie números antigos como se fossem atuais. Separe contagem do banco, itens efetivamente examinados, propostas, revisões e gravações. Conte IDs únicos e reconcilie totais.
Preserve questões/opções/IDs, chaves, ressalvas, dados de alunos e hashes históricos. Compare as versões atuais com os recibos antes de reaproveitar proposta. Registre mudanças concorrentes; não troque o hash esperado pelo atual para forçar aplicação.

FASE 2 — PROTEÇÃO DE GRAVAÇÃO E REVERSÃO
Implemente atualização administrativa com comparação e gravação atômicas do estado esperado. Proteja também as entradas que sustentaram a revisão: enunciado/contexto, alternativas, chave e relações relevantes. Use transação server-side com bloqueios/pré-condições ou mecanismo equivalente comprovado; não apenas SELECT seguido de UPDATE por ID.
Defina a unidade atômica explicitamente. Se a unidade for lote, qualquer falha deve desfazer todo o lote. Se forem unidades independentes, documente o comportamento parcial e mantenha recibos duráveis por unidade; não chame isso de atomicidade de lote.
O rollback deve comparar o estado atual com a versão que pretende desfazer e abortar em edição posterior. Deve restaurar somente os campos realmente alterados e preservar os demais. Proíba restauração indiscriminada por ID.
Antes de produção, teste em ambiente isolado: edição concorrente entre leitura e escrita, lote com falha intermediária, ID inexistente, zero linhas alteradas, execução repetida, rollback normal e rollback após outra edição. Confira efeitos de triggers e autorização. Mudança de schema/função exige migration canônica, tipos e privilégios mínimos; não enfraqueça RLS nem exponha service role.

FASE 3 — CORREÇÃO DO CONTROLE EDITORIAL
Transforme os dois contraexemplos em regressões obrigatórias e amplie os testes para zero/negativos, decimais brasileiros, milhares, porcentagens, prioridades, parênteses, arredondamentos e expressões malformadas. Inclua controles corretos equivalentes para evitar um bloqueio que rejeita tudo.
Não execute código produzido por IA. Use parser aritmético restrito, sem eval/new Function, e cálculo determinístico apropriado, como Decimal/Fraction. Distingua expressão suportada, expressão inválida e expressão não verificável. O que não foi verificado não recebe aprovação automática.
Separe três verificações: cálculo numérico; correspondência de dados/unidades/hipóteses ao enunciado; suficiência didática e atendimento ao comando/alternativas. Uma expressão verdadeira não comprova a modelagem, e um número ausente do enunciado pode ser derivação legítima. Não proíba todos os números novos por regex.
Exija solução independente antes do acesso à chave/comentário e revisão do texto final por outra execução. Fonte efetivamente consultada precisa sustentar a afirmação; URL existente ou confiança do modelo não basta. Se o revisor reescrever, revisar novamente o novo hash antes de aprovar. Identifique IA como IA.
O gate determinístico é auxiliar. Não o anuncie como auditor semântico completo, mesmo com testes aprovados. Confira todos os caminhos de importação/aplicação para que nenhum publique contornando a validação compartilhada e a revisão necessária.

FASE 4 — CONTEÚDO, ORIGINAIS E COBERTURA
Reconfira os sete comentários e os 12 itens saneados contra os originais do mesmo caderno/versão. Confira enunciado, texto-base, fórmula, tabela, opções, chave e ressalvas; ausência de caracteres privados não comprova transcrição fiel. Não adaptar alternativa ou chave para coincidir com o comentário.
Complete revisão individual de toda a população quantitativa atual, incluindo cálculos existentes em outras disciplinas. Mantenha por ID: entrada/hash, origem/página, demonstração, cálculo independente, comentário anterior/proposto/final, parecer, fontes e situação. Estados exclusivos: mantida, corrigir, bloqueada, pendente. Aprovação e aplicação são fases separadas.
Para iniciantes, toda resolução quantitativa precisa de dados/unidades, conversões, regra com símbolos definidos, substituição, operações intermediárias, resultado e interpretação no texto. Imagem complementa. Conceitual recebe dedução adequada, sem conta inventada. Confira negativas/EXCETO e a alternativa efetivamente cadastrada.
Problemas de classificação, falta de contexto ou gabarito duvidoso geram pendência própria; não ocultá-los em edição de comentário. Preserve a situação preliminar/sem_status e não invente homologação ou revisão humana. Não certifique todo o site por ter revisado alguns itens.
Corrija builders/geradores para não restaurarem defeitos. Gere candidatos em pasta nova e compare deltas, sem sobrescrever originais ou campanhas antigas. Teste a saída real dos geradores e sua passagem pelo gate; presença de uma correção no código não prova que ela é produzida e aceita corretamente.

FASE 5 — VALIDAÇÃO REAL E RELATÓRIO CORRIGIDO
Execute testes novos e existentes pertinentes, lint, TypeScript e build conforme mudanças. Leia a documentação local antes de alterar Next.js. Testes automatizados não fazem chamadas pagas ao Vertex. Na campanha real, use Vertex/ADC existente, limites de chamadas/tokens/concorrência/custo e checkpoints por conteúdo/prompt/modelo/estágio. Não expor segredos nem enviar dados de alunos.
Após aplicar correções autorizadas, releia 100% dos registros alterados e compare conteúdo/hash com o aprovado. Verifique campos preservados e recibos. Faça smoke autenticado dos formatos afetados em desktop/celular e Claro/Escuro/Sépia: fórmulas, moeda, imagens, overflow e Ver resposta sem registrar tentativa. Não simular revisão visual apenas pela contagem de marcadores.
Corrija o relatório existente sem apagar seu histórico: adicione errata e resultados com data, população e evidências. Retire afirmações de exaustividade/segurança que não puder demonstrar. Informe testes executados/falhados/não executados, cobertura por ID, pendências, custo estimado versus faturado, alterações no banco, código, deploy e smoke separadamente.
Critério de conclusão: contraexemplos tratados, ausência de sobrescrita concorrente demonstrada, reversão condicionada testada, população reconciliada, revisão individual concluída ou explicitamente parcial, leitura pós-gravação e validação visual documentadas. Pendência não vira aprovação para encerrar.
Atualize CHANGELOG.md, faça commit atômico e push da branch própria. Não faça deploy/merge main automaticamente. Prossiga nas etapas já autorizadas sem pedir confirmação repetida; se faltar decisão indispensável, prepare primeiro todo o resultado concreto revisável e apresente uma única decisão consolidada. Não confunda autorização operacional com revisão humana realizada.
```
