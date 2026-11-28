# -*- coding: utf-8 -*-
import hashlib
import json
from pathlib import Path

batch_dir = Path(r"C:\PRO\revisoes-resumos\orquestracao-03-54\saneamento-onda-7\40-legislacao-aduaneira\tributos-01-04-20261128")
batch_dir.mkdir(parents=True, exist_ok=True)

diag_state = json.loads(
    Path(r"C:\PRO\revisoes-resumos\orquestracao-03-54\saneamento-onda-7\40-legislacao-aduaneira\diagnostico-tributos-01-04-20261128\estado-atual.json").read_text(encoding="utf-8")
)

orig_by_id = {s["section_id"]: s for s in diag_state["selected_sections"]}

# ==============================================================================
# SEÇÃO 01 — Conceitos Iniciais
# ==============================================================================
sec01_md = """### Produto Estrangeiro, Nacional, Nacionalizado e Desnacionalizado

* **Nacional:** produto originário do País ou nele obtido/industrializado em conformidade com as regras de origem aplicáveis.
* **Nacionalizado:** mercadoria estrangeira **importada a título definitivo**, transferida para a economia nacional mediante **regular despacho aduaneiro para consumo** e respectivo **desembaraço aduaneiro** (após o pagamento dos tributos devidos ou o reconhecimento de isenção ou não incidência — Decreto-Lei nº 37/1966, arts. 44 e 51; Decreto nº 6.759/2009, arts. 212, § 1º, 542, 543 e 571). **Não** ocorre na data do embarque no exterior.
* **Desnacionalizado:** mercadoria nacional ou nacionalizada **exportada a título definitivo** para o exterior.
* **Estrangeiro:** produto de procedência externa, enquanto não nacionalizado (independentemente de ingressar com ou sem ânimo de definitividade), bem como a mercadoria desnacionalizada que venha a retornar ao País fora das exceções legais (Decreto nº 6.759/2009, art. 70).

### Reimportação, Reexportação e Mercadoria Desnacionalizada

* **Reimportação:** retorno ao País de mercadoria nacional ou nacionalizada que havia saído **temporariamente** (ex.: regime de exportação temporária). Não constitui fato gerador do Imposto de Importação — II (Decreto nº 6.759/2009, art. 74, II).
* **Reexportação:** saída para o exterior de mercadoria estrangeira que ingressou no País **sem caráter definitivo** (ex.: extinção do regime de admissão temporária).
* **Retorno de mercadoria desnacionalizada:** a mercadoria exportada em caráter definitivo passa a ser tratada como **estrangeira** caso retorne ao País, salvo nas hipóteses expressas do art. 70, I a V, do Decreto nº 6.759/2009 (consignação não vendida no prazo autorizado, defeito técnico para reparo/substituição, modificação na sistemática de importação do país importador, guerra/calamidade pública ou outros fatores alheios à vontade do exportador).

---

### Fato Gerador do Imposto de Importação (II)

O fato gerador material do Imposto de Importação é a **entrada de mercadoria estrangeira no território aduaneiro** (Decreto-Lei nº 37/1966, art. 1º; Decreto nº 6.759/2009, art. 72).

* Na importação para consumo, a simples entrada física não basta isoladamente: o fato gerador **aperfeiçoa-se na data do registro da Declaração de Importação (DI)** (elemento temporal para cálculo de alíquota e câmbio).
* Para efeito de cálculo do imposto, **considera-se entrada no território aduaneiro** a mercadoria que conste como importada e cujo **extravio** tenha sido verificado pela autoridade aduaneira (presunção legal), **ressalvadas as malas e as remessas postais internacionais** (Decreto nº 6.759/2009, art. 72, § 1º e § 2º — *atenção:* a ressalva legal refere-se às **malas postais**, e não às bagagens de viajantes).
* **Mercadoria a granel:** as diferenças percentuais apuradas na conferência não são consideradas para exigência do II até o limite de **1%**; porém, se a falta **exceder 1%**, o II é exigido sobre a **totalidade da diferença** (art. 72, §§ 3º e 4º — diferentemente do IPI-Importação, no qual se cobra apenas o que exceder **1%**, art. 238, § 4º).
* A incidência do II alcança bagagens de viajantes e bens enviados como presente, amostra ou a título gratuito, respeitadas as isenções e cotas legais (art. 69).

O elemento **temporal** do fato gerador varia conforme a situação legal (Decreto nº 6.759/2009, art. 73):

| Momento de Ocorrência (Data) | Situações Aplicáveis (Decreto nº 6.759/2009, art. 73) |
| :--- | :--- |
| **Data do registro da Declaração de Importação (DI)** | Mercadoria despachada para consumo, inclusive a) admitida anteriormente em regime aduaneiro especial ou atípico com suspensão; e b) contida em Remessa Postal Internacional (RPI) ou encomenda aérea internacional submetida ao **Regime de Importação Comum (RIC)**. |
| **Data do lançamento do crédito tributário** | a) RPI não sujeita ao RIC; b) bagagem (acompanhada ou desacompanhada); c) mercadoria constante de manifesto ou documento equivalente cujo **extravio** tenha sido verificado (*a avaria foi excluída dessa hipótese pelo Decreto nº 8.010/2013 e Lei nº 12.350/2010*); d) mercadoria estrangeira não objeto de DI que tenha sido **consumida, revendida ou não localizada** antes ou após pena de perdimento. |
| **Data do registro da declaração de admissão temporária para utilização econômica** | Bens admitidos sob o regime de **admissão temporária para utilização econômica**, no qual há pagamento proporcional ao tempo de permanência no País e suspensão parcial do saldo remanescente (arts. 73, IV, e 373). |
| **Data do vencimento do prazo de permanência em recinto alfandegado** | Quando esgotado o prazo legal sem início do despacho, **antes de aplicada a pena de perdimento**: **90 dias** da descarga em recinto de Zona Primária (ZP); ou **120 dias** em recinto de Zona Secundária (ZS — **75 dias** de permanência acrescidos de **45 dias**). Aplicada a pena de perdimento (e localizada a mercadoria), **não incide o II** (art. 71, III). |

---

### Sujeito Passivo

#### Contribuinte (Decreto-Lei nº 37/1966, art. 31, atualizado pela LC nº 227/2026)
* **Importador:** qualquer pessoa que promova a entrada de mercadoria estrangeira no território aduaneiro.
* **Adquirente na importação por conta e ordem de terceiro:** pela **Lei Complementar nº 227, de 13/01/2026** (vigente desde a publicação), o art. 31, parágrafo único, do Decreto-Lei nº 37/1966 explicita que, na importação por conta e ordem de terceiro, quem promove a entrada dos bens no território nacional (**contribuinte**) é o **adquirente dos bens no exterior**.
* **Destinatário de remessa postal internacional (RPI):** aquele indicado pelo respectivo remetente.
* **Adquirente de mercadoria entrepostada:** quem adquire mercadoria estrangeira depositada em entreposto aduaneiro.

#### Responsável (Decreto-Lei nº 37/1966, art. 32, *caput*; Decreto nº 6.759/2009, art. 105)
* **Transportador:** quando transportar mercadoria procedente do exterior ou sob controle aduaneiro, inclusive em percurso interno.
* **Depositário:** qualquer pessoa incumbida da custódia de mercadoria sob controle aduaneiro.

#### Responsável Solidário — sem benefício de ordem (DL nº 37/1966, art. 32, parágrafo único, atualizado pela LC nº 227/2026; Decreto nº 6.759/2009, art. 106)
* **Adquirente ou cessionário** de mercadoria beneficiada com isenção ou redução do imposto.
* **Representante, no País, do transportador estrangeiro** (bem como o expedidor, o operador de transporte multimodal — OTM — ou qualquer subcontratado, nos limites da legislação específica).
* **Pessoa que registra, em seu nome, a DI de bens adquiridos no exterior por outra pessoa** (prestadora da importação por conta e ordem — art. 32, parágrafo único, III, do DL nº 37/1966, com redação da LC nº 227/2026).
* **Encomendante predeterminado** que adquire mercadoria de procedência estrangeira de pessoa jurídica importadora (importação por encomenda — art. 32, parágrafo único, IV, do DL nº 37/1966, incluído pela LC nº 227/2026).
* **Beneficiário de regime aduaneiro suspensivo** destinado à industrialização para exportação, no caso de admissão de mercadoria por outro beneficiário (Decreto nº 6.759/2009, art. 106, V).

*Nota de prova:* o texto infralegal dos arts. 104 a 106 do Decreto nº 6.759/2009 ainda reflete a redação anterior à LC nº 227/2026 (na qual o adquirente por conta e ordem figurava ao lado do encomendante como responsável solidário); na lei vigente em **2026** (DL nº 37/1966), o adquirente por conta e ordem é **contribuinte** e a importadora que registra a DI em nome próprio é **responsável solidária**.

---

### Base de Cálculo e Alíquotas

* **Alíquota *ad valorem*:** a base de cálculo é o **Valor Aduaneiro (VA)**, apurado segundo o Acordo de Valoração Aduaneira (AVA-GATT), tomando por referência o valor de transação acrescido de transporte e seguro internacionais até o porto ou aeroporto alfandegado de descarga (base CIF). **Excluem-se do VA** os gastos incorridos **no território nacional** com carga, descarga e manuseio (**capatazia interna**), desde que destacados do custo de transporte (Decreto nº 6.759/2009, art. 77, II, na redação do Decreto nº 11.090/2022). Na ocorrência de **avaria**, o VA é reduzido proporcionalmente ao prejuízo, a pedido do interessado (art. 89).
* **Alíquota específica:** quantidade de mercadoria expressa na unidade de medida estabelecida (ex.: kg, m³).

| Tipo / Regime | Regra de Fixação da Alíquota |
| :--- | :--- |
| **Regra Geral (TEC)** | Constante da **Tarifa Externa Comum (TEC)** vigente na data do fato gerador, podendo ser alterada pela **CAMEX** nos limites legais (CF, art. 153, § 1º; Decreto nº 6.759/2009, arts. 90 e 92). |
| **Acordo Internacional / GATT / ALADI** | Aplica-se a alíquota negociada no acordo internacional, salvo se a alíquota geral brasileira for mais favorável (art. 93); tarifas negociadas no GATT estendem-se aos demais países conforme cláusula de nação mais favorecida, respeitadas preferências regionais (ALADI/Mercosul). |
| **RTS, RTE e RTU** | **Não são fixadas pela CAMEX:** no **RTS**, compete ao **Ministro da Fazenda** dispor sobre grupos, alíquotas e isenções dentro dos limites do Decreto-Lei nº 1.804/1980 (Leis nº 14.902/2024 e nº 15.502/2026); no **RTE**, a alíquota de **50%** decorre de lei/regulamento (art. 101), cabendo ao Ministério da Fazenda fixar limites de isenção; no **RTU**, a alíquota federal única decorre da Lei nº 11.898/2009 regulamentada por decreto do Poder Executivo (**25%** no Decreto nº 6.956/2009). |

---

### Regimes Especiais de Tributação

#### MNI (Mercadorias Não Identificadas)
Aplica-se no extravio ou consumo de mercadoria submetida a despacho sem identificação exata em razão de **descrição genérica** nos documentos comerciais ou de transporte (Decreto nº 6.759/2009, art. 98; Lei nº 10.833/2003, art. 67):
* **a) Alíquotas:** **50%** para o **Imposto de Importação (II)** (art. 98, *caput*) e **50%** para o **IPI-Importação** (art. 240, parágrafo único).
* **b) Base de Cálculo:** arbitrada pela **média** aritmética dos valores por quilograma de todas as mercadorias importadas a título definitivo, pela mesma via de transporte internacional, constantes de declarações registradas no semestre anterior (incluídos transporte e seguro internacionais), **acrescida de duas vezes o correspondente desvio-padrão estatístico** (art. 98, § 1º — *média + 2 desvios-padrão*, e não mediana). Na falta de peso líquido, aplica-se o peso bruto (§ 2º).

#### RTS (Regime de Tributação Simplificada)
Permite a **classificação genérica** no despacho de remessas postais e expressas internacionais com **valor aduaneiro** (bens + frete + seguro, e não FOB) de até **US\\$ 3.000,00** (ou equivalente), destinadas a pessoa física (PF) ou jurídica (PJ), com **isenção de IPI, PIS/Pasep-Importação e Cofins-Importação** (Decreto nº 6.759/2009, arts. 99–100; Decreto-Lei nº 1.804/1980 alterado pelas Leis nº 14.902/2024 e **nº 15.502, de 10/09/2026**):
* **a) Regra geral do II:** **60%** sobre o valor aduaneiro (quando não enquadrada nas regras diferenciadas). Pela tabela progressiva base do art. 1º, § 2º-A, do DL nº 1.804/1980 (Lei nº 14.902/2024), fixou-se piso legal de **20%** até **US\\$ 50,00** e **60%** de **US\\$ 50,01 a US\\$ 3.000,00** com dedução de **US\\$ 20,00**, tendo a **Lei nº 15.502/2026** (conversão da MP nº 1.357/2026) autorizado ato do Ministro da Fazenda (art. 1º, § 2º-B, II) a reduzir as alíquotas até **0%** na faixa até **US\\$ 50,00** e até **30%** até **US\\$ 3.000,00** conforme via postal/expressa ou adesão a programa de conformidade da RFB.
* **b) Programa Remessa Conforme (PRC) — destinatário PF (vigente desde 12/05/2026, Portaria MF nº 1.342/2026):** alíquota de **0%** de II quando o valor aduaneiro for de até **US\\$ 50,00**; e alíquota de **60%** acima de **US\\$ 50,00** até **US\\$ 3.000,00**, com **parcela a deduzir de US\\$ 30,00** sobre o imposto devido (*histórico recente:* de `01/08/2024` a `11/05/2026`, aplicavam-se no PRC **20%** até **US\\$ 50,00** e dedução de **US\\$ 20,00**). Permanece a isenção até **US\\$ 50,00** para remessa postal sem fins comerciais enviada de PF para PF.
* **c) Medicamentos importados por PF para uso próprio:** alíquota de **0%** de II até **US\\$ 10.000,00**, cumpridos os requisitos sanitários; a Lei nº 15.502/2026 (§§ 2º-C a 2º-E) também previu alíquota zero sem os limites do RTS para medicamentos acabados sem similar nacional (Anvisa) destinados a doenças raras ou negligenciadas, na forma de regulamento conjunto.
* **d) ICMS estadual:** incide normalmente nas importações pelo RTS (calculado "por dentro" conforme a legislação estadual).

#### RTE (Regime de Tributação Especial)
Permite o despacho de bens integrantes de **bagagem** de viajante ou adquiridos em **lojas francas de chegada** que excedam os limites de isenção, desde que sem finalidade comercial ou industrial (Decreto nº 6.759/2009, arts. 101–102 e 169):
* **Cota de isenção da bagagem acompanhada (a cada 30 dias):** **US\\$ 1.000,00** (via aérea ou marítima) ou **US\\$ 500,00** (via terrestre, fluvial ou lacustre), além de livros, periódicos e bens usados de uso/consumo pessoal compatíveis com a viagem.
* **Cota adicional autônoma em loja franca (*Free Shop*) de chegada:** **US\\$ 1.000,00** no primeiro aeroporto/porto de desembarque no País ou **US\\$ 500,00** (a cada **30 dias**) em loja franca de fronteira terrestre, respeitados os limites quantitativos específicos.
* **Cálculo no RTE:** alíquota única de **50%** de II incidente **apenas sobre o valor que exceder o respectivo limite de isenção**, com **isenção de IPI, PIS/Pasep-Importação e Cofins-Importação** (art. 245, II, *b*).

#### RTU (Regime de Tributação Unificada)
Permite a importação, por **via terrestre**, de mercadorias relacionadas em lista positiva e procedentes do **Paraguai**, por **microempresa varejista optante pelo Simples Nacional** previamente habilitada (Lei nº 11.898/2009; Decreto nº 6.956/2009; Decreto nº 6.759/2009, art. 102-A):
* **a) Alíquota federal unificada:** **25%** sobre o preço de aquisição, englobando II (**7,88%**), IPI (**7,87%**), Cofins-Importação (**7,60%**) e PIS/Pasep-Importação (**1,65%**) — reduzida pelo Decreto nº 6.956/2009, com base no art. 10, § 2º, da Lei nº 11.898/2009, em relação ao percentual original de **42,25%** previsto no *caput* da lei (*nota de transição:* a LC nº 214/2025 altera dispositivos relativos a PIS/Cofins do RTU apenas a partir de **1º/01/2027**).
* **b) Limite:** até **R\\$ 110.000,00** por ano-calendário (fracionado em limites trimestrais/semestrais e quantitativos definidos em regulamento), vedada cumulatividade com outros benefícios ou reduções (art. 102-A, § 3º).
* **c) ICMS:** **pode** ser incluído mediante convênio de adesão do Estado ou Distrito Federal (Lei nº 11.898/2009, art. 9º, § 3º).
* **d) Vedações legais (art. 102-A, § 2º):** mercadorias não destinadas ao consumidor final, armas e munições, fogos de artifício e explosivos, bebidas (inclusive alcoólicas), cigarros, veículos automotores e embarcações de todo tipo (inclusive partes e peças), medicamentos, pneus, bens usados e bens de importação suspensa ou proibida."""

