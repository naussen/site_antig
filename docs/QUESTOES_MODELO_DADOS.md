# Modelo de dados de questões

## Diagnóstico da fonte revisada

Fonte admitida: somente `*_ATUALIZADO.json`. Na versão de 28/09/2026, o arquivo de Direito Administrativo possui 802 questões (607 `VALIDA` e 195 `ADAPTADA`). Para o lote de 100 questões, a auditoria encontrou 438 candidatas importáveis nos tópicos já mapeados, após excluir as 12 publicadas anteriormente, e rejeitou 94 candidatas estruturalmente incompletas. O campo `id_alfanumerico` é a identidade externa estável.

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
2. A publicação aceita somente `status_revisao = VALIDA`.
3. Ano, banca, enunciado, gabarito e comentário são obrigatórios.
4. Cada tópico precisa de mapeamento explícito para um `topic_id`; não há aproximação automática.
5. O lote inteiro é validado antes da escrita e gravado por uma única transação PostgreSQL.
6. Repetição idêntica é idempotente; a mesma identidade com hash diferente é recusada.
7. Questões já respondidas nunca são sobrescritas silenciosamente.

## Comandos

```powershell
npm run questions:admin -- prepare --source <ATUALIZADO.json> --mapping <mapa.json> --output <lote.json> --ids id1,id2
npm run questions:admin -- prepare --source <ATUALIZADO.json> --mapping <mapa.json> --output <lote.json> --limit 100 --balanced --exclude-file <lote-anterior.json>
npm run questions:admin -- validate --file <lote.json>
npm run questions:admin -- import --file <lote.json>
npm run questions:admin -- import --file <lote.json> --apply --confirm <batch_key>
npm run questions:admin -- verify --file <lote.json>
```

Os comandos `import --apply` e `verify` exigem `SUPABASE_SERVICE_ROLE_KEY` apenas no processo administrativo local. A credencial não entra no bundle nem no lote. A seleção com `--balanced` percorre os tópicos mapeados em rodadas, enquanto `--exclude-file` impede a repetição de IDs de um lote anterior.
