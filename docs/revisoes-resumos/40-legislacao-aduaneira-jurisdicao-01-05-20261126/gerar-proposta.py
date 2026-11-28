import json, hashlib, pathlib

diag_dir = pathlib.Path(r"C:\PRO\revisoes-resumos\orquestracao-03-54\saneamento-onda-7\40-legislacao-aduaneira\diagnostico-jurisdicao-01-05-20261126")
batch_dir = pathlib.Path(r"C:\PRO\revisoes-resumos\orquestracao-03-54\saneamento-onda-7\40-legislacao-aduaneira\jurisdicao-01-05-20261126")
batch_dir.mkdir(parents=True, exist_ok=True)

estado = json.loads((diag_dir / "estado-atual.json").read_text(encoding="utf-8"))
orig = {s["section_id"]: s for s in estado["selected_sections"]}

def make_sec(sec_id, content_markdown, callouts, mermaid_mindmap=None):
    base = orig[sec_id]
    return {
        "section_id": base["section_id"],
        "content_unit_id": base["content_unit_id"],
        "stable_key": base["stable_key"],
        "topic_id": base["topic_id"],
        "title": base["title"],
        "sort_order": base["sort_order"],
        "content_markdown": content_markdown,
        "callouts": callouts,
        "mnemonics": base["mnemonics"],
        "flashcards": base["flashcards"],
        "mermaid_mindmap": mermaid_mindmap,
        "archived_at": None,
    }

sec01_md = """Este tópico apresenta as regras essenciais de jurisdição aduaneira.

### Território Aduaneiro
O Território Aduaneiro (TA) compreende todo o Território Nacional (art. 2º do Decreto nº 6.759/2009 — Regulamento Aduaneiro).

### Zona Primária (ZP)
A Zona Primária compreende as áreas demarcadas pela autoridade aduaneira local (ouvido o órgão ou empresa responsável pela administração do local) por onde cargas, pessoas e veículos ingressam no Território Aduaneiro ou dele saem. Ela é constituída por:
* Área terrestre ou aquática, contínua ou descontínua, nos portos alfandegados;
* Área terrestre nos aeroportos alfandegados;
* Área terrestre que compreende os pontos de fronteira alfandegados;
* Zona de Processamento de Exportação (ZPE), considerada Zona Primária para efeito de controle aduaneiro (Lei nº 11.508/2007, art. 1º, parágrafo único).

### Zona Secundária (ZS)
A Zona Secundária compreende:
* A parte restante do Território Aduaneiro;
* As Águas Territoriais;
* O Espaço Aéreo.

### Áreas de Controle Integrado (ACI)
As Áreas de Controle Integrado (ACI) são criadas em regiões limítrofes dos países integrantes do Mercosul com o Brasil (Acordo de Recife), caracterizando-se como pontos de jurisdição compartilhada.
* **Atenção:** A ACI não expande o Território Aduaneiro nacional; estende apenas a jurisdição dos serviços aduaneiros a essas áreas (art. 3º, § 5º, do Regulamento Aduaneiro).

### Jurisdição Aduaneira

#### Zona de Vigilância Aduaneira (ZVA)
A Zona de Vigilância Aduaneira (ZVA) pode ser demarcada na orla marítima ou na faixa de fronteira, onde a permanência ou a circulação de mercadorias, veículos, pessoas ou animais ficam sujeitas às exigências fiscais, proibições e restrições estabelecidas (art. 4º do Regulamento Aduaneiro).
* **a) Cuidado:** A ZVA integra a Zona Secundária e não se confunde com a Zona Primária.
* **b)** O ato de demarcação, de competência do Ministro de Estado da Fazenda, poderá ser geral ou específico em relação a determinados segmentos da orla marítima ou da faixa de fronteira, estabelecer medidas específicas para determinado local e ter vigência temporária.
* **c)** A ZVA compreende a totalidade do Município atravessado pela linha de demarcação, ainda que parte dele fique fora da área demarcada.

#### Portos, Aeroportos e Pontos de Fronteira Alfandegados – PAPF
Os PAPF são alfandegados por meio de ato declaratório da autoridade aduaneira competente para que neles possam ocorrer, sob controle aduaneiro, as seguintes atividades (art. 5º do Regulamento Aduaneiro):
* Estacionamento ou trânsito de veículos procedentes do exterior ou a ele destinados;
* Carga, descarga, armazenagem ou passagem de mercadorias procedentes do exterior ou a ele destinadas;
* Embarque, desembarque ou trânsito de viajantes procedentes do exterior ou a ele destinados (sujeitos ao controle aduaneiro quanto a bens e bagagens pela Receita Federal do Brasil — RFB, sem prejuízo das atribuições de polícia marítima, aeroportuária e de fronteiras da Polícia Federal, conforme art. 144, § 1º, III, da CF/1988).

### Administração Aduaneira
Conforme estabelece o art. 237 da Constituição Federal de 1988 (CF/88), a fiscalização e o controle sobre o comércio exterior, essenciais à defesa dos interesses fazendários nacionais, serão exercidos pelo Ministério da Fazenda em todo o território aduaneiro (art. 15 do Regulamento Aduaneiro). Enquanto a jurisdição e a sujeição ao controle aduaneiro são permanentes em todo o território aduaneiro, a fiscalização aduaneira presencial nos PAPF e recintos alfandegados poderá ser exercida de forma **ininterrupta, em horários determinados ou eventual** (art. 16 do Regulamento Aduaneiro).

### Alfandegamento
O alfandegamento consiste no ato declaratório emitido pela Secretaria Especial da Receita Federal do Brasil (RFB) que autoriza a realização das operações aduaneiras em determinado local ou recinto, fixando os termos, limites e condições para sua execução.

Para que o alfandegamento de PAPF (e, no que couber, de recintos de Zona Primária e Secundária) seja efetivado, devem ser observados os seguintes requisitos (arts. 6º e 13 do Regulamento Aduaneiro):
* **Habilitação prévia:** Nos PAPF, o alfandegamento será precedido da respectiva habilitação ao tráfego internacional pelas autoridades competentes em matéria de transporte (que notificarão a RFB ao iniciar o processo).
* **Infraestrutura:** Atendimento às condições de instalação do órgão de fiscalização aduaneira e de infraestrutura indispensável à segurança fiscal (incluídos os requisitos técnicos e operacionais definidos pela RFB, como segregação física, balanças, inspeção não invasiva e monitoramento eletrônico remoto, podendo a RFB dispensar requisito conforme as características do local — art. 13-A).
* **Regularidade fiscal:** Comprovação da regularidade fiscal do interessado.
* **Recursos:** Disponibilidade de recursos humanos e materiais.
* **Fiel depositário:** Assunção, pelo interessado, da condição de fiel depositário da mercadoria sob sua guarda.
* **Licitação (quando aplicável):** Tratando-se de **permissão ou concessão de serviços públicos**, o alfandegamento somente poderá ser efetivado após a conclusão do devido procedimento licitatório pelo órgão competente e o cumprimento das condições contratuais (art. 13, § 2º).

Como regra geral, a entrada ou a saída de mercadorias procedentes do exterior ou a ele destinadas somente poderá efetuar-se em PAPF alfandegados. Essa exigência não se aplica à importação e à exportação de mercadorias conduzidas por **linhas de transmissão ou por dutos** ligados ao exterior, nem a outros casos estabelecidos em ato normativo da RFB (art. 8º, parágrafo único).

### Recintos Alfandegados
Os recintos alfandegados são declarados pela autoridade aduaneira competente, na Zona Primária (ZP) ou na Zona Secundária (ZS), para que neles possam ocorrer, sob controle aduaneiro, movimentação, armazenagem e despacho aduaneiro de mercadorias procedentes do exterior ou a ele destinadas (inclusive sob regime aduaneiro especial), bagagem de viajantes e remessas postais internacionais (art. 9º). Poderão ainda ser alfandegados, em **Zona Primária**, recintos destinados à instalação de **lojas francas** (art. 9º, parágrafo único), bem como silos ou tanques contíguos a portos ligados por tubulações ou esteiras permanentes (art. 13, § 4º).

* **Descumprimento de Requisitos Técnicos e Operacionais:** Sujeita a pessoa jurídica administradora do local ou recinto às sanções administrativas de **advertência** e, na hipótese de reincidência na mesma conduta em **365 dias** (ou não saneamento nos prazos da Lei nº 12.350/2010, art. 37, § 1º), de **suspensão** das atividades aduaneiras até a regularização, além da **multa de R$ 10.000,00 por dia** pelo descumprimento ou cumprimento intempestivo (arts. 728, III, *b*, e 735-C do Regulamento Aduaneiro; Lei nº 12.350/2010, arts. 37 e 38). O recolhimento da multa não garante o direito à operação regular do local ou recinto nem prejudica a aplicação das sanções administrativas, de outras penalidades cabíveis ou da representação fiscal para fins penais.

#### Porto Seco
Os portos secos são recintos alfandegados de **uso público** nos quais são executadas operações de movimentação, armazenagem e despacho aduaneiro de mercadorias e de bagagem, sob controle aduaneiro (arts. 11 e 12 do Regulamento Aduaneiro; Lei nº 9.074/1995, art. 1º, VI; IN RFB nº 2.111/2022):
* **Localização:** Não poderão ser instalados na Zona Primária (ZP) de portos e aeroportos alfandegados, sendo admitidos na Zona Secundária ou em pontos de fronteira.
* **Permissão (regra geral):** Adotada quando os serviços forem prestados em imóvel que não pertença à União, precedida de licitação.
* **Concessão (imóvel da União):** Adotada quando o porto seco for instalado em imóvel pertencente à União, precedida de licitação e da execução de obra pública.
* **Prazo de outorga:** Até **25 anos**, prorrogável por até **10 anos** (Lei nº 9.074/1995, art. 1º, § 2º; na ADI 3.497, o STF fixou que tais prazos configuram limites máximos em contratos precedidos de licitação, vedada a prorrogação automática)."""

