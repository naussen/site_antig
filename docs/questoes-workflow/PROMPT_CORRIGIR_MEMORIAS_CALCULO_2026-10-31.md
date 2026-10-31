# Prompt para o Antigravity — cálculo explicado para iniciantes

Abra `C:\PRO\worktrees\questoes-memoria-calculo-20261031` no Antigravity e cole o bloco abaixo. Este arquivo contém instruções de execução futura; sua elaboração não alterou comentários do banco.

```text
Execute uma auditoria e correção dos comentários das questões com cálculos do PROQuestões, com foco em ensinar um usuário leigo.

Workspace desta entrega:
C:\PRO\worktrees\questoes-memoria-calculo-20261031

Leia primeiro:
- AGENTS.md aplicável;
- docs/questoes-workflow/AUDITORIA_AMOSTRAS_CALCULO_2026-10-31.md;
- docs/questoes-workflow/evidencias-memoria-calculo-20261031.json;
- docs/questoes-workflow/FLUXO.md;
- docs/questoes-workflow/prompts/04-comentarios.md;
- docs/questoes-workflow/prompts/05-revisao-independente.md;
- docs/REGRA_ELABORACAO_QUESTOES_PROQUESTOES.md.

REGRA OBRIGATÓRIA
Sempre que a resolução exigir cálculo, anexe ao comentário uma seção “Memória de cálculo — passo a passo”. O aluno deve conseguir acompanhar a solução sem conhecer previamente a fórmula ou a notação. A seção deve estar no próprio texto do comentário; imagem é complementar e não substitui a explicação textual.

ESCOPO E PRESERVAÇÃO
Faça diagnóstico atualizado e corrija somente as explicações que precisarem de reparo. Não reescreva comentários adequados sem necessidade. Preserve UUIDs, external_id, enunciados, alternativas, gabaritos, tentativas, estatísticas e preferências. Não exclua/reimporte questões para trocar comentários e não execute migrations antigas de importação novamente.

Alterações de classificação, contexto, enunciado, alternativa ou chave descobertas nesta auditoria devem ser registradas separadamente e bloqueiam a aprovação do item afetado até tratamento específico; não as disfarce como edição de comentário.

1. ATUALIZE O DIAGNÓSTICO
Confira Git e o catálogo/banco atuais. Não trate os números da amostra como atuais sem verificar. Trabalhe em branch própria; preserve mudanças locais e não promova para main nesta campanha.

Identifique itens que realmente exigem cálculo em Matemática, Matemática Financeira, Estatística, Raciocínio Lógico, Física, Química, Contabilidade, Economia e em outras disciplinas quando houver resolução quantitativa. Não dependa exclusivamente da disciplina cadastrada nem da presença de números no enunciado. Inclua itens com porcentagens, operações algébricas, probabilidades, tabelas, gráficos, conversões, taxas e demonstrações quantitativas.

Use IDs estáveis. “Questão 3” é posição na tela. A amostra compatível com os filtros Matemática Financeira/Cesgranrio/2021 corresponde à questão original BB 28:
external_id: exam:bb-2021-escriturario-agente-comercial:item:028
UUID: b460d264-06c4-40b2-8ca4-5af2bc5531a7

Priorize BB 2021 itens 16–20 e 26–30; CONAB 2014 itens 12 e 14; depois revise o restante do acervo quantitativo. Use PF 2018 itens 41/42 como comparação de comentários com fórmulas/imagens já existentes, sem presumir aprovação.

2. CLASSIFIQUE A QUALIDADE DE CADA ITEM
Registre: sem cálculo necessário; memória ausente; memória incompleta; memória existente apenas em imagem; comentário genérico; comentário incompatível com a questão; memória adequada; ou bloqueado por dado/chave/contexto. Categorias podem ser flags cumulativas, mas o estado final de cada questão deve ser único.

Não aprove só porque existe “memória de cálculo”, fórmula, arquivo PNG ou número no comentário. Verifique se os dados e a técnica correspondem ao problema. CONAB 12 exemplifica fórmula de contagem aplicada indevidamente a uma questão de lógica sem valores numéricos. CONAB 14 exige probabilidade de união/complemento, não acréscimo percentual.

3. REFAÇA A SOLUÇÃO
Leia a questão completa, alternativas e fonte. Recupere do PDF tabelas, gráficos, aproximações ou expoentes que tenham sido perdidos. Não invente dados, independência de eventos ou hipóteses para completar uma conta.

Resolva independentemente antes de confrontar o gabarito. Valide contas com Python, Decimal, frações ou outro cálculo determinístico apropriado. Registre unidades, precisão e arredondamento. Depois compare resultado e alternativa cadastrada. Divergência exige investigação e retenção; não altere o gabarito para fazer a conta passar.

Os itens BB 26–30 declaram gabarito sem status definitivo comprovado. Preserve as ressalvas e investigue a fonte oficial. Uma solução matemática correta não prova que o gabarito foi homologado. Não invente revisão humana ou status definitivo.

4. ESCREVA PARA UM INICIANTE
A memória deve conter, nesta ordem, adaptando a extensão à dificuldade:
- O que a questão quer descobrir, em uma frase simples.
- Dados do enunciado, com unidades e significado.
- Conversões necessárias, explicando o porquê: porcentagem para decimal, meses para anos, unidade de medida etc.
- Regra/fórmula usada e por que é adequada. Defina cada símbolo antes de usá-lo.
- Substituição dos símbolos pelos valores reais da questão.
- Operações intermediárias em sequência, com uma explicação curta por passo.
- Resultado com unidade, arredondamento e interpretação.
- Correspondência com a alternativa ou conclusão C/E e um erro comum relevante, quando ajudar.

Não basta escrever “aplicando a fórmula”, “substituindo os valores”, “efetuando os cálculos” ou “a alternativa é compatível com a teoria”. Mostre as operações omitidas. Não use jargão sem explicação, tabelas decorativas ou excesso de texto. Em operações simples, prefira a conta direta; em problemas de períodos, use linha do tempo ou tabela quando facilitar.

Exemplo de referência para BB 28:
Dados: boleto R$ 25.000,00; 12 dias; multa única de 2%; juros simples de 0,2% ao dia.
Passo 1: 2% = 2/100 = 0,02. Multa = 25.000 × 0,02 = R$ 500,00, cobrada uma vez.
Passo 2: 0,2% = 0,2/100 = 0,002. Juros = 25.000 × 0,002 × 12 = R$ 600,00.
Passo 3: total = 25.000 + 500 + 600 = R$ 26.100,00.
Conclusão: alternativa C cadastrada. Aqui os juros são simples; a multa não se repete a cada dia.

Para lógica ou item conceitual sem cálculo numérico, use “Demonstração passo a passo” e explique a dedução, os símbolos e as relações; não crie uma conta fictícia.

5. REVISE DE FORMA INDEPENDENTE
Use outra execução para conferir a fidelidade à questão, hipótese, fórmula, conversões, conta e resultado. Verifique também se um leigo consegue reproduzir os passos e entender o que o resultado significa. O autor não pode apenas se declarar revisor independente.

Se usar Vertex, reaproveite ADC/configuração do PYGEM sem expor credenciais. Não use API key/fallback de provedor. Registre modelo, execução, uso e checkpoints vinculados ao conteúdo. Testes automatizados não fazem chamadas pagas. Revisão de IA deve ser identificada como IA.

6. CORRIJA A ORIGEM E IMPEÇA REGRESSÃO
Investigue os builders e geradores em scripts/questions-workflow, especialmente bb_builder.py, conab_builder.py e tjsp_builder.py. Eles contêm os templates inadequados apontados nas amostras. Corrija a origem para que uma execução futura não restaure explicações vazias ou incompatíveis. Não troque um template vazio por outro com fórmula genérica.

Implemente controle editorial de publicação: cálculo identificado sem memória completa, ou comentário incompatível com os dados, deve reprovar a questão para revisão. Não use apenas regex ou presença de cabeçalho como prova de qualidade semântica. Inclua testes com comentário vazio, fórmula sem substituição, números alheios ao enunciado, conta errada, solução só em imagem, problema conceitual e memória completa correta.

7. PREPARE A CORREÇÃO AUDITÁVEL
Salve por ID o comentário original, seu hash, comentário proposto, motivo, resultado independente, revisões e eventuais bloqueios. Identifique o mecanismo seguro de atualização editorial existente; o importador idempotente não deve ser forçado a sobrescrever identidade existente com outro hash.

Antes de atualizar o banco, tenha backup verificável, relatório antes/depois, pré-condição de hash para evitar sobrescrever edição concorrente e caminho de reversão. A atualização deve atingir somente explicações aprovadas e seus metadados editoriais necessários, preservando o histórico de importação e os hashes históricos. Atenda à política editorial vigente sem fabricar responsáveis humanos; se ainda faltar decisão, apresente uma única aprovação consolidada após concluir toda a preparação.

8. CONFIRA A EXIBIÇÃO REAL
O leitor atual usa Markdown, remark-math e KaTeX. Preserve renderização segura, sem HTML ativo, eval, base64 ou caminhos locais. Use valores monetários brasileiros e escape o cifrão quando necessário ao parser. Imagens de apoio devem obedecer à allowlist existente; confirme arquivo, URL e legibilidade. Não acrescente um link de imagem que a interface rejeita.

Confira em desktop e celular, temas claro/escuro/sépia, tamanho das fórmulas, quebras, unidades e acesso à memória junto do comentário. Preserve a ocultação do gabarito/comentário até a ação prevista na interface. Após gravar, leia os comentários do banco e teste a página autenticada. Verificação de contagem ou build não prova que a memória apareceu corretamente.

ENTREGA
Relatório por disciplina e ID com itens examinados, mantidos, corrigidos e bloqueados; causas de geração; demonstrações numéricas independentes; dados preservados; testes; smoke autenticado; commit e push em branch própria. Diferencie proposta, atualização de banco, deploy e teste no site. Não encerre apenas com um plano quando a execução já estiver autorizada e os requisitos estiverem atendidos.
```
