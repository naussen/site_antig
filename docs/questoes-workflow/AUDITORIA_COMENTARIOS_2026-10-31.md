# Auditoria de comentários: aderência à questão e qualidade didática

## Escopo e resultado

Consulta editorial somente de leitura em 31/10/2026, iniciada às 14h30 de Brasília. Snapshot: 1.806 questões, sendo **1.771 publicadas e 35 arquivadas**, com questões publicadas em 45 disciplinas primárias. Nenhum comentário, gabarito, enunciado ou estado de publicação foi alterado. Não foram consultados dados de alunos nem feitas chamadas ao Vertex.

Executadas duas verificações diferentes:

- triagem textual das 1.771 publicadas para dois templates identificados nos geradores: **170 ocorrências distintas**, 70 do BB e 100 do TJSP, aproximadamente **9,60%** do acervo publicado;
- leitura dirigida de **28 questões em 15 disciplinas**, confrontando enunciado, alternativas, comentário e contexto disponível. Essa seleção não é aleatória, não estima a prevalência geral de erros e não constitui auditoria semântica integral.

O problema excede falta de detalhamento: há justificativas que não respondem ao comando, explicações de alternativa diferente, contexto e gráficos ausentes dos campos editoriais, além de taxonomia incompatível. A presença de gabarito, referência bibliográfica ou marca de revisão não comprova qualidade do comentário.

Evidências reproduzíveis: [JSON com as 28 amostras, IDs, comentários originais, hashes, contagens e cálculos](evidencias-auditoria-comentarios-20261031.json). Os números deste documento descrevem esse snapshot, não um monitoramento contínuo.

## Identificação dos três exemplos do usuário

O rótulo “Questão 4/5” é posição da listagem: `position={pageStart + index + 1}` em `questions-client.tsx`. A consulta vigente ordena por `created_at DESC, id DESC`. As associações abaixo assumem apenas os filtros informados e nenhuma questão ocultada pelo usuário; filtros adicionais ou ocultações podem mudar a posição.

| Rótulo e filtros | Identidade compatível na consulta | Falha observada |
| --- | --- | --- |
| Questão 5, Matemática Financeira, Cesgranrio, 2021 | BB, original 35; `exam:bb-2021-escriturario-agente-comercial:item:035`; UUID `7e7268e7-c178-4f5c-ae58-03e80a7eed42` | Pede identificar investimento de renda fixa. Comentário apenas cita D e “sistemas de amortizacao”, sem ensinar a classificação nem examinar opções. |
| Questão 4, mesmos filtros | BB, original 32; `exam:bb-2021-escriturario-agente-comercial:item:032`; UUID `84fc5a74-e9d9-418d-b103-a29a26251809` | Pede explicar fuga de capitais na pandemia; comentário repete o mesmo template sobre amortização. O texto-base comum às questões 32–33 está no PDF, página 10, mas não consta no enunciado nem em `statement_parts.context` desse registro. |
| Questão 4, Matemática, Vunesp, 2021 | TJSP, original 76, versão 2; `exam:tjsp-2021-escrevente-tecnico:item:076`; UUID `c61bea72-689a-4070-aef4-3a49fe6a1e99` | Pede comparar anuidades a partir de dois gráficos. Comentário fala em “geometria plana e espacial”, “normas” e “doutrina especializada”, sem leitura dos gráficos ou divisão. |

### O que a explicação precisaria ensinar