sec01_callouts = [
    {
        "text": "A jurisdição aduaneira alcança permanentemente todo o território aduaneiro, enquanto a fiscalização presencial nos PAPF e recintos alfandegados pode ser exercida de forma ininterrupta, em horários determinados pela administração ou eventual.",
        "type": "warning",
        "title": "Controle Permanente e Modalidades de Fiscalização"
    },
    {
        "text": "Os portos secos nunca poderão ser instalados na Zona Primária de portos e aeroportos alfandegados, sendo admitidos na Zona Secundária ou em pontos de fronteira mediante licitação (permissão em imóvel de terceiros ou concessão precedida de obra pública em imóvel da União).",
        "type": "warning",
        "title": "Localização e Outorga do Porto Seco"
    },
    {
        "text": "A entrada ou saída de mercadorias fora de PAPF alfandegado é admitida para mercadorias conduzidas por linhas de transmissão ou dutos ligados ao exterior e em outros casos fixados em ato normativo da RFB.",
        "type": "info",
        "title": "Exceção ao Ingresso por PAPF Alfandegado"
    }
]

sec01_mermaid = """flowchart TB
    RA["Recintos Alfandegados<br/>(ZP ou ZS)"]
    ZP["Zona Primária:<br/>Portos, Aeroportos, Fronteiras<br/>e Lojas Francas"]
    PS["Porto Seco<br/>(Uso Público · Licitação)"]
    RA --> ZP
    RA --> PS
    LOC["Localização:<br/>Vedado na ZP de Portos/Aeroportos;<br/>Admitido em ZS ou Fronteira"]
    CONC["Imóvel da União:<br/>Concessão + Obra Pública"]
    PERM["Imóvel Não da União:<br/>Permissão"]
    PS --> LOC
    PS --> CONC
    PS --> PERM"""

