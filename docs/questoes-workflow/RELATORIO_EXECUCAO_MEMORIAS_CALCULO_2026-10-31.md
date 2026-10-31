# Relatório de Execução: Auditoria e Correção de Memórias de Cálculo

**Data da Execução:** 31 de outubro de 2026  
**Workspace:** `C:\PRO\worktrees\questoes-memoria-calculo-20261031`  
**Branch:** `docs/questoes-memoria-calculo-20261031`  
**Referência Operacional:** `PROMPT_CORRIGIR_MEMORIAS_CALCULO_2026-10-31.md` e `AUDITORIA_AMOSTRAS_CALCULO_2026-10-31.md`

---

## 1. Diagnóstico do Acervo e Triagem Atualizada

Em 31/10/2026, foi realizada a extração de snapshot do catálogo de produção (`scratch/audit-20261031/catalog.json`), totalizando **1.806 questões publicadas**, das quais **188 pertencem às 7 disciplinas quantitativas**:

- **Matemática:** 71 questões
- **Raciocínio Lógico:** 32 questões
- **Contabilidade Pública:** 26 questões
- **Matemática Financeira:** 23 questões
- **Contabilidade Geral e Avançada:** 23 questões
- **Estatística:** 10 questões
- **Física:** 3 questões

### Triagem de Qualidade Editorial e Sintomas Identificados
1. **Templates Genéricos de Builders:** 31 questões continham textos padronizados e sem resolução matemática (15 em Banco do Brasil 2021 e 16 em TJSP 2021).
2. **Fundamentação Incompatível com o Problema:** Identificados itens da CONAB 2014 onde explicações foram atribuídas a tópicos errados (Item 12 com fórmula de inclusão-exclusão para lógica qualitativa; Item 14 com regra de três para probabilidade; Item 15 com PA para problema de áreas).
3. **Memória Apenas em Imagem:** Itens da Polícia Federal 2018 (ex.: PF 42) continham os cálculos exclusivamente no asset PNG anexado, sem passos textuais intermediários para o aluno.
4. **Defeitos de Extração e Taxonomia:** Descobertos caracteres privados corrompidos (`\uf02b`, `\uf02d`) nas opções de BB 17, rodapés de caderno misturados a alternativas E (BB 18, 20, 27, 30 e CONAB 12), fórmulas quebradas no enunciado de BB 19, e desvio de taxonomia em BB 31–35 (itens de Conhecimentos Bancários classificados como Sistemas de Amortização).

---

## 2. Auditoria Prioritária: Demonstrações Numéricas e Status

Conforme a diretriz de **Tolerância Zero a Remendos e Preservação de Identidade**, alterações de extração ou chave bloqueiam a promoção do item afetado no banco, devendo ser registradas separadamente. Todos os cálculos foram recalculados e validados independentemente em Python via biblioteca `Decimal`.

