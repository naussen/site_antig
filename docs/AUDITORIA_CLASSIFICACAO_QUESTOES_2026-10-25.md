# Auditoria de classificação — PRO Questões (25/10/2026)

## Escopo e achados

- Inventário consultado em produção: 1.349 questões publicadas, cada uma com uma relação de disciplina e tópico no recorte exportado.
- 29 questões estavam em **Estatística** na disciplina combinada de Raciocínio Lógico/Matemática. A leitura dos enunciados identificou 19 de lógica, aritmética, conjuntos ou modelagem matemática; as outras 10 tratam de probabilidade, inferência, regressão ou distribuição estatística.
- 146 questões de PDF estavam em **Português > Outros Tópicos**. O registro de origem indica 71 de áreas distintas: 30 com assunto “A classificar”, 36 de “Conhecimentos Específicos” e 5 de “Legislação”. A atribuição automática a Português estava incorreta.

## Tratamento

O registro por ID em [`content/questions/taxonomy-review-20261025.json`](../content/questions/taxonomy-review-20261025.json) sustenta a migration 039:

- **47 relações corrigidas:** 19 da disciplina combinada; 7 para Direito Ambiental; 14 para Administração Geral ou Direito Administrativo; 2 questões de legislação administrativa; 5 de Português com assunto específico na origem. `subject`, disciplina primária e tópico primário passam a concordar.
- **48 questões arquivadas para revisão:** 23 ambientais sem tópico exato, 3 de LGPD sem tópico, 3 de legislação específica e 19 de Enfermagem sem disciplina ativa. Os enunciados, gabaritos, comentários, imagens, histórico de tentativas e a data original de publicação permanecem preservados.
- **70 questões** permanecem em Português > Outros Tópicos por terem disciplina de origem compatível, mas exigirem revisão mais fina para um tópico específico. Não foram reclassificadas por inferência fraca.

A migration 039 verifica os 95 estados anteriores, os alvos ativos e o resultado final na mesma execução. O arquivo original de extração e os lotes importados são preservados como evidência histórica; a correção editorial é registrada de forma explícita no banco. A importação administrativa não deve sobrescrever questões já existentes.

## Banco e dependências

- As migrations 037 e 038 foram reaplicadas de forma idempotente por `supabase db push`; ambas constam no histórico remoto. A 037 criou os 67 tópicos previstos que ainda faltavam. A 038 manteve as funções e o índice já presentes.
- A biblioteca de resumos consultava também tópicos ativos sem seções (175 após a 037). A listagem foi ajustada para mostrar somente tópicos com conteúdo, sem retirar os tópicos do catálogo usado pelas questões.
- A atualização de Next.js, DOMPurify, Zod e KaTeX é independente da correção editorial. O `overrides.katex` força a versão corrigida também nas dependências de Mermaid e da renderização matemática.
- Lint, tipos, 198 testes, build webpack e `npm audit --omit=dev` passaram. O deploy Netlify de `3a3f95a` foi publicado; a página autenticada de Macroeconomia mostrou mapas navegáveis e fórmulas sem erro no console.

## Validação realizada e pendências

A migration 039 consta no histórico remoto. O banco confirmou 1.301 questões publicadas, 48 arquivadas e 70 itens ainda em Português > Outros Tópicos. Os 47 vínculos e os 48 estados finais foram conferidos dentro da própria migration. No site autenticado, a questão de sequência de letras passou a apontar para Raciocínio Lógico; a conta de teste vê 1.299 itens porque ocultou dois. Antes de republicar qualquer item retido, definir disciplina e tópico ativos com revisão do enunciado e do comentário.
