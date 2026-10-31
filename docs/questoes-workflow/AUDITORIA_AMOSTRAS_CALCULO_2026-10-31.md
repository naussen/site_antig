# Auditoria de amostras de exatas — 31/10/2026

## Escopo e evidências

Consulta ao banco em 31/10/2026, às 14h18, horário de Brasília. Foram lidos somente conteúdo editorial, disciplinas, relações, alternativas e gabaritos; nenhum dado de aluno. Nenhuma questão, comentário ou estado de publicação foi alterado. Inspeção do código em `9e062c1`; base documental desta entrega em `ab4735d` (a diferença entre eles é a landing).

A triagem encontrou 188 questões publicadas nas sete disciplinas quantitativas consultadas: Matemática 71, Raciocínio Lógico 32, Estatística 10, Matemática Financeira 23, Física 3, Contabilidade Geral e Avançada 23 e Contabilidade Pública 26. É uma delimitação inicial por catálogo, não uma garantia de que todo cálculo do site esteja nessas disciplinas. Houve análise dirigida de 13 amostras, sem auditoria semântica completa das 188.

Quinze comentários desse conjunto contêm o mesmo texto genérico sobre a alternativa ser "compatível com as noções teóricas e técnicas": dez em Matemática Financeira e cinco em Matemática. Isso comprova repetição de template, não que todos os quinze sejam exercícios de cálculo; cinco dos dez da primeira disciplina são questões conceituais aparentemente classificadas de forma inadequada.

## Questão citada pelo usuário

O rótulo **Questão 3** é a posição na listagem, não a identidade da questão. O componente recebe `position={pageStart + index + 1}`. Na ordenação atual por `created_at DESC, id DESC`, com os filtros Matemática Financeira, Cesgranrio e 2021, a terceira corresponde a:

- `external_id`: `exam:bb-2021-escriturario-agente-comercial:item:028`;
- UUID: `b460d264-06c4-40b2-8ca4-5af2bc5531a7`;
- origem: BB 2021, prova A, gabarito 1, questão original 28;
- conteúdo: boleto de R$ 25.000,00, atraso de 12 dias, multa de 2% e juros simples de 0,2% ao dia.

Essa identificação é compatível com os filtros citados; histórico pessoal de ocultação, outros filtros ou mudança da ordenação podem alterar o ordinal. O comentário salvo informa a alternativa C e usa uma frase genérica. Não contém dados organizados, fórmula aplicada, substituição, operações ou interpretação do resultado.

### Memória que deveria acompanhar o comentário

1. **O que queremos descobrir:** o total do boleto depois do atraso.
2. **Dados:** valor original de R$ 25.000,00; atraso de 12 dias; multa única de 2%; juros simples de 0,2% por dia.
3. **Multa:** 2% significa 2 a cada 100. Assim, `25.000 × 0,02 = 500`. A multa é R$ 500,00 e é cobrada uma vez.
4. **Juros:** 0,2% ao dia equivale a `0,2 ÷ 100 = 0,002`. Em juros simples, os juros são calculados sobre o valor original: `25.000 × 0,002 × 12 = 600`. Os juros são R$ 600,00.
5. **Total:** `25.000 + 500 + 600 = 26.100`.
6. **Conclusão:** o valor devido é **R$ 26.100,00**, correspondente à alternativa C cadastrada. Não usar juros compostos nem cobrar a multa novamente a cada dia.

A aritmética foi conferida independentemente com `Decimal`. Essa conferência demonstra a solução matemática a partir do enunciado recuperado, não autentica o status do gabarito. O registro declara `answer_status = sem_status`; a ressalva não deve ser removida por acrescentar a solução.

## Outras amostras verificadas

As identidades abaixo usam os números originais; não são posições da tela.

| Identidade | Encontrado | Encaminhamento |
| --- | --- | --- |
| BB 2021, itens 26–30 | Cinco comentários genéricos, sem desenvolvimento específico. | Resolver e explicar cada item; revisar também contexto, aproximações e alternativas antes de aprovar. |
| BB 2021, itens 16–17 | Comentários genéricos em conjuntos/porcentagem e recorrência de Fibonacci. | Apresentar união/interseção e derivação dos termos, respectivamente. |
| CONAB 2014, item 14 | Probabilidade de chuva/energia recebeu comentário sobre acréscimos percentuais e regra de três. | Substituir a fundamentação incorreta pela união e seu complemento, explicando os eventos. |
| CONAB 2014, item 12 | Lógica de quantificadores recebeu fórmula de contagem e afirma que substituiu valores inexistentes. | Explicar a implicação entre conjuntos; não fabricar cálculo numérico. |
| PF 2018, Estatística, item 41 | Fórmula binomial, substituição, resultado e imagem já presentes. | Não classificar como ausência total; conferir se a imagem e a explicação dos fatores atendem ao novo padrão. |
| PF 2018, Estatística, item 42 | Texto define os dados, mas salta ao resultado; a memória está em PNG. | Incorporar os passos e a interpretação no texto, preservando o anexo útil. |
| IBAMA 2021, Contabilidade Pública, item 82 | Dados selecionados e soma descrita, com PNG. | Melhorar a explicitação de `3.000.000 + 4.000.000 = 7.000.000`; revisão matemática não atesta a fundamentação legal. |
| PRF 2021, Física, item 40 | Explicação conceitual com relação vetorial, sem cálculo numérico necessário. | Não exigir uma conta artificial; conferir demonstração e definição dos símbolos. |