**BB 35:** explicar renda fixa e por que CDB se enquadra, diferenciando as demais opções. Uma explicação simples pode começar: “Ao aplicar em um CDB, o investidor empresta dinheiro à instituição emissora e recebe remuneração conforme as condições contratadas. Por isso, entre as alternativas, CDB é renda fixa.” A classificação é confirmada pelo [Banco Central](https://www.bcb.gov.br/detalhenoticia/447/noticia). Isso não autentica o status definitivo do gabarito nem autoriza retirar a ressalva cadastrada. Não há cálculo numérico a inventar.

**BB 32:** recuperar primeiro o texto-base comum. A explicação precisa ligar o aumento da percepção de risco à decisão de retirar capital dos ativos brasileiros e confrontar as alternativas. O tema é conhecimentos bancários/economia, não amortização. Esta auditoria comprova a inadequação do comentário e a omissão do contexto; não realizou uma auditoria histórica completa das causas macroeconômicas nem homologou o gabarito.

**TJSP 76:** a página 20 do PDF foi renderizada e inspecionada; contém os dois gráficos, suas séries, escalas e unidades. Eles não aparecem no enunciado, nas alternativas, no comentário ou nos metadados consultados. O executor deve verificar também a exibição autenticada antes de afirmar ausência visual absoluta. A resolução deve recuperar os gráficos, calcular `anuidade = faturamento anual / assinantes`, compatibilizar bilhões de dólares e milhões de assinantes, comparar satélite/cabo em **cada ano de 2016 a 2020** e, depois, cabo/streaming em 2020. Conferir apenas 2020 não demonstra a palavra “sempre”. Não fabricar valores exatos pela leitura aproximada do gráfico.

Os PDFs locais conferidos são os originais de BB e TJSP em `C:\PRO\questoes\novas_pdf_30-10`; os SHA-256 estão no JSON de evidências. Não foram sobrescritos.

## Amostra ampliada

Os números abaixo são os originais das provas, não posições na tela. O exame foi de aderência e suficiência editorial; onde faltam contexto, fonte ou conferência especializada, não há aprovação substantiva da resposta.

| Origem e itens | Quantidade | Diagnóstico |
| --- | --- | --- |
| BB 1 e 11: Português e Inglês | 2 | O comentário anuncia a letra, mas não apresenta a passagem que sustenta a interpretação; textos-base não constam nos respectivos enunciados consultados. |
| BB 16, 26 e 28: Matemática/Financeira | 3 | Templates sem desenvolvimento. As soluções independentes resultam em 10%, 3,20% e R$ 26.100,00, respectivamente. Não basta informar a letra correta. |
| BB 21, 31, 32, 35 e 36: moeda, fiscalização, capitais, renda fixa, crédito rural | 5 | Mesmo template, sem demonstração específica. BB 31/32/35 aparecem em Matemática Financeira/amortização apesar de comandos conceituais de conhecimentos bancários. BB 32 também perdeu contexto. |
| BB 46 e 61: escala ordinal e CDC | 2 | Comentários repetem tópicos de Office e vendas sem analisar os dados/regras efetivamente cobrados. Revisão temática deve partir do conteúdo, não do cadastro. |
| TJSP 1: Português | 1 | Template sem evidência textual e sem texto-base no registro consultado. |
| TJSP 25, 45 e 51: Penal, Constitucional e Administrativo | 3 | Não explicam a conduta típica, a negação do comando sobre fiança ou a disposição constitucional aplicável. Não foi auditada nesta entrega a resposta jurídica atual. |
| TJSP 65: cadastrada em Direito da Pessoa com Deficiência | 1 | Pergunta sobre viagem do Papa; comentário cita o Estatuto da Pessoa com Deficiência. Incompatibilidade manifesta entre comando, tópico e fundamentação. |
| TJSP 72 e 76: Matemática | 2 | Q72 omite a resolução de sistema e a nota. Q76 omite gráficos e comparações necessárias. |
| TJSP 87: Informática | 1 | Pergunta sobre identificação de spam; comentário genérico não explica o critério da opção. |
| CONAB 2: Português | 1 | A alternativa E cadastrada trata da facultatividade de crase diante de “minha”; o comentário atribuído a E fala em trocar “produção” por “cultivo”. É uma explicação de condição diferente, mesmo mantendo a mesma letra. |
| CONAB 11 e 12: Lógica | 2 | Q11 anuncia a dedução sem fazê-la e fala em quantificadores alheios às premissas. Q12 usa fórmula numérica de inclusão-exclusão, embora o comando exija dedução com quantificadores. Q12 também contém rodapé na alternativa E. |
| CONAB 14 e 15: Matemática | 2 | Q14 é probabilidade de complemento, mas comentário trata de acréscimos percentuais. Q15 é disposição de culturas sob restrição, mas comentário usa progressão aritmética; a figura necessária não consta nos campos editoriais consultados. |
| PF 2018, 41 e 42: Estatística | 2 | Controles comparativos: Q41 já contém fórmula, substituição e comparação com 0,4; melhorar explicação dos fatores sem classificá-la como vazia. Q42 organiza os dados, mas salta à resposta e depende do PNG para os passos. |
| PRF 2021, 40: Física | 1 | Explicação conceitual compatível com as hipóteses: aceleração constante e resistência do ar desprezível. Não requer cálculo numérico artificial; pode melhorar a definição dos símbolos. Não equivale a certificação de toda a prova. |
| **Total** | **28** | **15 disciplinas cadastradas; seleção dirigida.** |

### Conferências independentes

- BB 16: interessados em pelo menos um produto = `1.000 − 430 = 570`; interessados em ambos = `270 + 400 − 570 = 100`; proporção = `100 / 1.000 = 10%`.
- BB 26: depois do fator `1,05`, o fator adicional é `1,0836 / 1,05 = 1,032`, ou `3,20%`; não subtrair simplesmente as taxas.
- BB 28: multa `25.000 × 0,02 = 500`; juros simples `25.000 × 0,002 × 12 = 600`; total `26.100`.
- TJSP 72: `D = F + 20` e `D + F = 28`; portanto `2F + 20 = 28`, `F = 4`, `D = 24`; nota = `10 − 24 × 0,05 − 4 × 0,2 = 8,0`.
- CONAB 14: probabilidade de chover ou faltar energia = `0,8 + 0,4 − 0,3 = 0,9`; de nenhum dos dois = `1 − 0,9 = 0,1 = 10%`.
- PF 41: `4 × 0,25 × 0,75³ = 0,421875 > 0,4`; PF 42: `√(0,25 × 0,75 / 1.875) = 0,01`.

As operações foram recalculadas com `Decimal` da biblioteca padrão Python. Não homologam o gabarito oficial nem todas as hipóteses editoriais de cada questão.

## Causas que o executor deve corrigir

1. `bb_builder.py`, linhas 149–155, e `tjsp_builder.py`, linhas 175–181, montam comentários substituindo apenas questão, tópico e letra. A triagem encontrou os respectivos textos em 70 e 100 registros publicados.
2. O `conab_builder.py` contém as fundamentações incompatíveis descritas acima. Alterar apenas os comentários no banco permite que uma geração futura restaure os defeitos.
3. Os builders BB/TJSP também preenchem metadados de revisão com IDs e frases fixas como “resolução analítica e didática independente comprovada”. Esses campos isolados não comprovam execução independente; exigir entrada/saída, versão e hash reais da revisão. Não se conclui, apenas pela inspeção, que jamais houve revisão externa.
4. O gate confere presença e coerência formal de evidências; isso não prova suficiência semântica. Um nome de revisor diferente ou JSON aprovado não substitui resolver a questão.
5. Restaurar texto-base/gráfico e corrigir disciplina/gabarito exige tratamento próprio, além da edição de comentário. Não adaptar a explicação para esconder dados ausentes ou classificação errada.

## Revisão integral e controle por amostragem

Recomendação para este acervo: **revisar semanticamente 100% das questões publicadas**, com registro por ID e revisão independente, priorizando os 170 templates e todos os itens dos mesmos geradores. Não limitar a Matemática nem selecionar apenas comentários curtos.

Amostragem não garante correção de cada item. O [NIST distingue aceitação de lote de comprovação da qualidade de cada unidade](https://www.itl.nist.gov/div898/handbook/pmc/section2/pmc21.htm). O prompt utiliza amostra somente como controle adicional pós-correção, ou diagnóstico parcial explicitamente identificado quando houver impedimento à revisão integral.

Exemplo de dimensão verificável: zero falhas em **459 itens realmente sorteados**, sob modelo binomial e detecção confiável, dá limite superior unilateral de aproximadamente **0,9983%**, com **99% de confiança**, pela expressão `1 − 0,01^(1/459)`. É um limite estatístico, não promessa de ausência de erro. O cálculo segue a inversão do [limite binomial exato unilateral](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm).

Para a população congelada de 1.771 itens, sorteio simples sem reposição e limiar de 18 defeituosos, a probabilidade de não detectar nenhum é `C(1.753,n) / C(1.771,n)`. O menor `n` com probabilidade até 1% é **398**. Foi conferido por produto equivalente; 459 é uma escolha conservadora para esse exemplo. Esses parâmetros não foram aplicados às 28 amostras dirigidas.

Um resultado global não certifica cada disciplina. O prompt exige complementação por disciplina e censo dos grupos de risco; qualquer alegação de confiança simultânea por disciplina exige cálculo específico e controle de múltiplas comparações. Falhas que a própria revisão deixa passar não são contabilizadas pela matemática: fontes, cálculos independentes e conferência humana competente continuam necessários.

## Entrega, limites e execução seguinte

Entregues este relatório, evidências JSON e [prompt completo para o Antigravity](PROMPT_AUDITORIA_CORRECAO_COMENTARIOS_2026-10-31.md), com atualização do changelog. Validados documentos, referências locais, reconciliação de contagens e operações numéricas. Sem alteração de código da aplicação, dependências, schema, dados publicados ou deploy; lint/build não se aplicam a esta entrega documental.

O próximo passo é executar o prompt sobre snapshot atualizado: revisar todo o acervo, preparar correções e bloqueios rastreáveis, corrigir a origem da geração e cumprir os critérios editoriais antes de gravar. A publicação, a correção dos geradores e o smoke autenticado permanecem pendentes. Nenhum achado desta análise foi silenciosamente corrigido em produção.