sec02_md = """As atividades de fiscalização dos tributos incidentes sobre as operações de comércio exterior são supervisionadas e executadas privativamente por Auditor-Fiscal da Receita Federal do Brasil — AFRFB (art. 15, parágrafo único, do Decreto nº 6.759/2009).

Nos Portos, Aeroportos e Pontos de Fronteira (PAPF) e nos recintos alfandegados, a fiscalização aduaneira poderá ser exercida de três formas (art. 16 do Regulamento Aduaneiro; Decreto-Lei nº 37/1966, art. 36):
1. **Ininterrupta**: exercida de maneira contínua (como em unidades e setores com operação permanente de **24 horas**);
2. **Em horários determinados**: **a administração aduaneira determinará unilateralmente** os horários e as condições de realização dos serviços aduaneiros nos locais e recintos (não se trata de acordo negocial com o depositário; o atendimento solicitado fora do expediente normal configura **serviço extraordinário**, devendo o interessado ressarcir a Administração pelas despesas decorrentes — art. 16, §§ 1º e 2º);
3. **Eventual**: exercida de modo não contínuo ou esporádico nos locais e recintos conforme o movimento ou interesse fiscal (sem se confundir exclusivamente com a revisão aduaneira pós-desembaraço prevista no art. 638).

Nas áreas de portos, aeroportos, pontos de fronteira e recintos alfandegados, bem como em outras áreas nas quais se autorize carga e descarga de mercadorias ou embarque e desembarque de viajante procedentes do exterior ou a ele destinados, a autoridade aduaneira tem **precedência** sobre as demais autoridades que ali exerçam suas atribuições (art. 17). Essa precedência aplica-se igualmente à **Zona de Vigilância Aduaneira (ZVA)** (devendo as demais autoridades prestar a colaboração solicitada) e implica:
1. A obrigação, por parte das demais autoridades, de prestar **auxílio imediato** sempre que requisitado pela autoridade aduaneira, disponibilizando pessoas, equipamentos ou instalações necessários à ação fiscal;
2. A competência da autoridade aduaneira, sem prejuízo das atribuições de outras autoridades, para disciplinar a entrada, a permanência, a movimentação e a **saída** de pessoas, veículos, **unidades de carga** e mercadorias naqueles locais, no que interessar à Fazenda Nacional.

Quanto à guarda de documentos e registros, o importador, o exportador ou o **adquirente de mercadoria importada por sua conta e ordem** (estendendo-se, na forma disciplinada pela RFB, ao despachante aduaneiro, transportador, agente de carga, depositário e demais intervenientes — arts. 18 e 21 do Regulamento Aduaneiro; Lei nº 10.833/2003, arts. 70 e 71; CTN, art. 195, parágrafo único) devem:
1. Manter em boa guarda e ordem os documentos relativos às transações realizadas (instrução das declarações, correspondência comercial, contratos, registros contábeis e documentos fiscais) pelo **prazo decadencial** estabelecido na legislação tributária (comunicando à RFB em até **48 horas** eventual perda por incêndio, furto, roubo ou outro sinistro, instruída com registro da ocorrência);
2. Conservar os livros obrigatórios de escrituração comercial e fiscal e os comprovantes dos lançamentos neles efetuados até que ocorra a **prescrição** dos créditos tributários decorrentes das operações a que se refiram."""

sec02_callouts = [
    {
        "text": "A autoridade aduaneira tem precedência sobre as demais autoridades nos PAPF, recintos alfandegados, áreas autorizadas de carga/viajantes e na ZVA, cabendo à administração aduaneira fixar os horários dos serviços (com ressarcimento se houver serviço extraordinário).",
        "type": "warning",
        "title": "Precedência e Fixação Unilateral de Horários"
    },
    {
        "text": "Os documentos relativos às transações de comércio exterior devem ser mantidos pelo prazo decadencial (com comunicação em 48 horas em caso de sinistro), enquanto os livros obrigatórios e comprovantes de lançamentos devem ser conservados até a prescrição dos créditos tributários.",
        "type": "info",
        "title": "Prazos Diferenciados de Guarda"
    }
]

sec03_md = """A entrada ou a saída de veículos procedentes do exterior ou a ele destinados só poderá ocorrer em porto, aeroporto ou ponto de fronteira (PAPF) alfandegado (art. 26 do Decreto nº 6.759/2009).
* **Excepcionalmente**: o **titular da unidade aduaneira jurisdicionante** poderá autorizar a entrada ou a saída de veículos por PAPF não alfandegado, em casos justificados (art. 26, § 2º);
* **Abrangência**: o controle aduaneiro do veículo será exercido desde o seu ingresso no território aduaneiro até a sua efetiva saída, estendendo-se a mercadorias e a outros bens existentes a bordo, inclusive a bagagens de viajantes (art. 26, § 1º);
* **Acompanhamento**: quando conveniente aos interesses da Fazenda Nacional, a autoridade aduaneira poderá determinar o acompanhamento fiscal do veículo pelo território aduaneiro (art. 30).

As normas de controle aduaneiro de veículos (Título II do Livro I) aplicam-se também aos **veículos militares, quando utilizados no transporte de mercadoria** (art. 67 do Regulamento Aduaneiro; Decreto-Lei nº 37/1966, art. 43).

### Proibições ao Condutor e Pena de Perdimento do Veículo
Aos condutores de veículos procedentes do exterior ou a ele destinados é **proibido** (arts. 27 e 28):
* Estacionar ou efetuar operações de carga ou descarga de mercadoria, inclusive transbordo, fora de local habilitado;
* Trafegar no território aduaneiro em situação ilegal quanto às normas reguladoras do transporte internacional correspondente à sua espécie;
* Desviá-lo da rota estabelecida pela autoridade aduaneira, sem motivo justificado (observando-se que a proposição de rota alternativa pelo beneficiário pertence ao regime de trânsito aduaneiro — art. 329, § 1º);
* Colocar o veículo nas proximidades de outro, sendo um deles procedente do exterior ou a ele destinado, de modo a tornar possível o transbordo de pessoa ou mercadoria, sem observância das normas de controle aduaneiro.

Configuram dano ao Erário punível especificamente com a **pena de perdimento do veículo** as hipóteses taxativas do art. 688 do Regulamento Aduaneiro (art. 104 do Decreto-Lei nº 37/1966), destacando-se:
* **Situação ilegal de transporte (inc. I):** veículo transportador em situação ilegal quanto às normas que o habilitem a exercer a navegação ou o transporte internacional correspondente à sua espécie;
* **Carga ou descarga fora de local habilitado (inc. II):** efetuar operação de descarga de mercadoria estrangeira ou de carga de mercadoria nacional ou nacionalizada fora de porto, aeroporto ou outro local habilitado (não bastando o simples estacionamento isolado sem operação proibida);
* **Aproximação para transbordo irregular (inc. III):** atracar embarcação a navio ou colocar qualquer veículo, **na Zona Primária**, nas proximidades de outro, sendo um deles procedente do exterior ou a ele destinado, de modo a tornar possível o transbordo de pessoa ou de carga sem observância das normas legais e regulamentares;
* **Desvio de rota no trânsito terrestre (inc. VI):** quando o **veículo terrestre utilizado no trânsito de mercadoria estrangeira** for desviado de sua rota legal sem motivo justificado;
* **Condução de mercadoria sujeita a perdimento (inc. V):** quando o veículo conduzir mercadoria sujeita a perdimento, se pertencente ao responsável por infração punível com essa penalidade, exigindo-se a demonstração, em procedimento regular, da responsabilidade do proprietário do veículo na prática do ilícito (art. 688, § 2º; Súmula 138 do extinto TFR). Nos casos dos incisos II, III e VI, aplica-se cumulativamente o **perdimento da mercadoria** (art. 688, § 1º).

### Exceções à Proibição de Aproximação para Transbordo
Excetuam-se da proibição de colocação do veículo nas proximidades de outro (art. 28, parágrafo único) os veículos:
1. De guerra, salvo se utilizados no transporte comercial;
2. Das repartições públicas, em serviço;
3. Autorizados para utilização em **operações portuárias ou aeroportuárias**, inclusive de transporte de passageiros e tripulantes;
4. Que estejam prestando ou recebendo socorro."""