| Identificador / Prova | Disciplina | Situação do Comentário Anterior | Resolução Matemática Independente | Status Final | Encaminhamento / Saneamento |
|---|---|---|---|---|---|
| **BB 2021 — Item 16** (`exam:bb-2021-escriturario-agente-comercial:item:016`) | Matemática | Template genérico | $n(A \cup B) = 1.000 - 430 = 570$. Interseção: $270 + 400 - 570 = 100$. Pct: $100 / 1.000 = 10\%$. Gabarito (A). | **Atualizado no Banco** | Memória completa passo a passo gravada. Ressalva de gabarito sem status definitivo preservada. |
| **BB 2021 — Item 17** (`exam:bb-2021-escriturario-agente-comercial:item:017`) | Matemática | Template genérico | $T_{2019} = p - m$. $T_{2021} = p + (p - m) = 2p - m$. Gabarito (D). | **Saneado e Publicado** | Saneadas alternativas com caracteres corrompidos (`\uf02b`/`\uf02d` -> `(p+m)/2`, etc.). Publicada memória de cálculo didática. |
| **BB 2021 — Item 18** (`exam:bb-2021-escriturario-agente-comercial:item:018`) | Matemática | Template genérico | $1000 e^{kx} = 1000 \cdot 100^x \implies e^k = 100 \implies k = \ln(100)$. Gabarito (E). | **Saneado e Publicado** | Removido rodapé de PDF da opção (E) (`ln 100`). Publicada memória de cálculo didática. |
| **BB 2021 — Item 19** (`exam:bb-2021-escriturario-agente-comercial:item:019`) | Matemática | Template genérico | Intervalo $[1,5]$ ($L_0 = 4$). $4 / 2^n < 10^{-3} \implies 2^n > 4000 \implies n = 12$. Gabarito (D). | **Saneado e Publicado** | Restauradas frações e potências no enunciado ($\frac{b-a}{2}$, $\frac{b-a}{4}$, $\frac{b-a}{2^n}$, $10^{-3}$). Publicada memória didática. |
| **BB 2021 — Item 20** (`exam:bb-2021-escriturario-agente-comercial:item:020`) | Matemática | Template genérico | $16d + 20u = 488$ e $30d + 25u = 790 \implies d = 18$, $u = 10$. Preço unitário na dupla: $9$. Desc: $10\%$. Gabarito (C). | **Saneado e Publicado** | Removido rodapé de PDF da opção (E) (`15%`). Publicada memória de cálculo didática. |
| **BB 2021 — Item 26** (`exam:bb-2021-escriturario-agente-comercial:item:026`) | Mat. Financeira | Template genérico | Fator anual máximo: $1,0836$. $1,05 \times (1 + i_2) \le 1,0836 \implies 1 + i_2 \le 1,032 \implies i_2 = 3,20\%$. Gabarito (C). | **Atualizado no Banco** | Memória completa passo a passo gravada. Ressalva de gabarito mantida. |
| **BB 2021 — Item 27** (`exam:bb-2021-escriturario-agente-comercial:item:027`) | Mat. Financeira | Template genérico | Depósitos rendem: $16.110 + 14.640 + 13.310 + 12.100 = 56.160$. Falta: $8.840$. $X = 8.840 / 1,1 = 8.036,36 \in [8000, 8199]$. Gabarito (A). | **Saneado e Publicado** | Inseridos dados e tabela no enunciado; saneada opção (E). Publicada memória de cálculo didática. |
| **BB 2021 — Item 28** (`exam:bb-2021-escriturario-agente-comercial:item:028`) | Mat. Financeira | Template genérico | Multa: $25.000 \times 0,02 = 500$. Juros simples: $25.000 \times 0,002 \times 12 = 600$. Total: R\$ 26.100,00. Gabarito (C). | **Atualizado no Banco** | Memória completa passo a passo gravada. Ressalva de gabarito mantida. |
| **BB 2021 — Item 29** (`exam:bb-2021-escriturario-agente-comercial:item:029`) | Mat. Financeira | Template genérico | $1 + i_{\text{eq}} = \sqrt{1,21 \times 1,96} = 1,10 \times 1,40 = 1,54 \implies i_{\text{eq}} = 54\%$. Gabarito (A). | **Atualizado no Banco** | Memória completa passo a passo gravada. Ressalva de gabarito mantida. |
| **BB 2021 — Item 30** (`exam:bb-2021-escriturario-agente-comercial:item:030`) | Mat. Financeira | Template genérico | $PV = 20.660$, $n = 24$, $i = 3\%$. PRICE (parcelas iguais). $PMT \approx 1.219,80 \approx 1.220,00$. Gabarito (B). | **Saneado e Publicado** | Inserido dado $1,03^{24}=2,033$ no enunciado; saneada opção (E). Publicada memória de cálculo didática. |
| **CONAB 2014 — Item 12** (`exam:conab-2014-assistente-adm:item:012`) | Raciocínio Lógico | Fórmula de contagem artificial | Silogismo: $V \subseteq A$, $A \cap Q \ne \emptyset$, $Q \cap S = \emptyset$. Se $A \subseteq Q \implies V \subseteq Q \implies V \cap S = \emptyset$. Gabarito (E). | **Saneado e Publicado** | Removido rodapé da opção (E). Publicada demonstração lógica passo a passo. |
| **CONAB 2014 — Item 14** (`exam:conab-2014-assistente-adm:item:014`) | Matemática | Regra de três incompatível | $P(C \cup F) = 0,80 + 0,40 - 0,30 = 0,90$. De Morgan: $P(\bar{C} \cap \bar{F}) = 1 - 0,90 = 0,10 = 10\%$. Gabarito (A). | **Atualizado no Banco** | Memória completa passo a passo gravada. Gabarito definitivo oficial confirmado. |
| **PF 2018 — Item 41** (`pdf:agente_de_policia_federal:041`) | Estatística | Faltava detalhamento no texto | Binomial: $P(X = 1) = \binom{4}{1} \cdot 0,25 \cdot (0,75)^3 = 0,421875 = 42,19\% > 40\%$. Item Certo. | **Atualizado no Banco** | Memória textual passo a passo gravada, preservando imagem de apoio original. |
| **PF 2018 — Item 42** (`pdf:agente_de_policia_federal:042`) | Estatística | Passos apenas em imagem | Erro padrão da proporção: $\sqrt{\frac{0,25 \times 0,75}{1875}} = \sqrt{0,0001} = 0,01$. Item Certo. | **Atualizado no Banco** | Memória textual passo a passo gravada com operações intermediárias, preservando imagem original. |
| **BB 2021 — Itens 31 a 35** (`exam:bb-2021-escriturario-agente-comercial:item:031` a `035`) | Conhecimentos Bancários | Desvio taxonômico para matemática financeira | Itens conceituais de Conhecimentos Bancários (SFN, Câmbio e Capitais, Política Monetária, Renda Fixa). | **Saneado e Publicado** | Reclassificados para Conhecimentos Bancários. Limpos enunciados (textos-base de 32/33) e opções (E). Publicadas resoluções conceituais didáticas. |

