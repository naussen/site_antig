# Modelo de dados de questões

## Diagnóstico da fonte revisada

Fonte admitida: somente `*_ATUALIZADO.json`. O arquivo de Direito Administrativo possui 804 questões (679 `VALIDA` e 125 `ADAPTADA`). A auditoria encontrou 21 itens sem gabarito, quatro IDs numéricos duplicados, metadados deslocados em parte do acervo e variações de tópicos. O campo `id_alfanumerico` é único e passa a ser a identidade externa estável.

Arquivos `EXCLUIDAS` e relatórios não são fontes de publicação. O relatório é apenas referência de revisão.

## Contrato canônico `pro-questions/v1`

O lote possui identidade, hash SHA-256 da fonte, disciplina canônica e uma lista de questões. Cada questão contém:

- `external_id` estável (`qpygem:<disciplina>:<id_alfanumerico>`);
- hash do conteúdo transformado, tipo, enunciado e assunto;
- banca, órgão, cargo, ano e referência de origem;
- metadados de procedência e revisão;
- relações explícitas com tópicos por `topic_id` existente;
- alternativas ordenadas e gabarito por rótulo;
- comentário didático revisado.

O núcleo permanece relacional (`questions`, alternativas, gabarito, explicação, disciplinas e tópicos). `source_metadata` guarda apenas procedência variável. Lotes e itens importados formam a trilha de auditoria.

## Regras de processamento

1. O nome da fonte deve terminar em `_ATUALIZADO.json`.
2. A amostra aceita somente `status_revisao = VALIDA`.
3. Ano, banca, enunciado, gabarito e comentário são obrigatórios.
4. Cada tópico precisa de mapeamento explícito para um `topic_id`; não há aproximação automática.
5. O lote inteiro é validado antes da escrita e gravado por uma única transação PostgreSQL.
6. Repetição idêntica é idempotente; a mesma identidade com hash diferente é recusada.
7. Questões já respondidas nunca são sobrescritas silenciosamente.

## Comandos

```powershell
npm run questions:admin -- prepare --source <ATUALIZADO.json> --mapping <mapa.json> --output <lote.json> --ids id1,id2
npm run questions:admin -- validate --file <lote.json>
npm run questions:admin -- import --file <lote.json>
npm run questions:admin -- import --file <lote.json> --apply --confirm <batch_key>
```

O último comando exige `SUPABASE_SERVICE_ROLE_KEY` apenas no processo administrativo local. A credencial não entra no bundle nem no lote.