sec01_callouts = [
    {
        "type": "warning",
        "title": "Pena de Perdimento e Imposto de Importação",
        "text": "Se a pena de perdimento for aplicada à mercadoria que esgotou o prazo de permanência em recinto alfandegado (e ela for localizada), não há incidência do Imposto de Importação (art. 71, III); já se tiver sido consumida, revendida ou não localizada, o imposto é lançado (art. 73, II, 'd').",
    },
    {
        "type": "info",
        "title": "Nacionalização Depende de Despacho para Consumo",
        "text": "A nacionalização da mercadoria estrangeira importada em caráter definitivo NÃO ocorre na data do embarque: ela exige regular despacho aduaneiro para consumo e desembaraço aduaneiro, mediante pagamento dos tributos ou reconhecimento de isenção/não incidência.",
    },
    {
        "type": "tip",
        "title": "Diferença entre RTS e MNI",
        "text": "O RTS permite a CLASSIFICAÇÃO genérica de remessas até US$ 3.000,00 de valor aduaneiro, enquanto o MNI aplica-se a extravio ou consumo com DESCRIÇÃO genérica, cobrando 50% de II e 50% de IPI sobre a média por kg acrescida de dois desvios-padrão.",
    },
]

sec01_mermaid = """flowchart TD
    A["Qualificação da Mercadoria"] --> B["Nacional<br/>Origem ou produção no País"]
    A --> C["Estrangeira<br/>Procedência externa"]
    C --> D["Nacionalizada<br/>Despacho para consumo"]
    B --> E["Desnacionalizada<br/>Exportação definitiva"]
    D --> E"""


