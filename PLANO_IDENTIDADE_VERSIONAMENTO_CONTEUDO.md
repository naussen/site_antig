# Plano de identidade e versionamento de conteúdo

## Objetivo

Permitir revisões editoriais sem romper notas, progresso e destaques dos usuários, preservando histórico e bloqueando substituições destrutivas sem um mapeamento explícito.

## Plano de execução

- [x] Definir `content_unit_id UUID` permanente e independente da posição editorial.
- [x] Definir `stable_key` semântico, único por tópico e imutável após criação.
- [x] Migrar o schema e preencher identidades para todas as seções existentes.
- [x] Mover notas, progresso e destaques para referência canônica por UUID.
- [x] Substituir exclusão física por arquivamento lógico auditável.
- [x] Registrar revisões imutáveis a cada mudança de conteúdo.
- [x] Classificar destaques como válidos, migrados, pendentes ou órfãos após uma revisão.
- [x] Exigir manifesto para remoções, divisões, fusões e remapeamentos.
- [x] Exibir no `dry-run` o impacto pessoal antes de qualquer escrita.
- [x] Validar a migration por dry-run e aplicação no Supabase remoto.
- [x] Executar testes de conteúdo, autenticação, destaques, lint, tipos e build.
- [x] Criar commit atômico e publicar em `main`.

## Contrato editorial

- `section_id` permanece temporariamente como identificador legado e de rota.
- `content_unit_id` é a identidade canônica e nunca deve ser reutilizada para outro conteúdo.
- `stable_key` descreve semanticamente a unidade dentro do tópico; mudança de título não implica troca automática da chave.
- correção textual preserva o UUID e cria nova revisão;
- remoção arquiva a unidade, sem apagar referências pessoais;
- divisão, fusão ou substituição exige manifesto com origem, destino e estratégia para dados pessoais;
- destaque que não puder ser reancorado permanece consultável como órfão, nunca é descartado silenciosamente.

## Sequência de implantação

1. Aplicar migration aditiva e fazer o backfill das identidades.
2. Publicar código com leitura e escrita por UUID e fallback legado controlado.
3. Ativar versionamento, arquivamento e validação de manifesto.
4. Executar auditorias negativas contra exclusão física e substituição sem manifesto.
5. Remover o fallback por `section_id` somente após confirmar que não restam referências legadas.

## Critérios de aceite

- nenhuma referência pessoal usa `ON DELETE CASCADE` contra uma seção editorial;
- renomear ou reordenar uma seção não muda seu UUID;
- uma atualização preserva a revisão anterior;
- uma seção arquivada desaparece do catálogo, mas seus dados pessoais continuam acessíveis;
- substituição destrutiva sem manifesto falha antes da primeira escrita;
- manifesto incompleto ou inconsistente também é rejeitado;
- migration, testes e build passam antes do push.

## Riscos controlados

- Compatibilidade: `section_id` será mantido durante a transição.
- Concorrência: versionamento e arquivamento serão executados no banco, de forma transacional.
- Orfandade: destaques recebem estado explícito e contexto da revisão de origem.
- Rollback: a mudança é aditiva; conteúdo e referências antigas não serão excluídos.
