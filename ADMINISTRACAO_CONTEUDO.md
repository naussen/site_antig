# Administração de conteúdo por linha de comando

O site possui uma CLI administrativa para importar, consultar, renomear, exportar e excluir conteúdo sem interface visual. Ela acessa o Supabase com a credencial de serviço somente no processo local e nunca imprime a chave.

## Pré-requisitos

- Execute os comandos na raiz de `C:\site_antig`.
- Mantenha `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` ou no ambiente do processo.
- Não versione nem compartilhe `.env.local` ou chaves de serviço.
- Faça um backup com `export` antes de uma alteração destrutiva.

O nome físico do arquivo JSON não é armazenado no banco. No site, um “módulo” é um registro em `topics`:

- `topic_id`: identificador técnico estável e parte da URL;
- `topic_title`: título exibido do módulo;
- `discipline`: disciplina usada para agrupar módulos;
- `section_id`: identificador técnico estável de uma seção.

A CLI renomeia títulos e disciplinas, mas deliberadamente não altera IDs técnicos.

## Ajuda e consulta

```powershell
npm run content -- help
npm run content -- list
npm run content -- list --discipline "Direito Tributário"
npm run content -- inspect direito-tributario
```

Use `--json` em `list` ou `inspect` quando quiser saída processável por outro programa.

## Importar ou atualizar um JSON

Primeiro, valide e visualize o impacto sem escrever:

```powershell
npm run content -- import .\meu-conteudo.json
```

Depois, aplique:

```powershell
npm run content -- import .\meu-conteudo.json --apply
```

O modo padrão faz **upsert**: cria ou atualiza o módulo e as seções presentes no arquivo, preservando seções antigas que não estejam no JSON. A CLI bloqueia a importação se um `section_id` já pertencer a outro módulo.

Para sincronizar exatamente com o arquivo e excluir seções antigas ausentes, use `--replace`. Como essa opção pode apagar notas e progresso ligados às seções removidas, ela exige confirmação literal:

```powershell
npm run content -- import .\meu-conteudo.json --replace --apply --confirm direito-tributario
```

## Importar uma pasta em lote

O comando `import-batch` lê somente arquivos `.json` diretamente da pasta informada, em ordem determinística. Antes de qualquer escrita, ele valida todos os arquivos, detecta IDs repetidos dentro do lote e verifica no Supabase se alguma seção já pertence a outro módulo. O lote usa apenas **upsert** e não exclui seções ausentes.

Faça obrigatoriamente a simulação/preflight explícita:

```powershell
npm.cmd run content -- import-batch `
  C:\Divisor\output\direito-tributario-dividido\modules `
  --dry-run
```

Somente depois de revisar integralmente a lista de módulos, a quantidade de seções e eventuais avisos, execute a importação efetiva:

```powershell
npm.cmd run content -- import-batch `
  C:\Divisor\output\direito-tributario-dividido\modules `
  --apply
```

Os modos são mutuamente exclusivos: o comando exige exatamente um entre `--dry-run` e `--apply`. O modo `--apply` repete todo o preflight na mesma execução e só então inicia as escritas. Se houver falha de rede durante a etapa efetiva, consulte o último arquivo informado no progresso e repita o comando; os upserts são idempotentes.

## Exportar backup

```powershell
npm run content -- export direito-tributario .\backups\direito-tributario.json
```

Por segurança, a ferramenta não sobrescreve um arquivo existente. Use `--force` somente quando a substituição for intencional.

## Renomear conteúdo exibido

Todos os comandos de escrita fazem somente uma pré-visualização sem `--apply`:

```powershell
npm run content -- rename-topic direito-tributario "Sistema Tributário Nacional"
npm run content -- rename-topic direito-tributario "Sistema Tributário Nacional" --apply

npm run content -- rename-section direito-tributario-sec-01 "Conceitos iniciais" --apply

npm run content -- rename-discipline "Direito Tributario" "Direito Tributário"
npm run content -- rename-discipline "Direito Tributario" "Direito Tributário" --apply
```

Renomear uma disciplina atualiza todos os módulos cujo nome da disciplina seja exatamente igual ao valor informado.

## Excluir conteúdo

Faça primeiro o backup e a pré-visualização:

```powershell
npm run content -- export direito-tributario .\backups\direito-tributario.json
npm run content -- delete-topic direito-tributario
```

Para confirmar a exclusão:

```powershell
npm run content -- delete-topic direito-tributario --apply --confirm direito-tributario
npm run content -- delete-section direito-tributario-sec-01 --apply --confirm direito-tributario-sec-01
```

O banco usa exclusão em cascata. Excluir um módulo remove suas seções; excluir uma seção remove também as notas e o progresso dos usuários vinculados a ela. O backup de conteúdo não contém notas nem progresso pessoais.

## Limitações e cuidados

- Não há renomeação de `topic_id` ou `section_id`; isso exigiria uma migração transacional específica para preservar todas as referências.
- A importação segue a semântica atual do site e não é uma transação SQL única entre módulo e seções. Em uma falha de rede intermediária, revise com `inspect` e repita o mesmo arquivo; os upserts são idempotentes.
- A CLI valida a estrutura do JSON, mas a validação semântica completa de Mermaid deve ser feita no pipeline gerador antes da importação.
- Para automação em lote, execute primeiro com `--dry-run`, registre e revise a saída e só então execute novamente com `--apply`.