# ==============================================================================
# SEÇÃO 02 — Lançamento, Pagamento, Compensação e Restituição
# ==============================================================================
sec02_md = """### Lançamento e Confissão de Dívida na DI

Os tributos incidentes no comércio exterior sujeitam-se, como regra, ao **lançamento por homologação**, dispondo a fiscalização aduaneira do prazo decadencial de **5 anos**, contados da data do registro da Declaração de Importação (DI), para concluir a **revisão aduaneira** (CTN, art. 150, § 4º; Decreto-Lei nº 37/1966, art. 54; Decreto nº 6.759/2009, art. 638, § 2º, I).

* **Confissão de dívida (vigente desde 1º/01/2026):** pelo **art. 44, parágrafo único, do Decreto-Lei nº 37/1966** (incluído pela Lei Complementar nº 214/2025, arts. 497 e 544, VI), as informações prestadas pelo sujeito passivo na declaração de importação constituem **confissão de dívida** pelo contribuinte e instrumento hábil e suficiente para a exigência do valor dos tributos nela consignados, restando **constituído o crédito tributário** (sem prejuízo de lançamento de ofício suplementar na conferência ou na revisão aduaneira).

### Pagamento e Conversão Cambial

O pagamento do Imposto de Importação deve ser efetuado **na data do registro da DI**, salvo se outro momento for fixado pelo Ministro de Estado da Fazenda (Decreto nº 6.759/2009, art. 107). Para valores expressos em moeda estrangeira, a conversão em moeda nacional faz-se pela taxa de câmbio vigente **na data em que se considerar ocorrido o fato gerador** (art. 88 — ressalvada a regra específica da Lei nº 15.502/2026 para compras em plataformas habilitadas no programa de conformidade do RTS, que admite o câmbio da data da compra).

### Compensação

A compensação extingue o crédito tributário e pode alcançar créditos do sujeito passivo relativos a tributos administrados pela Secretaria Especial da Receita Federal do Brasil (RFB). Contudo, é **expressamente vedada a compensação de débitos relativos a tributos e contribuições devidos no momento do registro da DI** (Lei nº 9.430/1996, art. 74, § 3º, II; Decreto nº 6.759/2009, art. 113).

### Restituição e Protesto do Importador

Cabe a **restituição total ou parcial** do imposto pago indevidamente ou a maior nas seguintes hipóteses (Decreto nº 6.759/2009, arts. 110 e 112; CTN, art. 165):
* **a)** diferença apurada em revisão aduaneira decorrente de erro de cálculo, de aplicação de alíquota, de declarações sobre o valor aduaneiro ou sobre a quantidade de mercadoria;
* **b)** reforma, anulação, revogação ou rescisão de decisão condenatória;
* **c)** apuração de pagamento maior que o devido, inclusive no retorno antecipado de bens submetidos ao regime de admissão temporária para utilização econômica (art. 373, § 4º);
* **d)** verificação de que o contribuinte, à época do fato gerador, era beneficiário de isenção ou redução concedida em caráter geral, ou já havia preenchido as condições e requisitos exigíveis para a concessão em caráter especial (art. 110, I);
* **e)** verificação de **extravio ou avaria**, hipótese em que a restituição **independerá de prévia indenização**, por parte do responsável, da importância devida à Fazenda Nacional (art. 112, *caput*).

A restituição total ou parcial do imposto acarreta a restituição, na mesma proporção, dos **juros de mora e das penalidades pecuniárias**, **desde que estas tenham sido calculadas com base no imposto anteriormente pago** (Decreto nº 6.759/2009, art. 111; CTN, art. 167, *caput* — excluem-se apenas as penalidades referentes a infrações de caráter formal não prejudicadas pela causa da restituição, **não** se restringindo às multas de mora). A restituição pode processar-se **de ofício**, a requerimento do interessado ou mediante utilização do crédito em compensação posterior (vedada no registro da DI).

* **Protesto do importador (art. 112, parágrafo único):** a reclamação quanto a **erro sobre quantidade ou qualidade de mercadoria, ou quando ocorrer avaria**, deverá ser apresentada **antes da saída da mercadoria do recinto alfandegado**, salvo quando, a critério da autoridade aduaneira, houver inequívoca demonstração do alegado.

---

### Isenções e Reduções: Regras Gerais

Somente podem ser concedidas isenções ou reduções do imposto expressamente previstas em **lei** ou em **ato internacional** (CF, art. 150, § 6º; Decreto nº 6.759/2009, art. 114).

#### Requisitos Gerais Cumulativos e Exceções Legais (arts. 118, 119, 201 e 210)
**Observadas as exceções previstas em lei ou no Regulamento Aduaneiro**, o reconhecimento de isenção ou redução condiciona-se cumulativamente a:
1. **Inexistência de similar nacional:** apurada antes da importação pela Secretaria de Comércio Exterior (**SECEX/DECEX**), considerando qualidade equivalente, preço não superior ao custo de importação em moeda nacional (base CIF acrescida dos tributos incidentes) e prazo normal de entrega (arts. 190 e 193). *Exceções dispensadas de similaridade (art. 201):* bagagem de viajantes, missões diplomáticas/repartições consulares e organismos internacionais permanentes, amostras e RPI sem valor comercial, loja franca, coletores eletrônicos de votos, bens doados a entidades sem fins lucrativos culturais/científicas/assistenciais e pesquisa científica até o limite global anual;
2. **Transporte em navio de bandeira brasileira:** obrigatório na via marítima (incluído navio estrangeiro afretado por empresa nacional autorizada), respeitada a reciprocidade e suprível por documento de liberação de carga do órgão competente de transportes (art. 210, *caput*, §§ 1º e 4º). *Exceções:* bens doados por residente/sediado no exterior são dispensados (art. 210, § 3º, I); no descumprimento por órgão da administração pública direta ou indireta, a aduana comunica ao órgão de transportes **sem prejuízo do desembaraço com isenção**, enquanto nos demais casos há **perda do benefício** (art. 211, I e II);
3. **Regularidade fiscal federal:** comprovação de quitação de tributos e contribuições federais, **exceto** para a União, os Estados, o Distrito Federal, os Municípios e suas autarquias e fundações públicas (art. 119, *caput* e parágrafo único).

O reconhecimento de isenção ou redução **não gera direito adquirido** e será tornado insubsistente de ofício sempre que se apure que o beneficiário não satisfazia ou deixou de satisfazer os requisitos legais, cobrando-se o crédito acrescido de juros de mora — com penalidade nos casos de dolo ou simulação, e sem penalidade nos demais casos (CTN, art. 179, § 2º; Decreto nº 6.759/2009, art. 121).

#### Redução Tarifária Temporária (*Ex-Tarifário*)
Com fundamento no art. 4º da Lei nº 3.244/1957 e nas diretrizes do Mercosul, o regime de **Ex-Tarifário** consiste na **redução temporária e excepcional da alíquota do Imposto de Importação** (em regra até **0%**) para **Bens de Capital (BK)** e **Bens de Informática e Telecomunicações (BIT)** assinalados na TEC quando **não houver produção nacional equivalente**:
* **Critério próprio:** exige comprovação de **inexistência de produção nacional equivalente**, procedimento distinto do exame ordinário de similaridade das isenções subjetivas;
* **Concessão e vigência do ato:** outorgado por resolução da **CAMEX/GECEX** com prazo determinado de vigência (usualmente até **2 anos**) para o registro das importações ao amparo da redução;
* **Caráter objetivo (*erga omnes*):** criada a exceção temporária ("Ex") no código NCM, a alíquota reduzida aproveita a **qualquer importador** que importe bem idêntico durante a vigência do ato concessivo, sem vinculação subjetiva de inalienabilidade típica das isenções pessoais."""

