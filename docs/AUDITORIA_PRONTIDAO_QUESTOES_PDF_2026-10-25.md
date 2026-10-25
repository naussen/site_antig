# Auditoria de Prontidão das Questões de PDF (Preflight Concluído)

**Data de Conclusão:** 25/10/2026  
**Referência:** `docs/PLANO_PRONTIDAO_QUESTOES_PDF_2026-10-25.md`  
**Escopo:** Preflight e auditoria rigorosa de prontidão do acervo de 1.360 questões.  
**Veredito:** **PREFLIGHT 100% APROVADO**. Acervo pronto para importação condicionada à autorização expressa do usuário. Nenhuma migration foi aplicada ao banco de produção nem nenhum lote foi importado durante esta etapa.

---

## 1. Reconciliação Contábil Absoluta do Universo (1.360 Questões)

Todas as 1.360 questões extraídas de provas em PDF foram auditadas, classificadas individualmente por `external_id` e particionadas em conjuntos disjuntos e exaustivos:

| Categoria / Destinação | Quantidade | Percentual | Descrição Técnica e Fundamentação |
| :--- | :---: | :---: | :--- |
| **Prontas para Importação (`pro-questions/v1`)** | **1.162** | **85,44%** | 223 lotes canônicos nas 4 Fases, 100% aprovados pelo validador oficial Zod (`questions-admin.mjs validate`). Gabarito 100% definitivo comprovado documentalmente. |
| **Já Publicadas em Produção** | **75** | **5,51%** | 19 lotes já ingeridos no banco de dados Supabase em etapa anterior. |
| **Retidas Fundamentadas** | **63** | **4,63%** | **38 anuladas** formalmente pela banca examinadora + **25 itens da PRF** (Caderno 3 sem pareamento seguro 1:1 com Caderno 1). |
| **Exclusões Permanentes** | **60** | **4,41%** | Registradas em `content/questions/pdf-import/excluded.json` (34 originais + 26 do Grupo D com legislação revogada). |
| **TOTAL GERAL AUDITADO** | **1.360** | **100,00%** | **Reconciliação matemática exata: 75 + 1.162 + 63 + 60 = 1.360.** |

---

## 2. Mapa dos 223 Lotes Prontos (1.162 Questões)

| Fase | Diretório dos Lotes | Lotes | Questões | Status `answer_status` | Status Validação Zod |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Fase 1** | `scratch/candidate_batches/batches/` | 22 | 80 | 80 definitivo | **22/22 (100% Válido)** |
| **Fase 2** | `scratch/extended_candidate_batches/batches/` | 76 | 403 | 403 definitivo | **76/76 (100% Válido)** |
| **Fase 3** | `scratch/fase3_candidate_batches/batches/` | 21 | 47 | 46 definitivo, 1 alterado | **21/21 (100% Válido)** |
| **Fase 4** | `scratch/fase4_candidate_batches/batches/` | 104 | 632 | 628 definitivo, 4 alterado | **104/104 (100% Válido)** |
| **TOTAL** | — | **223** | **1.162** | **1.157 def., 5 alt., 0 prelim.** | **223/223 (100% Aprovado)** |

### Distribuição Estrita de `answer_status`:
* `definitivo`: **1.157 questões** (100% respaldadas por URLs/espelhos oficiais e números de item das bancas).
* `definitivo_alterado`: **5 questões** (todas retificadas de Certo para **Errado (E)** com callout visual e fundamentação da banca).
* `preliminar`: **0** (eliminação completa).
* `preliminar_com_ressalva`: **0** (eliminação completa; os 25 itens da PRF foram honestamente retidos).
* `ausente / None`: **0** (eliminação completa).

---

## 3. Resolução das Divergências Apontadas no Plano

### A. Divergência dos 25 vs 24 itens da PRF
* **Causa Raiz Identificada:** 24 itens estavam na pasta da Fase 4 e o 25º (`pdf:policial_rodoviario_federal:099`) havia sido empacotado isoladamente na Fase 3.
* **Resolução Editorial Conforme Gate B:** Todos os 25 itens da PRF pertencem ao Caderno 001_03 e foram classificados pelo motor de reconciliação como `blocked_unmatched` (similaridade textual < 0.90 em relação ao gabarito consolidado do Caderno 001_01). Em estrito cumprimento ao princípio da verdade real (onde ressalva visual não substitui comprovação de gabarito), os **25 itens foram retirados dos lotes prontos e mantidos como `retida`** com motivo explícito `gabarito_preliminar_caderno3_pendente_homologacao_caderno1`.
* O lote unifásico que continha apenas a PRF 099 foi devidamente removido da Fase 3.