sec03_callouts = [
    {
        "text": "O perdimento do veículo exige enquadramento estrito no art. 688 do Regulamento Aduaneiro: aplica-se, por exemplo, à carga ou descarga fora de local habilitado, à aproximação irregular na Zona Primária e ao desvio injustificado de rota de veículo terrestre em trânsito de mercadoria estrangeira (cumulado com o perdimento da mercadoria).",
        "type": "warning",
        "title": "Hipóteses Estritas de Perdimento do Veículo"
    },
    {
        "text": "Pelo art. 67 do Regulamento Aduaneiro (art. 43 do DL nº 37/1966), as regras do controle aduaneiro de veículos aplicam-se também aos veículos militares especificamente quando utilizados no transporte de mercadoria.",
        "type": "info",
        "title": "Veículos Militares no Transporte de Mercadoria"
    }
]

sec04_md = """O conhecimento de carga (ou conhecimento de embarque) possui as seguintes características e funções na legislação aduaneira (arts. 42, § 2º, e 554 a 556 do Decreto nº 6.759/2009):
* Instrumenta o contrato de transporte internacional, podendo assumir forma única ou desdobrar-se em conhecimentos agregados/desconsolidados (*master* e *house* nas cargas consolidadas por agente de carga — art. 31, § 2º); para fins fiscais, a cada conhecimento de carga deverá corresponder uma única Declaração de Importação, salvo exceções estabelecidas pela RFB (art. 555);
* O conhecimento de carga **original**, ou documento de efeito equivalente, constitui prova de **posse ou de propriedade** da mercadoria (art. 554, *caput*);
* Deve identificar obrigatoriamente a **unidade de carga** em que a mercadoria por ele amparada esteja contida (art. 42, § 2º).

### Correção do Conhecimento de Carga
Para efeitos fiscais, qualquer correção no conhecimento de carga deverá ser feita por **carta de correção** dirigida pelo emitente do conhecimento à **autoridade aduaneira do local de descarga**, a qual, se aceita, **implicará correção do manifesto** (art. 46 do Regulamento Aduaneiro):
* **Antes do início do despacho aduaneiro**: a carta de correção deverá ser apresentada acompanhada do conhecimento objeto da correção (art. 46, § 1º);
* **Após o início do despacho até o desembaraço**: a carta de correção poderá ainda ser apreciada, a critério da autoridade aduaneira, e **não implica denúncia espontânea** (art. 46, § 2º);
* **Exame de mérito e via eletrônica**: a observância dos prazos acima **não elide o exame de mérito** do pleito pela autoridade aduaneira para fins de aceitação (art. 46, § 3º), podendo os procedimentos de correção do conhecimento ser efetuados **de forma eletrônica**, conforme disciplinado pela RFB (art. 46, § 4º, incluído pelo Decreto nº 10.550/2020)."""

sec04_callouts = [
    {
        "text": "A carta de correção apresentada após o início do despacho aduaneiro e até o desembaraço pode ser apreciada a critério da autoridade aduaneira (sem afastar o exame de mérito), mas não configura denúncia espontânea.",
        "type": "warning",
        "title": "Carta de Correção e Ausência de Denúncia Espontânea"
    }
]