sec02_callouts = [
    {
        "type": "warning",
        "title": "Compensação Vedada no Registro da DI",
        "text": "Eventual crédito tributário do importador administrado pela RFB NÃO pode ser utilizado para compensação de tributos devidos no momento do registro da Declaração de Importação (Lei nº 9.430/1996, art. 74, § 3º, II; Decreto nº 6.759/2009, art. 113).",
    },
    {
        "type": "warning",
        "title": "Protesto do Importador e Restituição de Penalidades",
        "text": "O protesto por erro de quantidade/qualidade ou avaria deve preceder a saída do recinto alfandegado, salvo demonstração inequívoca aceita pela aduana (art. 112, parágrafo único). Na restituição do II, devolvem-se proporcionalmente juros e penalidades calculadas sobre o imposto pago, não apenas multas de mora (art. 111).",
    },
]

sec02_mermaid = """flowchart TD
    A["Isenção ou Redução do II"] --> B["Regra Geral Cumulativa<br/>arts. 118, 119 e 210"]
    B --> C["Sem similar nacional<br/>SECEX/DECEX"]
    B --> D["Navio de bandeira brasileira<br/>ou liberação de carga"]
    B --> E["Regularidade fiscal federal"]
    A --> F["Ressalva: Exceções Legais<br/>Entes públicos, bagagem, doações"]"""


