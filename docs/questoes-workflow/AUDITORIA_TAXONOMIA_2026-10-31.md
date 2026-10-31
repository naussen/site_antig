# Auditoria de classificação das questões — 31/10/2026

## Escopo e evidências

Consulta editorial **somente de leitura**, iniciada em 31/10/2026 às **15h18 de Brasília**. Snapshot: 1.806 questões, sendo **1.771 publicadas e 35 arquivadas**; 56 disciplinas e 547 tópicos cadastrados, dos quais 543 não arquivados. Código conferido contra `origin/main` em `89756c7`, além de consulta às colunas efetivas do banco.

Executados um censo estrutural das 1.771 publicadas e a leitura temática dirigida de **61 questões em nove disciplinas cadastradas**: todas de Estatística (10), Tributário (2), Civil (10), Contabilidade Geral e Avançada (23), as dez de Matemática/Vunesp/2021 e seis amostras adicionais. Não foi amostra aleatória nem auditoria semântica integral do acervo.

**Nenhuma classificação, comentário, questão, schema ou interface foi alterada. Nenhuma chamada ao Vertex foi executada.** A implementação é tarefa do Antigravity, conforme o [prompt de execução](PROMPT_AUDITORIA_CORRECAO_TAXONOMIA_2026-10-31.md).

As [evidências JSON](evidencias-taxonomia-20261031.json) contêm os 61 IDs, enunciados, alternativas, relações atuais, propostas temáticas, contagens por disciplina e colunas do schema. Proposta temática não é patch aplicável nem validação da resposta jurídica/contábil.

## Os dois exemplos do usuário

“Questão 1/3” é posição da tela: `questions-client.tsx` usa `position={pageStart + index + 1}`; a consulta ordena por `created_at DESC, id DESC`. As associações abaixo assumem Matemática + Vunesp + 2021, sem ocultações pessoais ou filtros adicionais.

| Posição | Identidade estável | Conhecimento cobrado | Cadastrado | Destino temático proposto |
| --- | --- | --- | --- | --- |
| **1** | `exam:tjsp-2021-escrevente-tecnico:item:080`; UUID `f1f4f2a0-ac7b-4d2c-a6d1-934c9c325557` | Atributos de pasta nas Propriedades do Windows 10. | Matemática → Geometria Plana e Espacial. | **Informática → Sistemas Operacionais → Windows 10: atributos de pastas.** |
| **3** | `exam:tjsp-2021-escrevente-tecnico:item:078`; UUID `ca8262e3-c5a5-4d96-8170-411631bd099c` | Criação de atalho de programa no Windows 10. | Matemática → Geometria Plana e Espacial. | **Informática → Sistemas Operacionais → Windows 10: criação de atalhos.** |

O catálogo já tem `sistemas-operacionais-windows-e-linux`; os subtópicos ainda precisam de representação hierárquica. Não é necessário inventar outra disciplina ou criar resumo vazio. Não foram resolvidas as alternativas nem homologados os gabaritos preliminares.

## Poucos tópicos no filtro: três situações diferentes

O SQL de `list_question_filters`, migration 038, retorna tópicos usados em questões publicadas. A interface filtra essa resposta por disciplina. Portanto, **catálogo disponível**, **vínculos usados** e **opções exibidas** não são a mesma coisa.

| Disciplina | Publicadas | Tópicos ativos no catálogo vinculado | Tópicos primários usados |
| --- | ---: | ---: | --- |
| Estatística | 10 | 4 | **1**: Estatística, nas dez questões. |
| Direito Tributário | 2 | 21 | **2**, com uma questão em cada. |
| Direito Civil | 10 | 12 | **3**: Dos Bens (8), Pessoas Jurídicas (1), Responsabilidade Civil (1). |
| Contabilidade Geral e Avançada | 23 | 32 | **3**: Ativo (17), Balancete (3), Conceitos Básicos (3). |
| Matemática | 71 | 4 | 4, incluindo 39 no tópico genérico Matemática. |

Duas questões tributárias não precisam ocupar 21 tópicos; é necessário conferir também se questões tributárias estão em outras disciplinas. Não fabricar relações ou questões para aumentar o filtro. Por outro lado, a concentração em Civil e Contabilidade esconde erros concretos de distribuição.

Estatística já possui `probabilidade-e-distribuicoes`, `amostragem-e-inferencia-estatistica` e `estatistica-descritiva`, além do genérico. As dez questões não usam esses tópicos específicos. Correlação/Regressão é uma lacuna de tópico observada entre os conteúdos cobrados.

## Amostra ampliada: erros, refinamentos e controles positivos

Os números seguintes são os originais das provas, não posições da tela. O JSON registra a proposta individual para cada uma das 61 questões.