### B. Divergência dos 5 vs 4 itens com Gabarito Alterado
* **Causa Raiz Identificada:** 4 itens estavam na Fase 4 e o 5º (`pdf:dpf14_009_01:015`) estava na Fase 3 com metadados desatualizados.
* **Resolução Aplicada:** `pdf:dpf14_009_01:015` foi atualizado no lote da Fase 3 com:
  * `statement_markdown`: prepend do callout `> [!NOTE] **Gabarito Alterado pela Banca Examinadora**...`
  * `correct_option_label = "E"`
  * Opções ajustadas (`is_correct = true` para E).
  * `answer_status = "definitivo_alterado"`.
* Total de itens alterados perfeitamente sincronizados: **exatamente 5 questões**.

### C. Promoção das 248 Questões Não Definitivas
* As 248 questões (de PF 2018, DPF 2014, TCU 2015, MPRJ 2019 e BB 2023) tiveram seus gabaritos definitivos conferidos contra os documentos oficiais `reconciliacao_gabaritos.json`, `reconciliacao_mprj.json` e `reconciliacao_escriturario.json`.
* Todas receberam `answer_status: "definitivo"`, URL oficial/espelho da banca e número de item correspondente.

---

## 4. Revisão e Saneamento da Migration SQL 037

O arquivo `supabase/migrations/037_create_missing_disciplines_and_topics.sql` foi rigorosamente ajustado:
1. **Aditividade Pura:** Substituição de todos os `ON CONFLICT DO UPDATE` por `ON CONFLICT (slug) DO NOTHING;` e `ON CONFLICT (topic_id) DO NOTHING;`.
2. **Preservação dos Tópicos Existentes:** Remoção das linhas que tentavam reinserir `direitos-e-garantias-fundamentais` e `funcoes-essenciais-a-justica`. Seus títulos originais (`Dos direitos e garantias fundamentais` e `Das funções essenciais à Justiça`), vinculações e metadados no banco preexistente permanecem 100% intocados.
3. **Projeção Catálogo Final:**
   * Disciplinas preexistentes: 32 (31 ativas) + 16 novas = **48 disciplinas (47 ativas)**.
   * Tópicos preexistentes: 340 (336 ativos) + 98 novos = **438 tópicos (434 ativos)**.
4. **Validação Técnica:** Aprovada em 100% dos testes de DDL, slugs regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` e integridade relacional 1:1 primária em `scratch/test_migration_037.py`.

---

## 5. Auditoria de Imagens e Recursos Estáticos

* **Total de Imagens Referenciadas nos 1.162 Payloads:** 68 imagens distintas.
* **Disponibilidade Física:** Todas as 68 imagens estão presentes, sanitizadas (EXIF removido) e íntegras nos diretórios:
  * `C:\PRO\worktrees\questoes-importacao-20261024\public\questions\calculations\`
  * `C:\PRO\site\public\questions\calculations\`
* **URLs de Chamada:** Rigorosamente normalizadas no padrão `/resumos/questions/calculations/<arquivo>.png`.
* **Zero Caminhos Locais:** Nenhuma ocorrência de caminhos absolutos de sistema (`C:\...` ou `file://`) nos enunciados ou comentários.

---

## 6. Sincronização do Registro Mestre e Artefatos

* **`scratch/registro_decisoes_1251.json`:**
  * `candidata_apta`: **1.162** (com `current_block: null`, `topic_id` real preenchido, fase e lote mapeados).
  * `retida`: **63** (38 com `current_block: "anulada_pela_banca"` e 25 com `current_block: "gabarito_preliminar_caderno3_pendente_homologacao_caderno1"`).
  * `excluida`: **26** (com `current_block: "excluida_permanente"`).
  * Revisor: `IA Antigravity (Auditoria de Prontidão 2026-10-25)`.
  * Zero contradições entre `final_status` e `current_block`.
* **`scratch/readiness.json`:** Gerado com a relação exaustiva dos 1.360 itens e reconciliação matemática verificada (`reconciliation_check: true`).

---

## 7. Conclusão e Próximo Passo

O plano `docs/PLANO_PRONTIDAO_QUESTOES_PDF_2026-10-25.md` foi executado integralmente até o seu marco final: **Preflight Aprovado**.

O acervo de **1.162 questões prontas** está congelado, validado e apto para importação quando autorizado pelo usuário através do roteiro em `docs/PLANO_IMPORTACAO_INTEGRAL_QUESTOES_PDF_2026-10-25.md`.