# ==============================================================================
# SEÇÃO 03 — Isenções
# ==============================================================================
sec03_md = """### Distinção Inicial: Imunidades Constitucionais vs. Isenções Legais

Na leitura da legislação aduaneira, é indispensável distinguir **imunidade constitucional** (limitação constitucional ao poder de tributar quanto a **impostos**, prevista na CF/1988) de **isenção legal** (dispensa legal do pagamento concedida pela União em lei específica, como as Leis nº 8.010/1990 e nº 8.032/1990, regulamentadas nos arts. 136 a 189 do Decreto nº 6.759/2009):

* **Imunidades constitucionais aplicáveis à importação de impostos (CF, art. 150, VI, *a* a *d*, e §§ 2º e 4º):**
  1. **Livros, jornais, periódicos e o papel destinado à sua impressão** (imunidade objetiva — Decreto nº 6.759/2009, arts. 211-A e 245-A, exigido registro especial na RFB para quem comercializa/importa ou adquire o papel imune, art. 211-B);
  2. **Imunidade recíproca:** União, Estados, Distrito Federal, Municípios, autarquias e fundações instituídas e mantidas pelo poder público, quanto aos bens vinculados às suas finalidades essenciais (CF, art. 150, VI, *a*, e § 2º — coexistindo com isenção legal no art. 136, I, *a*);
  3. **Entidades religiosas/templos, partidos políticos (e fundações), entidades sindicais dos trabalhadores e instituições de educação e de assistência social sem fins lucrativos**, atendidos os requisitos legais e vinculadas às finalidades essenciais (CF, art. 150, VI, *b* e *c*, e § 4º — coexistindo com isenção legal no art. 136, I, *b*).

---

### Isenções Vinculadas à Destinação dos Bens (Objetivas)

Quando a isenção for vinculada à **destinação dos bens**, fica condicionada à **comprovação posterior de seu efetivo emprego** nas finalidades que motivaram a concessão, exigindo-se o imposto desde a data do registro da DI caso descumprida a condição (Decreto nº 6.759/2009, arts. 132 e 133). Regra geral, essas isenções estendem-se ao **IPI-Importação**, **exceto quanto aos objetos de arte doados a museus** (art. 245, I):

1. **Amostras e remessas postais internacionais**, sem valor comercial (art. 136, II, *a*).
2. **Remessas no Regime de Tributação Simplificada (RTS):** o teto de enquadramento no RTS é de até **US\\$ 3.000,00** de valor aduaneiro (com isenção de IPI e PIS/Cofins-Importação), mas a **isenção ou alíquota zero do II** aplica-se apenas nas hipóteses específicas regulamentadas pelo Ministério da Fazenda (art. 136, II, *b*, e art. 154; DL nº 1.804/1980 alterado pelas Leis nº 14.902/2024 e nº 15.502/2026: até **US\\$ 50,00** em remessa postal PF para PF sem fim comercial e nas compras por PF em plataforma certificada no PRC desde `12/05/2026`, além de medicamentos PF até **US\\$ 10.000,00**).
3. **Bagagem de viajantes** procedentes do exterior ou da Zona Franca de Manaus — ZFM, dentro dos limites legais e quantitativos (art. 136, II, *c*).
4. **Bens adquiridos em loja franca** instalada no País, observadas as cotas de isenção (art. 136, II, *d*).
5. **Drawback na modalidade isenção**, Zona Franca de Manaus / Amazônia Ocidental e Áreas de Livre Comércio, nos termos de sua legislação específica.
6. **Aeronaves e embarcações:** partes, peças e componentes destinados ao reparo, revisão e manutenção de aeronaves e embarcações, bem como à conservação, modernização ou conversão de embarcações registradas no REB (art. 136, II, *f* e *j*).
7. **Saúde:** medicamentos destinados ao tratamento de HIV/AIDS e instrumental científico destinado à respectiva pesquisa, sem similar nacional (art. 136, II, *g*).
8. **Objetos de arte recebidos em doação por museus** instituídos e mantidos pelo poder público **ou por outras entidades culturais reconhecidas como de utilidade pública** (arts. 136, II, *p*, e 180, parágrafo único — **atenção:** há isenção de II, mas **incide IPI-Importação**, pois a alínea *p* foi excluída pelo art. 245, I).
9. **Coletores eletrônicos de votos (urna eletrônica):** partes, peças e componentes sem similar nacional (art. 136, II, *n*).
10. **Eventos e premiações desportivas permanentes:** troféus, medalhas e bens recebidos como premiação em evento oficial no exterior ou bens consumidos/utilizados em evento esportivo oficial no País (art. 136, II, *o*), bem como bens importados por desportistas usados em evento oficial e recebidos em doação de entidade internacional ou fabricante estrangeiro (art. 136, II, *s*). *(Histórico exaurido:* a isenção temporária para equipamentos de treinamento olímpico do art. 8º da Lei nº 10.451/2002 / art. 186-A do Regulamento Aduaneiro teve seu prazo legal de fatos geradores encerrado em `31/12/2015`, não constituindo isenção permanente em vigor em `2026`).*
11. **Feiras, congressos e exposições internacionais:** material promocional e mercadorias destinadas exclusivamente ao consumo nesses eventos, observados os limites regulamentares (art. 136, II, *q*).
12. **Abastecimento:** gêneros alimentícios de primeira necessidade, fertilizantes, defensivos agropecuários e matérias-primas para sua produção no País, quando sujeitos a contingenciamento (art. 136, II, *h*).
13. **Comércio de subsistência em fronteira:** bens trazidos do exterior no comércio característico das cidades situadas nas fronteiras terrestres, destinados à subsistência da unidade familiar (art. 136, II, *r*).
14. **Bazares beneficentes diplomáticos:** mercadorias doadas por representações diplomáticas estrangeiras sediadas no País para venda em feiras, bazares e eventos semelhantes promovidos por entidades beneficentes, até o limite regulamentar (art. 136, II, *u*).

---

### Isenções Vinculadas à Qualidade do Importador (Subjetivas — art. 136, I)

1. **União, Estados, Distrito Federal, Territórios, Municípios e respectivas autarquias e fundações públicas** (art. 136, I, *a* — além da imunidade recíproca constitucional quanto a impostos).
2. **Partidos políticos e instituições educacionais ou de assistência social** sem fins lucrativos, observados os requisitos legais (art. 136, I, *b*).
3. **Pesquisa científica, tecnológica e inovação (ISENÇÃO LEGAL, e não imunidade):** importações realizadas pelo CNPq, por **Instituições Científicas, Tecnológicas e de Inovação (ICTs)** sem fins lucrativos e por **cientistas e pesquisadores** credenciados, bem como por empresas na execução de projetos de PD&I aprovados pelo CNPq, até o limite global anual fixado pelo Ministério da Fazenda (Leis nº 8.010/1990 e nº 8.032/1990; Decreto nº 6.759/2009, art. 136, I, *e*, e § 1º, e arts. 147 a 149-A e 186-E).
4. **Missões diplomáticas e repartições consulares de caráter permanente** e seus respectivos integrantes, observada a **reciprocidade de tratamento** (arts. 136, I, *c*, e 141).
5. **Representações de organismos internacionais de caráter permanente** dos quais o Brasil seja membro e seus integrantes estrangeiros, nos termos dos atos internacionais (art. 136, I, *d*).

---

### Transferência de Propriedade, Cessão de Uso, Depreciação e Prazos de Liberação

A transferência de propriedade ou a cessão de uso, a qualquer título, de bens importados com isenção ou redução vinculada à qualidade do importador ou à destinação obriga ao **prévio pagamento do imposto** (Decreto nº 6.759/2009, arts. 124 e 135):

* **Depreciação proporcional:** o imposto devido na transferência é reduzido proporcionalmente à depreciação do bem em função do tempo decorrido desde a **data do registro da DI** (escala regulamentar: **25%** até 12 meses; **50%** de 12 a 24 meses; **75%** de 24 a 36 meses; **100%** acima de 36 meses na depreciação aplicável, respeitado o prazo de liberação de cada hipótese — art. 125). **Não sofrem depreciação** os bens que normalmente **aumentam de valor com o tempo**, como obras de arte e antiguidades (art. 125, § 2º).
* **Dispensa sem pagamento em qualquer tempo (art. 126):** quando os bens forem transferidos ou cedidos a pessoa ou entidade que **goze de igual tratamento tributário** (mediante prévia decisão da autoridade aduaneira), ou destinados ao exterior.
* **Prazos para liberação definitiva sem pagamento do II (art. 124, parágrafo único, II e III — distinção essencial de prova):**
  * **Após 3 (três) anos do registro da DI:** aplica-se **exclusivamente** aos bens importados com a isenção de **missões diplomáticas, repartições consulares permanentes e representações de organismos internacionais permanentes, bem como seus integrantes** (art. 124, parágrafo único, II, c/c art. 136, I, *c* e *d*; para automóvel nacional adquirido com isenção de IPI por diplomata, o prazo é de **1 ano**, art. 144, parágrafo único);
  * **Após 5 (cinco) anos do registro da DI:** aplica-se a **todos os demais casos** de bens importados com isenção ou redução (art. 124, parágrafo único, III — ex.: ICTs, instituições educacionais/assistenciais, bens vinculados à destinação). *(Nota:* no **IPI-Importação** condicionado à destinação, o art. 244, parágrafo único, prevê inexigibilidade após **3 anos** do fato gerador).*"""

sec03_callouts = [
    {
        "type": "warning",
        "title": "Prazos de Liberação: 3 Anos (Diplomático) vs. 5 Anos (Regra Geral)",
        "text": "Pelo art. 124, parágrafo único, II e III, do Decreto nº 6.759/2009, a liberação sem pagamento do II após 3 anos do registro da DI vale APENAS para missões diplomáticas, repartições consulares e organismos internacionais permanentes (e seus integrantes); para todos os demais casos de isenção, o prazo é de 5 anos.",
    },
    {
        "type": "info",
        "title": "Pesquisa Científica (Isenção) e Objetos de Arte para Museus",
        "text": "ICTs, cientistas e pesquisadores gozam de ISENÇÃO legal (Lei nº 8.010/1990), e não de imunidade constitucional. Já objetos de arte doados a museus públicos ou de entidades culturais de utilidade pública são isentos de II, mas sofrem incidência de IPI-Importação (art. 245, I).",
    },
]

sec03_mermaid = """flowchart TD
    A["Desonerações na Importação"] --> B["Imunidades Constitucionais<br/>CF art. 150, VI: livros, entes, educação"]
    A --> C["Isenções Legais Objetivas<br/>Comprovação do emprego"]
    A --> D["Isenções Legais Subjetivas<br/>ICTs/pesquisa, diplomatas, ONU"]
    C --> E["Liberação geral do II:<br/>5 anos do registro da DI"]
    D --> F["Exceção diplomática/ONU:<br/>3 anos do registro da DI"]"""