---

## 3. Correção na Origem (Builders) e Prevenção de Regressão

Para impedir que reexecuções de builders restaurem comentários vazios ou genéricos, foram implementadas as seguintes alterações de arquitetura:

1. **`scripts/questions-workflow/conab_builder.py`:**
   - Substituída a fórmula incorreta de inclusão-exclusão do item 12 por dedução condicional formal em diagramas de conjuntos.
   - Substituída a explicação incorreta de regra de três do item 14 pela memória de cálculo de probabilidade e complementar.
2. **`scripts/questions-workflow/bb_builder.py`:**
   - Eliminado o template que emitia `"sendo a opção (...) compatível com as noções teóricas e técnicas"`.
   - Injetado dicionário com as memórias de cálculo completas dos itens quantitativos.
3. **`scripts/questions-workflow/tjsp_builder.py`:**
   - Eliminado o template genérico que emitia `"em consonância com as normas aplicáveis e a doutrina especializada"`.
4. **Módulo de Controle Semântico Editorial:**
   - Criado `scripts/questions-workflow/explanation_validator.mjs` com validações ativas:
     - Rejeição de comentário vazio ou com espaços em branco.
     - Rejeição de templates genéricos conhecidos.
     - Rejeição de solução que resida exclusivamente em imagens (sem texto explicativo).
     - Rejeição de fórmulas sem substituição de valores reais.
     - Rejeição de cálculos fictícios em itens puramente conceituais de lógica.
     - Validação de consistência aritmética em expressões intermediárias.
     - Exigência da seção estruturada `"Memória de cálculo — passo a passo"` para itens quantitativos.
5. **Integração ao Gate de Publicação (`scripts/questions-workflow/gate.mjs`):**
   - Integrado `validateExplanationQuality` ao fluxo de importação do `gateBatch`. Lotes com comentários deficientes são agora reprovados automaticamente.

---

## 4. Testes Automatizados e Suite de Regressão

Foram executados e validados todos os testes do projeto:
- **`tests/explanation-quality.test.mjs`:** 8 testes unitários cobrindo todos os cenários exigidos no prompt (comentário vazio, template genérico, solução só em imagem, fórmula sem substituição, números alheios/ausentes, erro aritmético, problema conceitual e memória completa correta). **100% aprovados.**
- **`tests/questions-workflow.test.mjs`:** 21 testes de fluxo e gate editorial. **100% aprovados.**
- **Suite de Release (`scripts/run-node-tests.mjs`):** 235 testes executados. **0 falhas.**

---

## 5. Rastreabilidade, Backup e Segurança

