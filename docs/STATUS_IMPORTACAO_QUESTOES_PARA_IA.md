# Relatório de Status Operacional e Handoff Técnico para IA

**Data de Geração:** 25/10/2026  
**Ambiente de Trabalho:** Windows | Shell: PowerShell  
**Repositórios / Workspaces:**
- **Worktree Principal do Projeto:** `C:\PRO\worktrees\questoes-importacao-20261024` (branch `feat/questoes-importacao-20261024`)
- **Repositório do Site:** `C:\PRO\site`
- **Diretório de Artefatos / Extração:** `C:\PRO\questoes`
- **Versão da Aplicação / Schema:** `pro-questions/v1`

---

## 1. Visão Geral e Estado do Sistema

O objetivo deste projeto é o saneamento integral, padronização editorial, classificação taxonômica, empacotamento canônico e validação pré-voo de **1.360 questões de concursos públicos extraídas de provas em PDF**, preparando-as para importação no banco de dados Supabase (PostgreSQL) do módulo de Questões do site.

### Reconciliação Contábil Absoluta (1.360 Questões)

| Categoria / Destinação | Quantidade | Percentual | Descrição Técnica |
| :--- | :---: | :---: | :--- |
| **Prontas para Importação (Lotes Validados)** | **1.187** | **87,28%** | 227 lotes técnicos canônicos `pro-questions/v1`, 100% auditados e validados por `questions-admin.mjs validate`. |
| **Já Publicadas em Produção** | **75** | **5,51%** | 19 lotes já ingeridos no banco de dados em etapas anteriores. |
| **Exclusões Permanentes** | **60** | **4,41%** | Consolidadas em `content/questions/pdf-import/excluded.json` (34 iniciais + 26 do Grupo D com legislação revogada). |
| **Anuladas pela Banca** | **38** | **2,80%** | Questões anuladas na origem pela banca examinadora, catalogadas sem gabarito forçado. |
| **TOTAL GERAL AUDITADO** | **1.360** | **100,00%** | **Reconciliação matemática fechada (zero itens flutuantes ou órfãos).** |

---

## 2. Mapa dos Lotes Empacotados e Validados (1.187 Questões em 227 Lotes)

Todas as 1.187 questões aptas estão estruturadas em arquivos JSON conformes ao schema Zod canônico (`pro-questions/v1`), organizadas em 4 fases modulares:

| Fase | Diretório dos Lotes | Qtd Lotes | Qtd Questões | Status Validação Zod | Descrição do Escopo |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Fase 1** | `scratch/candidate_batches/batches/` | 22 | 80 | 22/22 (100%) | Lotes originais pré-classificados com tópicos já existentes no catálogo inicial. |
| **Fase 2** | `scratch/extended_candidate_batches/batches/` | 76 | 403 | 76/76 (100%) | Questões de gabarito definitivo homologado e disciplinas padrão. |
| **Fase 3** | `scratch/fase3_candidate_batches/batches/` | 22 | 48 | 22/22 (100%) | Questões recuperadas de provas federais com gabarito alinhado. |
| **Fase 4** | `scratch/fase4_candidate_batches/batches/` | 107 | 656 | 107/107 (100%) | Questões saneadas cobertas pela Migration 037, incluindo Grupos E e F e 336 comentários novos. |
| **TOTAL** | — | **227** | **1.187** | **232/232 (100%)** | **Prontidão operacional imediata.** |

> [!NOTE]
> Cada lote técnico possui no máximo 10 questões, pertence a exatamente uma disciplina canônica primária, e cada questão referencia no mínimo um tópico primário válido, opções com rótulos `C`/`E` ou `A` a `E`, gabarito unívoco e comentário didático fundamentado.

---

## 3. Banco de Dados e Migration SQL 037

### Arquivo da Migração
- **Caminho Worktree:** `C:\PRO\worktrees\questoes-importacao-20261024\supabase\migrations\037_create_missing_disciplines_and_topics.sql`
- **Caminho Site:** `C:\PRO\site\supabase\migrations\037_create_missing_disciplines_and_topics.sql`