# ==============================================================================
# SEÇÃO 04 — Hipóteses de Não Tributação da Importação
# ==============================================================================
sec04_md = """As hipóteses em que mercadorias procedentes do exterior ingressam sem exigência do Imposto de Importação dividem-se tecnicamente no Regulamento Aduaneiro (Decreto nº 6.759/2009) em **mercadoria não considerada estrangeira (art. 70)**, **não constituição de fato gerador (art. 74)** e **não incidência (art. 71)**, além das imunidades constitucionais:

### 1. Mercadoria Não Considerada Estrangeira (art. 70) e Não Fato Gerador (art. 74)

Não é considerada estrangeira (descaracterizando a incidência do II e, nas hipóteses dos incisos I a V, também do IPI-Importação, PIS/Pasep-Importação e Cofins-Importação — art. 238, § 2º, I; Lei nº 10.865/2004, art. 2º, II) a mercadoria nacional ou nacionalizada exportada que retorne ao País quando:
* **I —** enviada em consignação e **não vendida no prazo autorizado**;
* **II —** devolvida por motivo de **defeito técnico**, para reparo ou para substituição;
* **III —** por motivo de modificações na **sistemática de importação** por parte do país importador;
* **IV —** por motivo de **guerra ou de calamidade pública**; ou
* **V —** por **outros fatores alheios à vontade do exportador**.
* **VI — Pescado:** também não se considera estrangeiro o pescado capturado **fora das águas territoriais do País** por empresa localizada no Brasil, desde que satisfeitas as exigências que regulam a atividade pesqueira (art. 70, VI).
* **Retorno de Exportação Temporária (art. 74, II; art. 238, § 2º, II):** **não constitui fato gerador** do II nem do IPI o retorno de mercadoria submetida ao regime de **exportação temporária**, **ainda que descumprido o regime** (sem prejuízo das multas aplicáveis pelo descumprimento). *Cuidado:* se um bem nacional for enviado ao exterior para reparo ou serviço **sem** amparo no regime de exportação temporária, seu retorno sofrerá tributação normal.

### 2. Hipóteses Expressas de Não Incidência na Importação (art. 71)

O **Imposto de Importação não incide** sobre (com afastamento correlato do IPI-Importação, PIS/Pasep-Importação e Cofins-Importação conforme art. 237, § 1º, e art. 2º da Lei nº 10.865/2004):
* **Erro inequívoco de expedição (art. 71, I):** mercadoria estrangeira que, **corretamente descrita nos documentos de transporte**, chegar ao País por erro inequívoco ou comprovado de expedição e for redestinada ou devolvida para o exterior;
* **Reposição de mercadoria defeituosa ou imprestável (art. 71, II):** mercadoria estrangeira idêntica, em igual quantidade e valor, destinada à reposição de outra anteriormente importada que se tenha revelado, **após o desembaraço aduaneiro**, defeituosa ou imprestável para o fim a que se destinava, observada a regulamentação do Ministério da Fazenda;
* **Pena de perdimento (art. 71, III):** mercadoria estrangeira que tenha sido objeto da pena de perdimento, **exceto** na hipótese em que não seja localizada, tenha sido consumida ou revendida;
* **Devolução antes do registro da DI (art. 71, IV):** mercadoria estrangeira **devolvida para o exterior antes do registro da Declaração de Importação** (*atenção:* aplica-se **inclusive ao Imposto de Importação**, por força expressa do art. 71, IV, além de afastar o desembaraço gerador de IPI, PIS e Cofins);
* **Embarcações retornadas ao REB (art. 71, V):** embarcações construídas no Brasil e transferidas por matriz de empresa brasileira de navegação para subsidiária integral no exterior, quando restabelecidas no Registro Especial Brasileiro como propriedade da mesma empresa nacional de origem;
* **Destruição sob controle aduaneiro (art. 71, VI):** mercadoria estrangeira avariada ou imprestável que seja **destruída sob controle aduaneiro, antes de desembaraçada**, sem ônus para a Fazenda Nacional; e
* **Trânsito de passagem (art. 71, VII):** mercadoria estrangeira em trânsito aduaneiro de passagem que tenha sido **acidentalmente destruída**.

*(Nota:* as **entidades beneficentes de assistência social** que cumpram os requisitos legais — LC nº 187/2021 — gozam de **imunidade constitucional** de impostos no art. 150, VI, *c*, e de contribuições sociais no art. 195, § 7º, da CF/1988).*

---

### Imposto de Exportação (IE — Decreto-Lei nº 1.578/1977; Decreto nº 6.759/2009, arts. 212 a 227)

* **Incidência:** mercadoria **nacional ou nacionalizada** destinada ao exterior que conste em relação expedida pela **CAMEX** (art. 212, *caput* e § 2º). São isentos de IE, entre outros, o **café** (art. 218), a bagagem de viajante que se destina ao exterior (arts. 224–225, até **US\\$ 2.000,00** para outros bens levados pessoalmente com nota fiscal) e o comércio de subsistência em fronteira terrestre (art. 227).
* **Fato Gerador:**
  * *Material / espacial:* a **saída da mercadoria do território aduaneiro** (art. 213, *caput*).
  * *Temporal (para cálculo):* considera-se ocorrido na data do **registro de exportação no Siscomex** (art. 213, parágrafo único — operacionalizado no Portal Único pela **Declaração Única de Exportação — DU-E**).
* **Base de Cálculo (art. 214):** o **preço normal** que a mercadoria, ou sua similar, alcançaria, ao tempo da exportação, em venda sob livre concorrência no mercado internacional (tomando-se por referência a condição FOB / posta na fronteira), observadas as normas da CAMEX:
  * *Difícil apuração ou oscilações bruscas:* a **CAMEX** fixará critérios específicos ou estabelecerá **pauta de valor mínimo** (art. 214, § 1º);
  * *Piso legal de preço (art. 214, § 2º; DL nº 1.578/1977, art. 2º, § 3º):* o preço de venda não poderá ser inferior ao **custo de aquisição ou de produção**, acrescido dos **impostos e contribuições incidentes** e de **margem de lucro de 15%** sobre a soma dos custos mais impostos e contribuições.
* **Alíquota (art. 215):** a alíquota legal padrão é de **30%**, podendo a **CAMEX** reduzi-la (inclusive a zero) ou elevá-la para atender aos objetivos da política cambial e do comércio exterior, respeitado o **teto máximo de 150%** (CF, art. 153, § 1º).
* **Contribuinte e Pagamento (arts. 216 e 217):** contribuinte é o **exportador** (qualquer pessoa que promova a saída da mercadoria do território aduaneiro). Forma e prazo de pagamento são fixados pelo **Ministro de Estado da Fazenda**, que pode exigir o recolhimento antes da efetiva saída e, conforme normas por ele editadas (**Ministro da Fazenda**, e não CAMEX — art. 216, § 2º), **dispensar a cobrança do IE em função do destino da mercadoria**. Não efetivada a exportação ou retornando a mercadoria nas hipóteses do art. 70, I a V, compensa-se ou restitui-se o IE pago (art. 216, § 1º).

---

### Incentivos Fiscais na Exportação e Cronograma de Transição Tributária

#### Desonerações Vigentes em 2026
* **ICMS (CF, art. 155, § 2º, X, *a*):** imune nas operações que destinem mercadorias para o exterior e nos serviços prestados a destinatários no exterior, assegurada a manutenção e o aproveitamento do imposto cobrado nas operações anteriores.
* **IPI (CF, art. 153, § 3º, III):** imune sobre produtos industrializados destinados ao exterior, com manutenção de créditos.
* **Contribuições Sociais e CIDE (CF, art. 149, § 2º, I):** imunes sobre as receitas decorrentes de exportação.
* **Drawback:** regime aduaneiro especial (considerado incentivo fiscal à exportação) que suspende, isenta ou restitui tributos incidentes sobre insumos importados ou adquiridos no mercado interno empregados em produto a exportar.
* **Empresas Comerciais Exportadoras (*Tradings* — DL nº 1.248/1972; arts. 228–232):** a venda no mercado interno para *trading* com **fim específico de exportação** (remessa direta para embarque ou entreposto extraordinário) assegura ao produtor-vendedor os benefícios fiscais de exportação, transferindo-se a responsabilidade tributária à *trading* se a exportação não se efetivar em **180 dias**, houver revenda interna ou destruição.
* **Exportação sem saída do território nacional (*Exportação Ficta* — art. 233):** admitida nos casos taxativos da lei (ex.: incorporação a plataforma de petróleo/gás contratada por empresa sediada no exterior, entrega a loja franca em consignação ou a missão diplomática), mediante pagamento em moeda nacional ou estrangeira de livre conversibilidade.
* **Simples Nacional (LC nº 123/2006):** segregação das receitas de exportação de mercadorias e serviços (inclusive via comercial exportadora ou sociedade de propósito específico), desonerando parcelas de tributos sobre consumo na apuração unificada.

#### Vigência Atual vs. Regras Futuras de Transição (EC nº 132/2023 e LC nº 214/2025)
* **Em 2026 (regra vigente):** permanecem plenamente em vigor o **II, IE, IPI, PIS/Pasep, Cofins e ICMS**; corre em **2026** apenas a alíquota-teste compensável da **CBS (0,9%)** e do **IBS estadual (0,1%)** (ADCT, art. 125).
* **A partir de 1º/01/2027 (transição futura — ADCT, art. 126):** extinguem-se **PIS/Pasep e Cofins** (substituídos pela **CBS**, CF art. 195, V), entra em vigor o **Imposto Seletivo — IS** (CF, art. 153, VIII, incidente também na importação e **imune nas exportações**, § 6º, I) e as alíquotas do **IPI são reduzidas a zero**, **exceto** para produtos que tenham industrialização incentivada na **Zona Franca de Manaus**.
* **De 2029 a 2033 (transição futura — ADCT, arts. 128 e 129):** redução gradual do **ICMS** entre **2029 e 2032** e sua extinção em **1º/01/2033** pelo **IBS**, mantendo-se tanto na **CBS** quanto no **IBS** a incidência sobre importações (por PF ou PJ) e a **imunidade com manutenção de créditos nas exportações** (CF, arts. 149-B e 156-A, § 1º, II e III).

---

### IPI na Importação (Decreto nº 6.759/2009, arts. 237 a 245-A)

* **Fato Gerador (art. 238):** ocorre no **desembaraço aduaneiro** de produto industrializado de procedência estrangeira (considerando-se também ocorrido o desembaraço no **extravio** verificado pela autoridade aduaneira, inclusive sob regime suspensivo — § 1º). **Recolhimento (art. 242):** embora o fato gerador seja o desembaraço, o recolhimento ocorre por ocasião do **registro da DI**; assim, eventual alteração de alíquota entre o registro da DI e o desembaraço rege-se pela data do desembaraço, ensejando restituição ou complementação.
* **Base de Cálculo (art. 239; CTN, art. 47, I):** corresponde ao valor que servir ou que serviria de base para o cálculo do Imposto de Importação (**Valor Aduaneiro**), por ocasião do despacho aduaneiro, acrescido do montante do próprio **II** e dos **encargos cambiais** efetivamente pagos pelo importador ou dele exigíveis:

$$\\text{BC}_{\\text{IPI-Importação}} = \\text{Valor Aduaneiro} + \\text{II} + \\text{Encargos Cambiais}$$

  * *Avaria e descontos:* na ocorrência de **avaria**, exclui-se o valor depreciado dela decorrente (art. 237, § 2º, o que já reflete na redução proporcional do Valor Aduaneiro pelo art. 89); os descontos incondicionais destacados integram a valoração aduaneira segundo as regras do AVA-GATT (não compondo acréscimo tributável).
* **Alíquota (art. 240):** constantes da **TIPI**; na hipótese de **Mercadorias Não Identificadas (MNI)**, a alíquota do IPI é de **50%** (art. 240, parágrafo único).
* **Contribuinte e jurisprudência vinculante do STF (art. 241; Tema 643/STF — RE 723.651):** é contribuinte o **importador** em relação ao desembaraço aduaneiro. Pelo **Tema 643 de Repercussão Geral do STF**, **incide IPI na importação de veículo automotor por pessoa natural, ainda que não desempenhe atividade empresarial e o faça para uso próprio**.
* **Isenções (art. 245):** aplicam-se ao IPI-Importação as mesmas isenções subjetivas e objetivas do II, **exceto** quanto aos **objetos de arte recebidos em doação por museus** (alínea *p* do art. 136, II), aplicando-se também a isenção aos bens despachados sob o **RTS** e o **RTE**."""