As 13 amostras são os cinco itens BB 26–30, dois BB 16–17, dois CONAB 12/14, dois PF 41/42, IBAMA 82 e PRF 40. Os registros e comentários consultados estão em `evidencias-memoria-calculo-20261031.json`.

### Resultados independentes de controle

| Exercício | Resultado matemático conferido |
| --- | --- |
| BB 26 — taxa adicional após 5%, limitada a 8,36% | `1,0836 ÷ 1,05 − 1 = 0,032`, ou 3,20%. |
| BB 28 — boleto | R$ 26.100,00. |
| BB 29 — taxa anual equivalente a retornos de 21% e 96% | `√(1,21 × 1,96) − 1 = 0,54`, ou 54%. |
| BB 30 — PRICE | Capital financiado de R$ 20.660,00; prestação de aproximadamente R$ 1.219,92, compatível com R$ 1.220,00. O registro textual tem aproximação/expoente misturados à alternativa E; recuperar o PDF antes da revisão editorial final. |
| CONAB 14 — nenhum dos dois eventos | `1 − (0,80 + 0,40 − 0,30) = 0,10`, ou 10%. |
| PF 41 — exatamente um sucesso entre quatro | `4 × 0,25 × 0,75³ = 0,421875`. |
| PF 42 — erro padrão | `√(0,25 × 0,75 ÷ 1.875) = 0,01`. |

Esses resultados servem para conferência, não são alterações publicadas nem validação de todos os detalhes das provas.

## Causas e riscos observados

1. **Conteúdo genérico é criado pelo gerador.** `scripts/questions-workflow/bb_builder.py` monta uma explicação com tópico e letra correta, sem solução matemática. Corrigir apenas no banco e reexecutar o builder pode restaurar o defeito.
2. **O mesmo problema não se limita ao BB.** `tjsp_builder.py` também monta comentário genérico. `conab_builder.py` contém as explicações incompatíveis dos itens 12 e 14. O prompt exige revisão e correção da geração, sem afirmar que todo comentário desses arquivos está errado.
3. **Há evidências de extração/classificação que precisam de revisão separada.** BB 31–35 estão classificados como sistemas de amortização, embora os enunciados consultados sejam conceituais de conhecimentos bancários/economia. BB 30 tem instrução matemática e rodapé misturados à alternativa E. Não acrescentar uma memória inventada para acomodar conteúdo/classificação defeituosos.
4. **Imagem não garante acessibilidade didática.** Foi inspecionado o PNG local de PF 42: ele contém a conta correta, mas usa `sqrt`, ponto decimal e símbolos sem explicar todas as operações. Não houve smoke autenticado nem verificação HTTP do asset nesta tarefa.
5. **Presença de fórmula ou título não prova qualidade.** CONAB 12 contém fórmula, mas ela não corresponde ao problema. O controle deve conferir a correspondência de dados, operação, solução e conclusão, não somente procurar palavras.

## Regra editorial requerida

Toda questão que exigir cálculo deve ter, anexada ao comentário, uma seção textual **Memória de cálculo — passo a passo**. Ela inclui objetivo, dados/unidades, conversões, regra/fórmula com símbolos definidos, substituição, operações intermediárias, resultado e interpretação. Preferir contas simples, sem saltos de raciocínio. Imagem pode complementar, mas o texto deve ser suficiente para aprender e resolver.

Questão estritamente conceitual recebe **Demonstração passo a passo**, quando necessária, sem cálculo numérico inventado. Dado essencial ausente, gráfico ilegível ou resultado que diverge da chave exige retenção da correção e investigação, sem modificar silenciosamente o original.

## Entrega e verificação

Entregues: este diagnóstico, evidências selecionadas, prompt autocontido para o Antigravity e reforço dos prompts de autoria/revisão e do fluxo futuro. JSON e Markdown foram validados, e os resultados numéricos acima foram recalculados com a biblioteca padrão Python. Não foram necessárias alterações de código, dependências, schema, build ou deploy. A correção dos comentários e a validação autenticada no site são tarefas do prompt de execução, ainda não realizadas nesta entrega.

Prompt: [PROMPT_CORRIGIR_MEMORIAS_CALCULO_2026-10-31.md](PROMPT_CORRIGIR_MEMORIAS_CALCULO_2026-10-31.md).