sec05_md = """### Manifesto de Carga
A mercadoria procedente do exterior, transportada por qualquer via, será registrada em manifesto de carga ou em outras declarações de efeito equivalente, reunindo os conhecimentos da viagem (Dica: *MANYfesto* — arts. 41 e 44 do Decreto nº 6.759/2009). No caso de divergência entre o manifesto e o conhecimento, **prevalecerá o conhecimento**, podendo a correção do manifesto ser feita **de ofício** (art. 47).

O responsável pelo veículo apresentará à autoridade aduaneira, na forma e no momento estabelecidos pela RFB, o manifesto de carga com cópia dos conhecimentos correspondentes e a lista de sobressalentes e provisões de bordo. Se for o caso, apresentará também relação das unidades de carga vazias existentes a bordo, declaração de acréscimo de volume ou mercadoria em relação ao manifesto e outras declarações de seu interesse (art. 42, *caput* e § 1º).

**Para cada ponto de descarga no território aduaneiro**, o veículo deverá trazer tantos manifestos quantos forem os locais, no exterior, em que tiver recebido carga; a não apresentação de manifesto ou declaração equivalente em relação a qualquer ponto de escala no exterior será considerada **declaração negativa de carga** (art. 43).

**Se objeto de conhecimento regularmente emitido**, a omissão de volume em manifesto de carga poderá ser suprida mediante a apresentação da mercadoria sob declaração escrita do responsável pelo veículo, **anteriormente ao conhecimento da irregularidade pela autoridade aduaneira** (art. 48). Para efeitos fiscais, não serão consideradas no manifesto ressalvas que visem a excluir a responsabilidade do transportador por extravios ou acréscimos (art. 49).

#### Conferência Final do Manifesto
Destina-se a constatar **extravio** (falta) ou **acréscimo** (excesso) de volume ou de mercadoria entrada no território aduaneiro, mediante confronto do manifesto com os registros, informatizados ou não, de descarga ou armazenamento (arts. 53, 649 e 658). Não se confunde com **avaria**, que consiste em qualquer prejuízo sofrido pela mercadoria ou por seu envoltório (art. 649, I).

#### Fluxo de Informações, Descarga e Custódia
1. O transportador (assim como o agente de carga e o operador portuário, nas operações que executem) presta à RFB, na forma e no prazo por ela estabelecidos, as informações sobre as cargas transportadas e a chegada do veículo (art. 31);
2. Prestadas as informações e ocorrida a efetiva chegada do veículo ao País, é emitido o respectivo **termo de entrada** (art. 32, *caput*);
3. Nas **embarcações procedentes do exterior**, as operações de carga, descarga ou transbordo somente poderão ser executadas depois de prestadas as informações referidas no art. 31 (art. 32, parágrafo único);
4. A mercadoria descarregada será registrada pelo transportador (ou seu representante) e pelo depositário, na forma e no prazo estabelecidos pela RFB (art. 63, *caput*).

* **Avaria na descarga:** O volume que, ao ser descarregado, apresentar-se quebrado, com diferença de peso, com indícios de violação ou de qualquer modo avariado deverá ser objeto de **conserto e pesagem**, fazendo-se, ato contínuo, a devida anotação no registro de descarga pelo depositário (art. 63, § 1º).
* **Atenção:** A autoridade aduaneira poderá determinar a aplicação de cautelas fiscais e o isolamento dos volumes em local próprio do recinto alfandegado, inclusive nos casos de extravio ou avaria (art. 63, § 2º).

#### Busca em Veículos
A autoridade aduaneira poderá proceder a buscas em qualquer veículo para prevenir e reprimir a ocorrência de infração à legislação aduaneira, **inclusive em momento anterior à prestação das informações** de carga/chegada, devendo a busca ser precedida de comunicação, **verbal ou por escrito**, ao responsável pelo veículo (art. 34, *caput* e § 1º). Havendo indícios de falsa declaração de conteúdo, a autoridade aduaneira poderá determinar a descarga **de volume ou de unidade de carga**, para a devida verificação, **lavrando-se termo** (art. 36).

### Disposições Finais
O veículo será tomado como **garantia dos débitos fiscais**, inclusive os decorrentes de multas que sejam aplicadas ao transportador ou ao seu condutor (art. 64, *caput*).

Enquanto não concluídos os procedimentos fiscais destinados a verificar a existência de eventuais débitos para com a Fazenda Nacional, a autoridade aduaneira poderá permitir a saída do veículo, mediante **termo de responsabilidade firmado pelo representante do transportador, no País** (art. 64, § 1º).

O responsável por **embarcação de recreio, aeronave particular ou veículo de competição** que entrar no País por seus próprios meios deverá apresentar-se **à unidade aduaneira do local habilitado de entrada, no prazo de 24 horas**, para a adoção dos procedimentos aduaneiros pertinentes (art. 66)."""

sec05_callouts = [
    {
        "text": "Havendo divergência entre o Manifesto de Carga e o Conhecimento de Carga, prevalecerá o Conhecimento, podendo a correção do Manifesto ser feita de ofício pela autoridade aduaneira.",
        "type": "warning",
        "title": "Prevalência em Divergências"
    },
    {
        "text": "O responsável por embarcação de recreio, aeronave particular ou veículo de competição que entrar no País por seus próprios meios deverá apresentar-se à unidade aduaneira do local habilitado de entrada no prazo de 24 horas.",
        "type": "warning",
        "title": "Prazo de Apresentação Obrigatória (24 Horas)"
    },
    {
        "text": "O próprio veículo transportador é tomado legalmente como garantia dos débitos fiscais, inclusive multas aplicadas ao transportador ou condutor, podendo sair antes da conclusão fiscal mediante termo de responsabilidade firmado pelo representante do transportador no País.",
        "type": "info",
        "title": "Veículo como Garantia e Saída Mediante Termo"
    }
]

proposta = [
    make_sec("jurisdicao-aduaneira-sec-01", sec01_md, sec01_callouts, sec01_mermaid),
    make_sec("jurisdicao-aduaneira-sec-02", sec02_md, sec02_callouts, None),
    make_sec("jurisdicao-aduaneira-sec-03", sec03_md, sec03_callouts, None),
    make_sec("jurisdicao-aduaneira-sec-04", sec04_md, sec04_callouts, None),
    make_sec("jurisdicao-aduaneira-sec-05", sec05_md, sec05_callouts, None),
]