sec04_callouts = [
    {
        "type": "warning",
        "title": "Retorno de Exportação Temporária e Devolução antes da DI",
        "text": "Não constitui fato gerador do II nem do IPI o retorno de mercadoria em Exportação Temporária, ainda que descumprido o regime (art. 74, II); sem o regime, o retorno após serviço no exterior é tributado. Já a mercadoria estrangeira devolvida antes do registro da DI tem não incidência expressa inclusive do II (art. 71, IV).",
    },
    {
        "type": "warning",
        "title": "IPI-Importação: Fato Gerador no Desembaraço e Pessoa Física",
        "text": "O fato gerador do IPI-Importação ocorre no desembaraço aduaneiro, embora o recolhimento se dê no registro da DI (arts. 238 e 242). Pelo Tema 643/STF (RE 723.651), incide IPI na importação de veículo automotor por pessoa física para uso próprio.",
    },
]

proposals = []
for sid, md, callouts, mm in [
    ("tributos-incidentes-no-comercio-exterior-sec-01", sec01_md, sec01_callouts, sec01_mermaid),
    ("tributos-incidentes-no-comercio-exterior-sec-02", sec02_md, sec02_callouts, sec02_mermaid),
    ("tributos-incidentes-no-comercio-exterior-sec-03", sec03_md, sec03_callouts, sec03_mermaid),
    ("tributos-incidentes-no-comercio-exterior-sec-04", sec04_md, sec04_callouts, None),
]:
    base = orig_by_id[sid]
    proposals.append(
        {
            "section_id": base["section_id"],
            "content_unit_id": base["content_unit_id"],
            "stable_key": base["stable_key"],
            "topic_id": base["topic_id"],
            "title": base["title"],
            "sort_order": base["sort_order"],
            "content_markdown": md,
            "callouts": callouts,
            "mnemonics": base["mnemonics"],
            "flashcards": base["flashcards"],
            "mermaid_mindmap": mm,
        }
    )

# Sanity check: ensure zero unescaped single $ outside $$...$$ in markdown and callouts
for p in proposals:
    md_no_display = p["content_markdown"]
    while "$$" in md_no_display:
        i1 = md_no_display.index("$$")
        i2 = md_no_display.index("$$", i1 + 2)
        md_no_display = md_no_display[:i1] + md_no_display[i2 + 2 :]
    for idx, ch in enumerate(md_no_display):
        if ch == "$":
            assert idx > 0 and md_no_display[idx - 1] == "\\", f"Unescaped $ in {p['section_id']} near: {md_no_display[max(0, idx-25):idx+25]}"
    for c in p["callouts"]:
        txt = c["text"]
        assert "\\$" not in txt, f"Do not escape $ in callout (no remarkMath in CalloutBlock): {txt}"