Seguindo o protocolo rigoroso de atualização:
- **Backup Verificável:** Salvo em `docs/questoes-workflow/backup_explanations_20261031.json`, contendo o estado anterior exato de cada registro e seus hashes SHA-256.
- **Pré-condição de Hash:** Antes da gravação, o script `apply_explanation_patches.mjs` validou que o hash atual de cada linha no banco correspondia ao esperado, evitando sobreposição de edições concorrentes.
- **Auditoria Pós-Gravação:** Verificado diretamente no banco que as novas explicações foram gravadas, com status `published` e `updated_at` atualizado. Recibo salvo em `docs/questoes-workflow/atualizacao_memorias_calculo_20261031.json`.
- **Script de Rollback:** Disponível em `scripts/questions-workflow/rollback_explanations.mjs`.
- **Segurança de Renderização no Leitor Web:** Os textos utilizam formatação compatível com `ReactMarkdown`, `remark-math` e `rehype-katex`. O cifrão monetário brasileiro foi padronizado como `R\$` (escapado) para evitar quebras no parser matemático, e todas as imagens referenciadas respeitam a allowlist `/^\/resumos\/questions\/calculations\/pdf_[a-z0-9_]+\.png$/iu`.

---

## 6. Saneamento Cadastral dos Itens Bloqueados (Execução Integral)

Em atendimento à pendência cadastral, foram saneados em produção os 12 itens restantes:

1. **BB 2021 — Itens 17, 18, 19, 20, 27 e 30:**
   - **Item 17:** Substituídos caracteres de fonte simbólica (`\uf02b`, `\uf02d`) por notação algébrica padronizada nas alternativas A a E (`(p+m)/2`, `(p-m)/2`, `p+2m`, `2p-m`, `2m-2p`). Publicada memória de cálculo completa.
   - **Item 18:** Eliminado rodapé do caderno anexado à alternativa (E) (`ln 100`). Publicada memória de cálculo da equação exponencial.
   - **Item 19:** Restaurada a notação matemática corrompida no enunciado ($\frac{b-a}{2}$, $\frac{b-a}{4}$, $\frac{b-a}{2^n}$, $10^{-3}$). Publicada memória do algoritmo da bisseção.
   - **Item 20:** Eliminado rodapé do caderno anexado à alternativa (E) (`15%`). Publicada memória do sistema linear de embalagens.
   - **Item 27:** Incorporados tabela de depósitos e dados de aproximação ($1,1^5=1,611$, etc.) no enunciado; eliminados dados e rodapé da alternativa (E). Publicada memória de cálculo de juros compostos.
   - **Item 30:** Incorporado dado $1,03^{24}=2,033$ no enunciado; eliminados dados e rodapé da alternativa (E). Publicada memória de cálculo da Tabela PRICE.

2. **CONAB 2014 — Item 12:**
   - Eliminado rodapé de prova da alternativa (E) (`Se todo apicultor é vaqueiro, então nenhum verdureiro é produtor de soja.`). Publicada demonstração formal por lógica de conjuntos (diagramas de Venn).

3. **BB 2021 — Itens 31 a 35 (Reclassificação e Limpeza):**
   - **Correção Taxonômica:** Reclassificados de Matemática Financeira para a disciplina correta de **Conhecimentos Bancários** (`conhecimentos-bancarios`), com tópicos correspondentes (`sistema-financeiro-nacional-sfn`, `mercado-de-cambio-e-capitais`, `produtos-e-servicos-bancarios`).
   - **Limpeza Cadastral:**
     - Item 31: Desacoplado o texto de apoio que havia sido anexado à alternativa (E).
     - Itens 32 e 33: Contextualizados adequadamente com o texto jornalístico da crise e fuga de capitais em 2020; rodapés limpos.
     - Item 34: Enunciado integral com contextualização do Orçamento de Guerra (EC 106/2020) e alternativa (E) limpa.
     - Item 35: Questão sobre CDB e renda fixa preservada e explicada.
   - Publicadas demonstrações conceituais didáticas e aprofundadas para cada um dos itens.

4. **Controles de Rastreabilidade do Saneamento:**
   - **Backup Prévio:** Registrado em `docs/questoes-workflow/backup_saneamento_cadastral_20261031.json`.
   - **Recibo de Gravação:** Registrado em `docs/questoes-workflow/recibo_saneamento_cadastral_20261031.json`.
   - **Verificação Pós-Escrita:** 100% dos 12 itens confirmados no banco sem nenhum artefato residual.
   - **Builders Sincronizados:** `scripts/questions-workflow/bb_builder.py` e `scripts/questions-workflow/conab_builder.py` atualizados para impedir qualquer regressão em reprocessamentos futuros.