| Itens | Encontrado | Encaminhamento proposto |
| --- | --- | --- |
| TJSP 77–80 | Área de Transferência, atalhos, criação/atributos de pastas, em Matemática/Geometria. | Informática: Office no 77 e Sistemas Operacionais nos 78–80. |
| TJSP 72 | Sistema de equações, em Aritmética e Álgebra. | Tópico amplo compatível; detalhar o subtópico. |
| TJSP 74/76 | Razões, média e comparação por gráficos; 76 em Geometria. | Matemática/proporcionalidade/gráficos, com convenção clara de fronteira com Estatística. Conferir a mídia antes do aceite completo. |
| TJSP 75 | Área composta, em Aritmética e Álgebra. | Geometria plana/áreas; não esconder a extração incompleta da fórmula. |
| TJSP 73 | Juros simples diários, em Aritmética e Álgebra. | Harmonizar Matemática/Financeira no acervo; não transformar toda diferença de convenção em erro inequívoco de disciplina. |
| Estatística PF 41–44 | Binomial, erro padrão, intervalo de confiança e máxima verossimilhança, todos no genérico. | Probabilidade/Distribuições ou Amostragem/Inferência, conforme cada assertiva. |
| Estatística PF 45–47 | Pearson, variância residual/ANOVA e coeficiente angular. | Propor Correlação e Regressão e subtópicos específicos. |
| Estatística PF 48–50 | Soma de normais, simetria/probabilidade e padronização. | Probabilidade e Distribuições → subtópicos da normal. |
| Tributário, Analista Administrativo 85 | Lançamento, já em Crédito Tributário e Lançamento. | Controle positivo: preservar tópico e detalhar instituto. |
| Tributário 86 | Processo administrativo fiscal, em Conceitos Fundamentais. | Processo Administrativo Fiscal → princípios; verificar conteúdo já existente antes de criar o conceito faltante. |
| Civil, FCC `prova_i09_tipo_001` 41/42/45 | Capacidade, ausência e domicílio em Dos Bens. | Pessoas Naturais → respectivos institutos. |
| Civil 44 | Fundação e patrimônio insuficiente em Dos Bens. | Pessoas Jurídicas → Fundações; a palavra “bens” não define a matéria cobrada. |
| Civil 47–49 | Proposta/retratação, vícios redibitórios e evicção em Dos Bens. | Contratos em Geral → instituto cobrado. |
| Civil 50 | Contrato aleatório em Responsabilidade Civil. | Contratos em Geral → Aleatórios; aparecer “culpa” não determina o tópico. |
| Civil 43/46 | Pessoas jurídicas e classificação dos bens nos tópicos amplos correspondentes. | Controles positivos: preservar tópico, acrescentar subtópico. |
| Contabilidade PF 101/102/106 | Fatos e fórmulas de lançamento em Ativo. | Escrituração/Fatos Contábeis; propor conceitos que faltarem. |
| Contabilidade 107/108 | Competência e adiantamento de clientes em Ativo. | Princípios/regimes e Passivo, conforme contexto da assertiva. |
| Contabilidade 109/110/111 | Resultado com mercadorias, duplicatas e depreciação em Ativo. | Reutilizar Operações com Mercadorias, Operações com Duplicatas e CPC 27/Imobilizado, já existentes. |
| Contabilidade 116 | Lucro bruto em Ativo. | Demonstrações/Resultado, com subtópico adequado; não classificar pela primeira conta da tabela. |
| Contabilidade 112–114/115 | Balancete e total do ativo nos tópicos amplos correspondentes. | Controles positivos para manutenção com refinamento. |
| Contabilidade 119/120 | Características qualitativas com preâmbulo NBC TSP, em Ativo. | **Reter enquadramento normativo:** conferir PDF e fronteira com Contabilidade Pública; não converter automaticamente em CPC 00. |
| BB 31/32/35 | SFN, fuga de capitais e renda fixa em Financeira/Amortização. | Bancários/Economia, com adjudicação da fronteira e tópicos específicos. |
| BB 46 | Escala ordinal e tendência central em Informática/Office. | Estatística → Descritiva → escalas e medidas. |
| TJSP 65/85 | Viagem do Papa em Direito da Pessoa com Deficiência; Excel em Raciocínio Lógico. | Atualidades e Informática, respectivamente. |

Há **dez casos dirigidos de disciplina incompatível**: TJSP 77–80/65/85 e BB 31/32/35/46. Não extrapolar a contagem para a população. As outras propostas incluem manutenção, refinamento, tópicos errados e ambiguidades; não são 61 questões declaradas inteiramente erradas.

