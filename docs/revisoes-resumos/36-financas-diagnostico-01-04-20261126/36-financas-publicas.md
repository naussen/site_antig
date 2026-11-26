# 36 — Finanças Públicas

## Diagnóstico vigente — 26/11/2026 — seções 01–04

**Somente diagnóstico; zero correções, escritas ou publicações.** Próximo lote da fila Onda7: **Finanças Públicas01–04**, quatro seções sobre falhas de mercado. A disciplina possui um tópico/7 seções ativas. **05–07 ficam fora deste lote**: distribuição/tributação, estabilização e déficit/dívida. Recorte de quatro em vez de cinco para manter coerência temática.

| Seção | Título | Callouts | Mapas |
|---|---|---:|---:|
| 01 | Externalidades | 2 | 1 |
| 02 | Causas das Externalidades | 1 | 1 |
| 03 | Bens Públicos | 2 | 0 |
| 04 | Informações Assimétricas (Entre as Partes) | 1 | 1 |

Examinados integralmente os quatro textos, seis callouts, três mapas Mermaid e a tabela de rivalidade/exclusão da03. Zero cartões/mnemônicos. Não se revisou o conteúdo de05–07; apenas títulos/identidades/revisões registrados para preservação.

### Estado e etapas do trabalho antigo

- Não havia relatório individual36. A fotografia `36-financas-publicas.snapshot.json` contém apenas um byte e não fornece JSON utilizável; preservada, não usada como fonte do estado atual.
- A definição histórica de lote `W7--36-financas-publicas--b01.json` agrupa sete seções; não autoriza executar as sete agora. O recorte atual prevalece.
- Há arquivos **não rastreados** antigos de pré-imagem, dataset, cinco propostas, importação, SQLs e capturas. Não localizados checkpoint/recibo de aplicação ou publicação nessa pasta. Conteúdos e revisões atuais das sete seções coincidem com a pré-imagem antiga; as cinco propostas locais diferem do banco. Isso distingue preparação/visual local de aplicação/reconciliação/publicação: **não tratar os SQLs ou renders como trabalho publicado**.
- Propostas antigas referentes a01/02/04 pertencem ao recorte;05/07 não pertencem. Não executar o pacote geral nem importar proposta sem nova revisão de fontes/contrato. A03 não integra a lista de propostas antigas, o que não a dispensa de conferência no lote.
- Ética aceita preservada: SELECT comparou os20 conteúdos e IDs de revisão à matriz de aceite, sem divergências. Relatório35 e seu aceite não modificados/reabertos. Nenhuma outra frente retomada.

### Achados e riscos para a revisão

- **01:** o exemplo agricultura→oferta→preço não demonstra externalidade técnica positiva por si; separar efeitos de preços de benefícios externos não internalizados. Corrigir a ideia de que compras públicas financiam despesas. Qualificar a intervenção estatal e comparações entre custos/benefícios sociais/privados, especificando grandezas marginais e produção/consumo. Conferir também os dois callouts. No mapa, definir se as setas são de bens ou dinheiro, especialmente empréstimos G→MF e comércio exterior; o problema não deve ser resolvido apenas invertendo setas sem definir o modelo.
- **02:** retirar a explicação da tragédia dos comuns baseada apenas em sentimento de propriedade; diferenciar livre acesso de propriedade comum com regras. A presença de custos de transação não inviabiliza automaticamente toda negociação: o mapa é absoluto demais. Texto/callout de Coase têm base válida a preservar/qualificar, sem reescrever por reflexo.
- **03:** núcleo e tabela já distinguem bens públicos puros, comuns, privados e de clube; carona, meritórios e rodovias pedagiadas/congestionadas tratados com distinções relevantes. Conferir terminologia de semipúblicos e exemplos sem presumir erro. Pode ser aceita sem edição se a revisão e a validação aplicável confirmarem; não foi marcada revisada neste diagnóstico.
- **04:** seleção adversa exige explicar seleção sob informação oculta; não é mera chance de compra ruim. Qualificar soluções, pois juros e outros instrumentos alteram incentivos/seleção. Salário eficiência é mecanismo de incentivo em modelos pertinentes, não exemplo nu do problema. Poder de mercado não permite escolher preço e quantidade sem restrições. Monopólio natural não se define apenas por custo fixo alto; distinguir estrutura, eficiência e necessidade/desenho da regulação. Conferir enquadramento alocativo/estabilizador e o mapa antes/depois. O prazo20anos da patente de invenção desde depósito corresponde ao art40: preservar o que está correto e não afirmar que patente elimina risco de pesquisa.

Esses achados delimitam a revisão futura; não são uma proposta aplicada nem aceite de conteúdo. Preservar identidades, títulos, ordem, vínculos e alterações preexistentes. Para mapas/conteúdo alterados, a revisão deverá conferir temas Light/Dark/Sepia, celular/desktop e zoom/overlay, usando os controles existentes; não repetir testes globais válidos sem motivo.

### Fontes e limites

Fontes primárias conferidas em **26/11/2026**, com relação aos achados em `fontes.json`:

- [IMF — Externalities](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/externalities): efeitos não incorporados no preço, custos/retornos privados e sociais e condições de negociação.
- [IMF — Global Public Goods](https://www.imf.org/en/publications/fandd/issues/2021/12/global-public-goods-chin-basics): bens públicos e carona.
- [Royal Swedish Academy — prêmio2009](https://www.nobelprize.org/uploads/2018/06/press-7.pdf): governança de propriedade comum por usuários, sem supor fracasso inevitável.
- [Stiglitz — Nobel Lecture](https://www.nobelprize.org/uploads/2018/06/stiglitz-lecture.pdf): trechos sobre informação, seleção/incentivos e salário eficiência.
- [Cade — defesa da concorrência](https://www.gov.br/cade/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-sobre-defesa-da-concorrencia/): poder de mercado e monopólio natural.
- [Lei9279/1996, art40](https://www.planalto.gov.br/ccivil_03/leis/l9279.htm): prazo da patente de invenção.

HTMLs do Nobel retornaram403; os PDFs oficiais de Ostrom/Stiglitz foram recuperados e consultados. Para Coase, usada a exposição do IMF; lecture indexada foi apenas complementar, sem alegar leitura integral da página bloqueada. Não se revisaram todas as funções macroeconômicas ou a Macroeconomia aceita. Mapas foram lidos semanticamente, sem novo teste visual nesta etapa de diagnóstico.

### Evidência, pendência e parada

Evidências: `orquestracao-03-54/saneamento-onda-7/36-financas-publicas/diagnostico-01-04-20261126/`: SELECT, estado atual, achados, fontes e checkpoint. Sintaxe/JSONs/diff documental verificados. Sem importação, dry-run, CAS, SQL de escrita, novos renders, build/lint ou workflows globais. Conferência com aluno dispensada; corpus PRO Legis fora do escopo.

**0/7 seções formalmente revisadas/aceitas neste ciclo**; quatro delimitadas para revisão, três reservadas para lote posterior. Disciplina permanece[ ] na fila de execução, com diagnóstico registrado; contagens22[x]/24[~]/8[ ] inalteradas. Arquivos antigos não rastreados e `workflow_onda.py` preservados. Nenhum próximo lote iniciado.

Próximo prompt: “Revise somente Finanças Públicas01–04, conforme relatório36. Preserve Ética aceita e as seções05–07, publique com proteção de concorrência, reconcilie e pare.”