(batch_dir / "proposta.json").write_text(json.dumps(proposals, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# Save fontes.json (updated with Lei nº 15.502/2026 e Lei nº 11.898/2009 HTTP 200)
fontes = {
    "checked_on": "2026-11-28",
    "sources": [
        {
            "url": "https://www2.camara.leg.br/legin/fed/consti/1988/constituicao-1988-5-outubro-1988-322142-normaatualizada-pl.html",
            "http_status": 200,
            "use": "CF/1988 e ADCT atualizados até 2026 (incluindo EC nº 132/2023): arts. 149, § 2º, I a III, 149-B, 149-C, 150, VI, 'a' a 'e', e §§ 2º a 4º, 153, I, II, IV e VIII, e §§ 1º, 3º e 6º, 155, § 2º, IX, 'a', e X, 'a', e 156-A, § 1º, II e III; e ADCT arts. 124 a 133 (cronograma constitucional de transição tributária: CBS 0,9% e IBS 0,1% compensáveis em 2026; entrada efetiva da CBS e do Imposto Seletivo, extinção de PIS/Cofins e alíquota zero do IPI salvo ZFM em 1º/01/2027; transição do ICMS em 2029–2032 e extinção em 1º/01/2033).",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/decret/2009/decreto-6759-5-fevereiro-2009-585997-normaatualizada-pe.html",
            "http_status": 200,
            "use": "Decreto nº 6.759/2009 atualizado (incluindo Decretos nº 7.213/2010, nº 8.010/2013, nº 9.283/2018, nº 10.550/2020 e nº 11.090/2022): Livro II integral (arts. 69 a 236 — II, MNI, RTS, RTE, RTU, sujeição passiva infralegal, lançamento/pagamento/compensação/restituição/protesto, isenções/reduções, depreciação e prazos de 3 anos diplomáticos vs. 5 anos nos demais casos, similaridade, bandeira brasileira, imunidade de livros/papel, IE e incentivos fiscais na exportação), Livro III, Título I (arts. 237 a 249 — IPI-Importação) e arts. 542–545, 571 e 638.",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/declei/1960-1969/decreto-lei-37-18-novembro-1966-375637-normaatualizada-pe.html",
            "http_status": 200,
            "use": "Decreto-Lei nº 37/1966 atualizado até a LC nº 214/2025 e a LC nº 227/2026: arts. 1º a 32 (especialmente art. 31, parágrafo único, e art. 32, parágrafo único, III e IV, na redação da LC nº 227/2026) e arts. 44 a 54 (especialmente art. 44, parágrafo único, na redação da LC nº 214/2025).",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/leicom/2026/leicomplementar-227-13-janeiro-2026-798657-normaatualizada-pl.html",
            "http_status": 200,
            "use": "Lei Complementar nº 227, de 13/01/2026: art. 176 (altera os arts. 31 e 32 do Decreto-Lei nº 37/1966 quanto ao contribuinte e aos responsáveis solidários na importação por conta e ordem de terceiro e por encomenda predeterminada) e art. 182, III (eficácia desde a publicação em janeiro de 2026).",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/leicom/2025/leicomplementar-214-16-janeiro-2025-796905-normaatualizada-pl.html",
            "http_status": 200,
            "use": "Lei Complementar nº 214, de 16/01/2025 (atualizada pela LC nº 227/2026): art. 497 (parágrafo único do art. 44 do DL nº 37/1966 — confissão de dívida na DI) e art. 544, III e VI (eficácia desde 1º/01/2026 para o art. 497 e diferimento para 1º/01/2027 das alterações da CBS/IS, inclusive sobre os arts. 9º e 10 da Lei nº 11.898/2009).",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/2026/lei-15502-10-setembro-2026-799916-publicacaooriginal-181312-pl.html",
            "http_status": 200,
            "use": "Lei nº 15.502, de 10/09/2026 (lei de conversão com alterações da Medida Provisória nº 1.357, de 12/05/2026 — DOU Extra-A de 10/09/2026): altera o art. 1º (§§ 2º e 2º-B a 2º-G) e acrescenta os arts. 1º-A, 1º-B e 3º-A ao Decreto-Lei nº 1.804/1980, autorizando ato do Ministro da Fazenda a reduzir alíquotas do RTS até 0% na faixa até US$ 50,00 e até 30% até US$ 3.000,00 em função de via postal/expressa ou adesão a programa de conformidade da RFB, dispondo sobre câmbio na data da compra em plataformas habilitadas e medicamentos sem similar nacional para doenças raras/negligenciadas.",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/medpro/2026/medidaprovisoria-1357-12-maio-2026-799111-norma-pe.html",
            "http_status": 200,
            "use": "Ficha oficial de tramitação e texto original da Medida Provisória nº 1.357, de 12/05/2026, comprovando prorrogação pelo Ato do Presidente da Mesa do CN nº 55, de 03/07/2026, e encerramento da vigência provisória por conversão na Lei Ordinária nº 15.502, de 10/09/2026.",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/2024/lei-14902-27-junho-2024-795862-normaatualizada-pl.html",
            "http_status": 200,
            "use": "Lei nº 14.902, de 27/06/2024: arts. 32, 34, II, e 35 (inclusão da tabela progressiva base do § 2º-A no art. 1º e revogação do art. 2º, II, do Decreto-Lei nº 1.804/1980).",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/2009/lei-11898-8-janeiro-2009-585166-normaatualizada-pl.html",
            "http_status": 200,
            "use": "Lei nº 11.898, de 08/01/2009 atualizada (RTU — importação terrestre do Paraguai): arts. 1º a 10, especialmente art. 3º, parágrafo único (vedações), art. 7º (microempresa optante pelo Simples), art. 9º, §§ 2º e 3º (vedação de cumulação de benefícios e adesão estadual de ICMS por convênio), art. 10, caput e §§ 1º e 2º (alíquota legal original de 42,25% e autorização ao Poder Executivo para reduzi-la mediante alteração dos percentuais de II e IPI — regulamentada em 25% pelo Decreto nº 6.956/2009), e nota oficial de diferimento das alterações da LC nº 214/2025 para 2027.",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/1960-1969/lei-5172-25-outubro-1966-358971-normaatualizada-pl.html",
            "http_status": 200,
            "use": "Lei nº 5.172/1966 (CTN atualizado): arts. 19–28, 46–51, 150, § 4º, 165, 167, caput, e 179, § 2º.",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/2003/lei-10833-29-dezembro-2003-497045-normaatualizada-pl.html",
            "http_status": 200,
            "use": "Lei nº 10.833/2003 atualizada: arts. 61, 66, 67 (MNI: 50% de II e 50% de IPI sobre média por kg + 2 desvios-padrão) e 80.",
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/2010/lei-12350-20-dezembro-2010-609723-normaatualizada-pl.html",
            "http_status": 200,
            "use": "Lei nº 12.350/2010 atualizada: art. 40 (exclusão da avaria das hipóteses de lançamento por extravio nos arts. 1º, § 4º, e 25 do DL nº 37/1966).",
        },
        {
            "url": "https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/topicos/tributacao",
            "http_status": 200,
            "use": "Receita Federal do Brasil — Manual de Remessas Postal e Expressa (Tributação, atualizado em 2026): evidência complementar oficial sobre aplicação operacional da Portaria MF nº 1.342/2026 nas DIRs registradas desde 12/05/2026 no Programa Remessa Conforme para PF (0% até US$ 50,00; 60% com dedução de US$ 30,00 de US$ 50,01 a US$ 3.000,00; medicamentos PF 0% até US$ 10.000,00; e histórico de 01/08/2024 a 11/05/2026).",
        },
        {
            "url": "https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/viagens-internacionais/guia-do-viajante/entrada-no-brasil/cota-de-isencao-duty-free-e-bagagem-tributavel",
            "http_status": 200,
            "use": "Receita Federal do Brasil — Guia do Viajante (Cota de isenção, Duty Free e bagagem tributável): cotas da bagagem acompanhada (US$ 1.000,00 aérea/marítima e US$ 500,00 demais vias, a cada 30 dias) e cota adicional autônoma em Free Shop de chegada (US$ 1.000,00 aérea/marítima e US$ 500,00 terrestre).",
        },
        {
            "url": "https://portal.stf.jus.br/jurisprudenciaRepercussao/verAndamentoProcesso.asp?incidente=4307031&numeroProcesso=723651&classeProcesso=RE&numeroTema=643",
            "http_status": 200,
            "use": "Supremo Tribunal Federal — Tema 643 da Repercussão Geral (Leading Case RE 723.651, trânsito em julgado em 03/05/2019): incidência do IPI na importação de veículo automotor por pessoa natural para uso próprio.",
        },
    ],
    "limits": [
        "As páginas diretas de www.planalto.gov.br e o texto HTML dinâmico da Portaria MF nº 1.342/2026 no SIJUT2 (normas.receita.fazenda.gov.br) não foram lidos diretamente como HTML estático isolado; a verificação normativa primária apoiou-se integralmente nas páginas oficiais HTTP 200 da Câmara dos Deputados (incluindo o texto integral da Lei nº 15.502, de 10/09/2026, a ficha de conversão da MP nº 1.357/2026, a Lei nº 14.902/2024, a Lei nº 11.898/2009, a LC nº 227/2026, a LC nº 214/2025, o Decreto nº 6.759/2009, o DL nº 37/1966 e a CF/1988), no portal de Repercussão Geral do STF (Tema 643 — RE 723.651, HTTP 200) e, complementarmente para os parâmetros infralegais vigentes desde 12/05/2026 da Portaria MF nº 1.342/2026, no Manual oficial de Remessas e no Guia do Viajante da RFB em gov.br (HTTP 200).",
    ],
}
(batch_dir / "fontes.json").write_text(json.dumps(fontes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("PROPOSTA & FONTES GENERATED:", [p["section_id"] for p in proposals])