### Escopo e Garantias Estruturais
1. **16 Novas Disciplinas Canônicas:**
   - `administracao-geral`, `arquivologia`, `atualidades`, `auditoria-governamental`, `comercio-internacional`, `contabilidade-publica`, `direito-ambiental`, `direito-financeiro`, `direito-previdenciario`, `economia`, `estatistica`, `legislacao-aduaneira`, `legislacao-de-transito`, `legislacao-do-sus`, `politicas-publicas`, `raciocinio-logico-e-matematica`.
2. **100 Novos Tópicos Canônicos:**
   - Modelados para cobrir 100% das lacunas taxonômicas identificadas nas questões do acervo.
3. **Conformidade DDL e Idempotência:**
   - Todos os `INSERT` utilizam `ON CONFLICT (slug) DO NOTHING` (disciplinas) e `ON CONFLICT (topic_id) DO NOTHING` (tópicos).
   - Vínculos em `topic_discipline_relations` utilizam `ON CONFLICT (topic_id, discipline_id) DO NOTHING` com `is_primary = true`.
   - Slugs rigorosamente em conformidade com a restrição `slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`.
   - Nomes com extensão entre 1 e 120 caracteres.

---

## 4. Decisões Editoriais Executadas (Diretrizes do Usuário)

### Grupo D (26 Questões Excluídas)
- **Motivo:** Legislação revogada (ex.: antiga Lei 8.666/1993, Decretos superados de licitações, normas previdenciárias caducas).
- **Ação:** Registradas em `content/questions/pdf-import/excluded.json` com `reason: "conteudo_desatualizado_legislacao_revogada"`.
- **Saldo de Exclusões:** Arquivo passou de 34 para **60 itens excluídos**.

### Grupo E (25 Questões da PRF - Gabarito Não Definitivo com Ressalva)
- **Origem:** Prova Policial Rodoviário Federal (`caderno_origem: "001_03"`).
- **Ressalva Visual no Enunciado (`statement_markdown`):**
  ```markdown
  > [!WARNING] **Gabarito Não Definitivo (Caderno 3)**  
  > Esta questão possui gabarito baseado no caderno de prova original (Caderno 3) e fundamentação teórica revisada, pendente de homologação 1:1 com o gabarito oficial consolidado do Caderno 1.
  ```
- **Metadados Gravados (`source_metadata`):**
  `answer_status: "preliminar_com_ressalva"`, `gabarito_nao_definitivo: true`, `caderno_origem: "001_03"`, `visual_caveat_applied: true`.
- **Status:** Integradas e 100% validadas na Fase 4.

### Grupo F (5 Questões com Gabarito Alterado pela Banca)
- **Questões:** `pdf:agente_de_policia_federal:039`, `060`, `pdf:dpf14_009_01:003`, `015`, `113`.
- **Ressalva Visual no Enunciado (`statement_markdown`):**
  ```markdown
  > [!NOTE] **Gabarito Alterado pela Banca Examinadora**  
  > O gabarito preliminar desta questão foi alterado pela banca examinadora no gabarito oficial definitivo (de **Certo** para **Errado**). O comentário explicativo fundamenta a decisão final da banca.
  ```
- **Gabarito Definitivo:** `correct_option_label: "E"`, opção E marcada com `is_correct: true`.
- **Metadados Gravados (`source_metadata`):**
  `answer_status: "definitivo_alterado"`, `gabarito_alterado_pela_banca: true`, `original_preliminary_answer: "C"`, `definitive_answer: "E"`.
- **Status:** Integradas e 100% validadas na Fase 4.

### Redação de Comentários Didáticos (336 Questões)
- Todas as 336 questões válidas que não possuíam explicação receberam comentários estruturados com fundamentação teórica e links oficiais HTTPS (STF, STJ, Planalto, ALERJ, etc.).

---

## 5. Mídias e Imagens de Suporte