Não houve auditoria da correção das respostas. Para eventual aplicação, conferir o referencial e a data da prova. No exemplo de depreciação, o [CPC 27 oficial](https://www.cpc.org.br/CPC/Documentos-Emitidos/Pronunciamentos/Pronunciamento?Id=58) confirma o referencial temático de Imobilizado; isso não valida a assertiva ou a conta de cada item.

## Causas técnicas e modelo atual

1. `tjsp_builder.py` atribui 71–80 a Matemática e 76–80 a Geometria por faixa numérica, embora 77–80 sejam Informática. Também atribui 65–70 ao Estatuto da Pessoa com Deficiência e 81–86 a Lógica. Isso explica os exemplos, sem comprovar o conteúdo de toda faixa.
2. `prepare-pdf-questions.py` associa `estatistica` ao tópico `estatistica` em `FIXED_TOPICS`, com retorno anterior à busca específica. Há associações genéricas também para Matemática/Financeira. É uma causa compatível com a concentração; não reconstitui sozinha todo o histórico de importação.
3. O censo das publicadas não encontrou falta de uma disciplina primária, falta de um tópico primário ou par tópico–disciplina ausente do catálogo. **Zero violações desses invariantes não prova classificação semanticamente correta.**
4. As colunas efetivas de `topics` não incluem pai/nível; `question_topic_relations` não traz nível hierárquico. Não foram encontradas tabelas públicas com nomes contendo `taxonom`, `concept` ou `subtopic`. Código e tipos consultados não revelaram modelo hierárquico alternativo implementado. `subtopic_key` em manifesto não equivale a subtópico persistido/filtrável.
5. IDs legados não são rótulos: `comeco-da-personalidade-juridica` tem título Das Pessoas Jurídicas; `classificacao-doutrinaria`, Dos Bens. Não classificar por tokens do slug nem renomear IDs/rotas para corrigir questões.
6. `topics` também organiza Resumos. Criar conceito de Questões não autoriza criar resumo vazio, deslocar capítulos ou inventar relações com LEGIS. A solução deve ter registro canônico e adaptação compatível, sem taxonomias concorrentes por módulo.

## Cabeçalho

No código consultado, o topo de `QuestionCard` mostra posição, disciplinas e banca/ano. `question.topics` aparece **depois do enunciado**; `QuestionListTopic` não contém caminho pai/subtópico. Mover o rótulo atual para cima não corrige o cadastro nem cria a hierarquia.

O prompt exige caminho visível **antes do texto-base e do enunciado**, por exemplo:

> **Informática › Sistemas Operacionais › Windows 10: atributos de pastas**

Manter posição e banca/ano; distinguir relacionados do caminho principal; usar rótulos canônicos, quebra de linha no celular e contraste nos três temas, sem depender de hover. Conceito sem conteúdo de Resumos não recebe link fictício. Pendente não pode parecer classificação aprovada.

Não houve smoke autenticado da interface nesta tarefa. O diagnóstico de posicionamento é do código; o Antigravity deve verificar o bundle publicado e testar a alteração visual.

## Cobertura e amostragem

Recomendação: **censo semântico de 100% das publicadas de todas as disciplinas**, incluindo busca de itens ocultos sob disciplina errada. Não limitar às quatro disciplinas reclamadas nem aos geradores TJSP/BB.

Amostra adicional não garante correção de cada unidade. Um controle possível é sorteio simples sem reposição de `min(N,459)`, com zero falhas materiais, mais censo dos grupos de risco e cobertura complementar por disciplina. Sob modelo binomial e detecção confiável, `1 − 0,01^(1/459) ≈ 0,9983%` é limite superior unilateral a 99% de confiança. O [NIST documenta os limites exatos unilaterais](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm). Isso não certifica cada disciplina nem elimina erros do revisor.

Definir falha como erro em qualquer nível relevante do caminho. Não usar as 61 amostras dirigidas nesse cálculo nem misturar complementos dirigidos ao sorteio. Falha material exige expansão integral do grupo; não repetir sorteios até obter zero. Censo incompleto continua parcial.

## Entrega e verificações

Arquivos desta entrega: este relatório, `evidencias-taxonomia-20261031.json`, `PROMPT_AUDITORIA_CORRECAO_TAXONOMIA_2026-10-31.md`, `prompts/03-taxonomia.md` e `CHANGELOG.md`. Conferidos documentos, contagens, IDs e vínculos. Sem mudança da aplicação: lint/build não se aplicam a esta entrega documental; serão necessários na implementação.

Riscos remanescentes: restante do acervo sem auditoria semântica, propostas não adjudicadas, ausência de hierarquia efetiva, concorrência com revisão de comentários e deploy não verificado. Próximo passo: executar o prompt **no Antigravity**, com snapshot atualizado e preservação dos dados existentes.