(batch_dir / "proposta.json").write_text(json.dumps(proposta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

achados = {
    "checked_on": "2026-11-26",
    "scope": [s["section_id"] for s in proposta],
    "topic_id": "jurisdicao-aduaneira",
    "topic_title": "Jurisdição Aduaneira",
    "independent_confirmation": True,
    "sections": [
        {
            "section_id": "jurisdicao-aduaneira-sec-01",
            "disposition": "corrigida",
            "applied_corrections": [
                "Harmonizada a distinção entre jurisdição/sujeição permanente ao controle aduaneiro em todo o território aduaneiro (CF/88, art. 237; Decreto nº 6.759/2009, art. 15) e as modalidades legais de exercício da fiscalização presencial nos PAPF e recintos alfandegados — ininterrupta, em horários determinados ou eventual (art. 16), eliminando a contradição entre o texto/Callout 1 da seção 01 e a seção 02.",
                "Delimitada a exigência de conclusão prévia de procedimento licitatório e cumprimento contratual aos casos de permissão ou concessão de serviços públicos (art. 13, § 2º, do Decreto nº 6.759/2009), detalhando também os requisitos técnicos/operacionais e possibilidade de dispensa motivada pela RFB (art. 13-A).",
                "Corrigido o regime sancionador por descumprimento de requisitos técnicos e operacionais de recintos alfandegados: advertência, suspensão na reincidência em 365 dias (ou não saneamento nos prazos legais) e multa de R$ 10.000,00/dia (Decreto nº 6.759/2009, arts. 728, III, 'b', e 735-C; Lei nº 12.350/2010, arts. 37 e 38).",
                "Deslocada a referência às lojas francas para recinto alfandegado em Zona Primária (art. 9º, parágrafo único), precisada a 'área terrestre' dos pontos de fronteira (art. 3º, I, 'c'), incluídos 'animais', medidas locais e vigência temporária na ZVA (art. 4º, caput e § 1º), qualificado o controle aduaneiro de bens/bagagens de viajantes nos PAPF sem prejuízo da competência da Polícia Federal (art. 5º, III; CF/88, art. 144, § 1º, III) e acrescentado o prazo máximo de até 25 anos prorrogável por até 10 anos dos portos secos precedidos de licitação, sem prorrogação automática (Lei nº 9.074/1995, art. 1º, VI e § 2º; ADI 3.497/STF).",
                "Reestruturado o mapa Mermaid ('Recintos Alfandegados') em árvore ramificada (Zona Primária vs. Porto Seco, com ramos independentes para localização, concessão precedida de obra pública em imóvel da União e permissão em imóvel não pertencente à União), removendo o falso encadeamento linear entre Concessão e Permissão e comandos class legados."
            ],
            "preserved_elements": [
                "Equivalência entre Território Aduaneiro e Território Nacional (art. 2º); ZPE como Zona Primária para controle aduaneiro (art. 3º, § 1º; Lei nº 11.508/2007, art. 1º, parágrafo único); Águas Territoriais e Espaço Aéreo na Zona Secundária (art. 3º, II); extensão da jurisdição às ACIs sem ampliar o território nacional (art. 3º, § 5º); abrangência integral do Município atravessado na ZVA (art. 4º, § 3º); exceção de linhas de transmissão e dutos ligados ao exterior (art. 8º, parágrafo único); e vedação de porto seco na ZP de portos e aeroportos alfandegados (art. 11, § 1º)."
            ]
        },
        {
            "section_id": "jurisdicao-aduaneira-sec-02",
            "disposition": "corrigida",
            "applied_corrections": [
                "Corrigido erro material em 'Horários determinados': substituída a afirmação de acordo/combinação prévia entre AFRFB e depositário pela determinação unilateral dos horários e condições pela administração aduaneira, com ressarcimento pelo interessado no atendimento extraordinário fora do expediente normal (art. 16, §§ 1º e 2º, do Decreto nº 6.759/2009; DL nº 37/1966, art. 36, §§ 1º e 2º).",
                "Corrigida a definição de fiscalização 'Eventual' como atuação não contínua/esporádica nos locais e recintos conforme movimento ou interesse fiscal, diferenciando-a da revisão aduaneira pós-desembaraço do art. 638.",
                "Explicitações de completude legal: supervisão e execução privativa por AFRFB na fiscalização de tributos sobre comércio exterior (art. 15, parágrafo único); alcance da precedência aduaneira a outras áreas autorizadas, saída e unidades de carga (art. 17, caput e §§ 1º e 2º); especificação do 'adquirente de mercadoria importada por sua conta e ordem', extensão aos demais intervenientes e dever de comunicação à RFB em até 48 horas em caso de sinistro (art. 18, caput e §§ 2º e 5º; Lei nº 10.833/2003, arts. 70 e 71)."
            ],
            "preserved_elements": [
                "Precedência da autoridade aduaneira com obrigação de auxílio imediato nos PAPF/recintos e colaboração na ZVA (art. 17) e distinção entre prazo decadencial para documentos das transações (art. 18) e prazo prescricional para conservação dos livros obrigatórios e comprovantes de lançamentos (art. 21, parágrafo único; CTN, art. 195, parágrafo único)."
            ]
        },
        {
            "section_id": "jurisdicao-aduaneira-sec-03",
            "disposition": "corrigida",
            "applied_corrections": [
                "Corrigidos texto e Callout 2 quanto aos veículos militares e chefes de Estado: conforme o art. 67 do Decreto nº 6.759/2009 (art. 43 do DL nº 37/1966), as normas do Título II aplicam-se aos veículos militares especificamente 'quando utilizados no transporte de mercadoria', removendo a generalização irrestrita sem amparo no dispositivo.",
                "Separadas com precisão as proibições gerais ao condutor (arts. 27 e 28) das hipóteses taxativas de pena de perdimento do veículo por dano ao Erário (art. 688 do Decreto nº 6.759/2009; art. 104 do DL nº 37/1966) no texto e no Callout 1: (i) situação ilegal de transporte internacional (inc. I); (ii) operação de descarga de mercadoria estrangeira ou carga de nacional/nacionalizada fora de local habilitado, e não simples estacionamento isolado (inc. II); (iii) atracação ou aproximação na Zona Primária envolvendo veículo procedente do exterior ou a ele destinado (inc. III); (iv) desvio injustificado de rota restrito ao veículo terrestre utilizado no trânsito de mercadoria estrangeira, esclarecendo que a rota alternativa proposta por beneficiário pertence ao trânsito aduaneiro do art. 329, § 1º (inc. VI); (v) condução de mercadoria sujeita a perdimento com demonstração da responsabilidade do proprietário em procedimento regular (inc. V e § 2º; Súmula 138/TFR); e (vi) perdimento cumulativo da mercadoria nos incisos II, III e VI (art. 688, § 1º).",
                "Corrigida a redação das exceções do art. 28, parágrafo único (exceções à proibição de aproximação para transbordo de pessoa ou mercadoria, e não 'transbordo de veículos', especificando 'operações portuárias ou aeroportuárias' no item 3) e indicada a competência do titular da unidade aduaneira jurisdicionante no art. 26, § 2º."
            ],
            "preserved_elements": [
                "Regra de ingresso/saída por PAPF alfandegado, extensão do controle desde o ingresso até a efetiva saída sobre veículo, mercadorias, bens a bordo e bagagens (art. 26, caput e § 1º), acompanhamento fiscal (art. 30) e os quatro incisos de exceção do art. 28, parágrafo único."
            ]
        },
        {
            "section_id": "jurisdicao-aduaneira-sec-04",
            "disposition": "corrigida",
            "applied_corrections": [
                "Qualificada a relação entre conhecimento de carga e contrato de transporte diante de conhecimentos agregados/desconsolidados (master/house em cargas consolidadas por agente de carga — art. 31, § 2º) e da regra fiscal de uma DI por conhecimento salvo exceções da RFB (art. 555), explicitando que constitui prova de posse ou propriedade o conhecimento 'original, ou documento de efeito equivalente' (art. 554, caput).",
                "Completados os requisitos da carta de correção no art. 46 do Decreto nº 6.759/2009: endereçamento à autoridade aduaneira do local de descarga e efeito corretivo sobre o manifesto se aceita (caput), manutenção do exame de mérito pela autoridade aduaneira (§ 3º, refletido também no Callout 1) e possibilidade de realização de forma eletrônica conforme disciplinado pela RFB (§ 4º, incluído pelo Decreto nº 10.550/2020)."
            ],
            "preserved_elements": [
                "Identificação obrigatória da unidade de carga (art. 42, § 2º), apresentação antes do início do despacho acompanhada do conhecimento (§ 1º) e ausência de denúncia espontânea na apresentação após o início do despacho até o desembaraço (§ 2º)."
            ]
        },
        {
            "section_id": "jurisdicao-aduaneira-sec-05",
            "disposition": "corrigida",
            "applied_corrections": [
                "Desfeita na Conferência Final a equiparação indevida entre extravio/acréscimo e avaria, distinguindo extravio (falta) e acréscimo (excesso) apurados no confronto do manifesto (arts. 53, 649, II e III, e 658) de avaria enquanto prejuízo sofrido pela mercadoria ou seu envoltório (art. 649, I; art. 63, § 1º).",
                "Acrescentado no suprimento espontâneo da omissão de volume em manifesto o requisito legal indispensável 'Se objeto de conhecimento regularmente emitido' (art. 48) e a ineficácia fiscal de ressalvas excludentes de responsabilidade (art. 49).",
                "Removido do Callout 2 o adjetivo extrapolado 'improrrogável' (ausente do art. 66 do Decreto nº 6.759/2009) e precisado no texto e no Callout 2 o comparecimento 'à unidade aduaneira do local habilitado de entrada, no prazo de 24 horas'.",
                "Precisados os dispositivos sobre pluralidade de manifestos 'para cada ponto de descarga no território aduaneiro' (art. 43), prestação de informações também por agente de carga e operador portuário e restrição literal de carga/descarga/transbordo em embarcações procedentes do exterior antes das informações do art. 31 (arts. 31 e 32, parágrafo único), descarga 'de volume ou de unidade de carga, para a devida verificação, lavrando-se termo' na suspeita de falsa declaração (art. 36) e assinatura do termo de responsabilidade 'pelo representante do transportador, no País' na saída antecipada do veículo (art. 64, § 1º, refletido também no Callout 3)."
            ],
            "preserved_elements": [
                "Prevalência do conhecimento sobre o manifesto com possibilidade de correção de ofício do manifesto (art. 47 e Callout 1), documentos apresentados pelo responsável pelo veículo (art. 42), declaração negativa de carga (art. 43, parágrafo único), conserto/pesagem/anotação de avaria e cautelas/isolamento (art. 63, §§ 1º e 2º), busca aduaneira precedida de comunicação verbal ou escrita inclusive antes das informações (art. 34), veículo como garantia de débitos e multas (art. 64, caput) e mnemônico 'MANYfesto' preservado integralmente."
            ]
        }
    ]
}

fontes = {
    "checked_on": "2026-11-26",
    "sources": [
        {
            "url": "https://www2.camara.leg.br/legin/fed/consti/1988/constituicao-1988-5-outubro-1988-322142-normaatualizada-pl.html",
            "devices": "CF/1988, arts. 144, § 1º, III, e 237",
            "checked_on": "2026-11-26",
            "application": "Competência do Ministério da Fazenda para fiscalização e controle sobre o comércio exterior e atribuições de polícia marítima, aeroportuária e de fronteiras da Polícia Federal (seção 01)."
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/decret/2009/decreto-6759-5-fevereiro-2009-585997-normaatualizada-pe.html",
            "devices": "Decreto nº 6.759/2009 (Regulamento Aduaneiro atualizado), arts. 2º a 68 (Livro I), 329, § 1º, 554 a 556, 638, 649, 658, 688, 728, III, 'b', e 735-C",
            "checked_on": "2026-11-26",
            "application": "Base regulamentar direta das seções 01–05: território e zonas aduaneiras, ZPE, ACI, ZVA, PAPF, recintos e lojas francas, portos secos, requisitos e sanções de alfandegamento, modalidades e horários determinados unilateralmente na fiscalização, precedência, guarda documental, controle/proibições/exceções/perdimento de veículos, conhecimento de carga e carta de correção (incluído o § 4º do Decreto nº 10.550/2020), manifesto de carga, extravio/acréscimo vs. avaria, busca, garantia e prazo de 24 horas do art. 66."
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/declei/1960-1969/decreto-lei-37-18-novembro-1966-375637-normaatualizada-pe.html",
            "devices": "Decreto-Lei nº 37/1966 atualizado (incluindo LCs nº 214/2025 e nº 227/2026), arts. 33 a 43, 46, 60 e 104",
            "checked_on": "2026-11-26",
            "application": "Fundamento legal primário de jurisdição, precedência, horários determinados pela administração (art. 36, § 1º), informações de carga (art. 37), manifesto e termo de responsabilidade (art. 39), aplicação aos veículos militares utilizados no transporte de mercadoria (art. 43), conhecimento original (art. 46), conceitos de avaria/extravio (art. 60) e hipóteses taxativas de perda do veículo e perda cumulativa da mercadoria (art. 104)."
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/2003/lei-10833-29-dezembro-2003-497045-normaatualizada-pl.html",
            "devices": "Lei nº 10.833/2003 atualizada, arts. 64, 70, 71, 74, 75, 76 e 77",
            "checked_on": "2026-11-26",
            "application": "Guarda de documentos pelo prazo decadencial pelo importador, exportador, adquirente por conta e ordem e demais intervenientes, comunicação de sinistro em 48 horas e alterações dos arts. 36, 37 e 104 do DL nº 37/1966 (seções 02, 03 e 05)."
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/2010/lei-12350-20-dezembro-2010-609723-normaatualizada-pl.html",
            "devices": "Lei nº 12.350/2010 atualizada (com redação da Lei nº 13.043/2014), arts. 34 a 40",
            "checked_on": "2026-11-26",
            "application": "Requisitos técnicos e operacionais de locais e recintos alfandegados, advertência, suspensão na reincidência em 365 dias ou não saneamento e multa diária de R$ 10.000,00 (seção 01)."
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/1995/lei-9074-7-julho-1995-347472-normaatualizada-pl.html",
            "devices": "Lei nº 9.074/1995 atualizada, art. 1º, inciso VI, e §§ 2º e 3º",
            "checked_on": "2026-11-26",
            "application": "Outorga de estações aduaneiras e terminais alfandegados de uso público (portos secos) sob concessão ou permissão e prazo de até 25 anos prorrogável por até 10 anos (seção 01)."
        },
        {
            "url": "https://noticias.stf.jus.br/postsnoticias/stf-decide-que-prazo-de-concessao-de-portos-secos-e-de-25-anos/",
            "devices": "STF, Plenário, ADI 3.497 (interpretação conforme ao art. 1º, §§ 2º e 3º, da Lei nº 9.074/1995)",
            "checked_on": "2026-11-26",
            "application": "Interpretação conforme fixando que os prazos de 25 anos + 10 anos constituem limites máximos em contratos precedidos de licitação, vedada prorrogação automática (seção 01)."
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/2007/lei-11508-20-julho-2007-557187-normaatualizada-pl.html",
            "devices": "Lei nº 11.508/2007 atualizada (com redação da Lei nº 14.184/2021), art. 1º, parágrafo único",
            "checked_on": "2026-11-26",
            "application": "Caracterização das ZPEs como zona primária para efeito de controle aduaneiro (seção 01)."
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/lei/1960-1969/lei-5172-25-outubro-1966-358971-normaatualizada-pl.html",
            "devices": "Lei nº 5.172/1966 (CTN atualizado), art. 195, caput e parágrafo único",
            "checked_on": "2026-11-26",
            "application": "Conservação dos livros obrigatórios de escrituração comercial e fiscal e comprovantes de lançamentos até a prescrição dos créditos tributários (seção 02)."
        },
        {
            "url": "https://www2.camara.leg.br/legin/fed/decret/1994/decreto-1280-14-outubro-1994-449515-publicacaooriginal-1-pe.html",
            "devices": "Decreto nº 1.280/1994 (Acordo de Alcance Parcial para a Facilitação do Comércio — Acordo de Recife)",
            "checked_on": "2026-11-26",
            "application": "Base normativa das Áreas de Controle Integrado (ACIs) em fronteiras do Mercosul referenciada no art. 3º, § 5º, do Regulamento Aduaneiro (seção 01)."
        },
        {
            "url": "https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/alfandegamento/local-ou-recinto-que-pode-ser-alfandegado/recintos-em-zona-secundaria-ou-em-ponto-de-fronteira-mediante-contrato-de-concessao-ou-permissao-porto-seco-ou-mediante-licenciamento-clia",
            "devices": "Receita Federal do Brasil — Manual de Alfandegamento (IN RFB nº 2.111/2022 e Portaria RFB nº 143/2022)",
            "checked_on": "2026-11-26",
            "application": "Confirmação administrativa atualizada sobre conceito, vedação na ZP de portos e aeroportos, permissão/concessão e prévia licitação dos portos secos (seção 01)."
        }
    ],
    "limits": [
        "URLs diretas do Planalto apresentaram lentidão/bloqueio de conexão automatizada via curl, o SIJUT2 carrega atos infralegais via JavaScript dinâmico e a consulta automatizada de acórdãos em scon.stj.jus.br retornou HTTP 403; não se alega leitura integral dessas páginas bloqueadas/dinâmicas, tendo sido lidos os textos normativos consolidados equivalentes com HTTP 200 na Câmara dos Deputados, no Manual oficial da RFB em gov.br e no portal institucional do STF. Quanto à responsabilidade subjetiva do proprietário no perdimento de veículo (art. 688, V e § 2º, do Decreto nº 6.759/2009), a exigência consta expressamente do próprio § 2º do art. 688 consultado em fonte primária oficial, alinhada ao enunciado histórico da Súmula 138 do extinto TFR.",
        "As alterações introduzidas pelas Leis Complementares nº 214/2025 e nº 227/2026 nos arts. 31, 32 e 44 do Decreto-Lei nº 37/1966 tratam de sujeição passiva/responsabilidade tributária e confissão de dívida na DI (tópicos 02 e 03) e não foram antecipadas fora de escopo neste lote."
    ]
}

(batch_dir / "achados.json").write_text(json.dumps(achados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(batch_dir / "fontes.json").write_text(json.dumps(fontes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

pub = pathlib.Path(r"C:\PRO\site\.worktrees\informatica-hardware-20261123")
vis = pathlib.Path(r"C:\PRO\worktrees\questoes-experiencia-20261122")
tracked = [
    "src/components/study/markdown-viewer.tsx",
    "src/components/study/callout-block.tsx",
    "src/components/study/mermaid-viewer.tsx",
    "src/components/study/mnemonic-card.tsx",
    "src/lib/mermaid/security.mjs",
    "src/app/globals.css",
]
prov = {
    "published_checkout": str(pub).replace("\\", "/"),
    "visual_checkout": str(vis).replace("\\", "/"),
    "files": []
}
for rel in tracked:
    h1 = hashlib.sha256((pub / rel).read_bytes()).hexdigest()
    h2 = hashlib.sha256((vis / rel).read_bytes()).hexdigest()
    assert h1 == h2, f"Divergencia em {rel}"
    prov["files"].append({
        "path": rel,
        "same": True,
        "published_sha256": h1,
        "visual_sha256": h2
    })
(batch_dir / "render-proveniencia.json").write_text(json.dumps(prov, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("proposta.json, achados.json, fontes.json e render-proveniencia.json gerados com sucesso.")