- **Origem:** `C:\PRO\questoes\output_pdf_comentarios\imagens/`
- **Destino Público:** `C:\PRO\worktrees\questoes-importacao-20261024\public\questions\calculations/`
- **Total Copiado:** 47 imagens PNG sanitizadas (metadados EXIF removidos).
- **Resolução de Links nos Comentários:** Mapeadas canonicamente para `/resumos/questions/calculations/<arquivo>.png`.

---

## 6. Inventário de Arquivos e Registros Chave

| Arquivo | Localização | Função |
| :--- | :--- | :--- |
| **Registro Mestre de Decisões** | `scratch/registro_decisoes_1251.json` | Auditoria linha a linha dos 1.251 itens com status final, lote atribuído e fase. |
| **Lista de Exclusões** | `content/questions/pdf-import/excluded.json` | 60 questões excluídas permanentemente com justificativa formal. |
| **Catálogo Consolidado Local** | `scratch/catalog-consolidated.local.json` | Snapshot das 47 disciplinas e 434 tópicos (banco + Migration 037). |
| **Script Validador Completo** | `scratch/validar_todos_os_lotes.py` | Executa o validador Zod em todos os 227 lotes das 4 fases. |
| **Script Empacotador Fase 4** | `scratch/package_fase4_candidate_batches.py` | Motor de empacotamento das 656 questões da Fase 4. |
| **Testes de Classificação** | `scratch/test_fase4_classification.py` | Suite de testes unitários da taxonomia da Fase 4. |
| **Testes da Migration 037** | `scratch/test_migration_037.py` | Valida sintaxe, DDL, constraints e integridade relacional do SQL 037. |

---

## 7. Runbook Operacional para Execução da Importação (Quando Solicitado)

> [!CAUTION]
> **REGRA CRÍTICA INVIOLÁVEL:** NENHUMA questão ou migração deve ser enviada para o banco de dados de produção sem autorização explícita e direta do USUÁRIO.

Quando o usuário autorizar formalmente a importação, a IA que assumir a operação deve seguir estritamente o roteiro abaixo:

### Passo 1: Aplicar a Migration 037 no Banco Supabase
```powershell
# Opção A: Via Supabase CLI (se configurado localmente)
npx supabase db push

# Opção B: Execução direta no banco via script ou console do Supabase
# Arquivo: supabase/migrations/037_create_missing_disciplines_and_topics.sql
```

### Passo 2: Executar Dry-Run dos 227 Lotes
Antes da ingestão efetiva, rodar importação em modo simulação (sem `--apply`):
```powershell
# Executa validação e simulação de importação para cada lote
node scripts/questions-admin.mjs import --file <caminho-do-lote>
```

### Passo 3: Executar a Importação Efetiva dos Lotes
Para cada pasta de lote (`scratch/candidate_batches/batches/`, `scratch/extended_candidate_batches/batches/`, `scratch/fase3_candidate_batches/batches/`, `scratch/fase4_candidate_batches/batches/`):
```powershell
# Para cada arquivo batch.json:
# 1. Ler o batch_key gerado
# 2. Executar:
node --env-file=C:\PRO\site\.env.local scripts\questions-admin.mjs import --file <caminho-do-lote> --apply --confirm <batch_key>
```
*(Recomenda-se criar um script orquestrador em Python que itere os 227 lotes, capture o `batch_key` do dry-run e execute a confirmação atômica com logging completo).*

### Passo 4: Verificação Pós-Ingestão
Após importar, verificar a integridade no banco com o subcomando `verify`:
```powershell
node --env-file=C:\PRO\site\.env.local scripts\questions-admin.mjs verify --file <caminho-do-lote>
```

---

## 8. Diretrizes de Engenharia e Vibecoding (Lembrete para a IA)
- **Clean Code Inegociável:** Código declarativo, DRY e modular.
- **Tolerância Zero a Remendos:** Sem gambiarras, fallbacks ocultos ou manipulação direta forçada de banco.
- **Rastreabilidade e Idempotência:** Toda operação deve ser reprodutível e registrar logs auditáveis.
