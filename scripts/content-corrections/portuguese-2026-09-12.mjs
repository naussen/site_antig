import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve("tmp/portugues-review");
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");

if (apply && !args.has("--confirm-portugues")) {
  throw new Error("Para aplicar, informe --apply --confirm-portugues.");
}

const corrections = {
  "fonetica-sec-03": [
    ["**Acento Diferencial:** Mantido para distinção de tempo/número ou mesma classe gramatical (como *tem/têm*, *vem/vêm*, *pode/pôde*, *por/pôr*) e retirado para classes gramaticais distintas (como *para/para*, *pelo/pelo*).", "**Acento diferencial:** É obrigatório em pares como *pôde/pode* e *pôr/por* e na distinção de número em *tem/têm*, *vem/vêm* e derivados. Em casos como *fôrma/forma*, o acento é facultativo; em antigos pares como *para/pára* e *pelo/pêlo*, foi abolido."],
  ],
  "fonetica-sec-04": [
    ["### Encademeamentos Vocálicos e Elementos de Ligação", "### Encadeamentos vocabulares e elementos de ligação"],
    ["**Encadeamentos Vocálicos:** Utiliza-se o hífen para conectar palavras que se associam temporariamente para formar circuitos ou fluxos, sem constituir uma nova palavra definitiva.", "**Encadeamentos vocabulares:** Utiliza-se o hífen para ligar palavras que se combinam ocasionalmente e não formam um vocábulo novo."],
    ["Se não houver elemento de ligação, o hífen é obrigatório (ex: *cão-guia*, *beija-flor*).", "Sem elemento de ligação, muitos compostos consagrados usam hífen, como *cão-guia* e *beija-flor*; a grafia deve observar as regras e o uso lexical de cada formação."],
  ],
  "morfologia-sec-04": [
    ["* **Menino doente x Doente menino**\n    * Classe: modifica\n    * Sentido: sempre modifica\n    * Nota: Veja que a classe se altera, portanto, OBRIGATORIAMENTE o sentido também irá se alterar.", "* **Menino doente x Doente menino**\n    * Classe: não se altera; *doente* continua sendo adjetivo.\n    * Sentido e naturalidade: a anteposição pode produzir ênfase estilística, mas *doente menino* é uma construção pouco usual no português contemporâneo."],
  ],
  "morfologia-sec-05": [
    ["Não / nunca / jamais nada tu", "Não / nunca / jamais nades tu"],
    ["Não / nunca / jamais nadai vós", "Não / nunca / jamais nadeis vós"],
    ["Pretérito perfeito composto: indica uma ação que começa no passado e se prolonga até o presente.", "Pretérito perfeito composto: indica, em geral, uma ação reiterada ou continuada que começou no passado e alcança o presente."],
    ["Quem se esforce conquista seus objetivos (subjuntivo – exprime dúvida).", "Quem se esforçar poderá conquistar seus objetivos (subjuntivo – exprime hipótese)."],
    ["É conjugado da mesma forma que o verbo HAVER.", "É um verbo irregular. Entre suas formas mais cobradas estão *aprouve*, *aprouvesse* e *aprouver*."],
    ["#### -VER (Telever, Rever, Antever, Prever, Entrever)", "#### -VER (Rever, Antever, Prever, Entrever)"],
    ["\"Emprestarei-te...\" (Incorreto) / \"Emprestar-lhe-ei\" (Correto - SEMPRE mesóclise).", "\"Emprestarei-te...\" (inadequado na norma-padrão) / \"Emprestar-lhe-ei\" (mesóclise quando não houver palavra atrativa) / \"Não lhe emprestarei\" (próclise diante de palavra atrativa)."],
    ["Havendo palavra invariável ANTES do verbo, ocorre **PRÓCLISE OBRIGATÓRIA** devido à palavra atrativa (advérbio, preposição, conjunção subordinativa, etc.).", "Havendo palavra atrativa antes do verbo — como palavra negativa, pronome relativo, conjunção subordinativa ou certos advérbios — ocorre **próclise**. Nem toda palavra invariável é, por si só, atrativa."],
  ],
  "morfologia-sec-09": [
    ["Empregado quando o antecedente for pessoa. Deve vir **SEMPRE** antecedido de preposição.", "Quando retoma antecedente expresso que designa pessoa, é normalmente empregado após preposição: *a pessoa de quem falei*. Sem antecedente expresso, pode introduzir uma oração sem preposição: *quem estuda aprende*."],
    ["**ONDE:** Antecedente é lugar físico. Se for para trazer só a ideia de lugar, usa-se \"em que\".", "**ONDE:** Retoma lugar ou situação concebida como espaço. Para antecedentes que não exprimem lugar, empregam-se formas como *em que* ou *no qual*, conforme a regência."],
    ["Antecedente dá ideia de tempo. Quando retoma valor temporal pode ser SEMPRE substituído por \"no qual\".", "Retoma antecedente de valor temporal e, conforme a regência e a flexão do antecedente, pode equivaler a *em que*, *no qual*, *na qual*, *nos quais* ou *nas quais*."],
    ["1. Olhar o que vem APÓS (para saber se é feminino/masculino, singular/plural).\n2. Caso peça preposição, colocar ANTES do pronome.", "1. Identificar a função do pronome relativo na oração que ele introduz.\n2. Se o termo regente exigir preposição, colocá-la antes do pronome relativo.\n3. Flexionar *o qual* de acordo com o antecedente."],
  ],
  "outros-topicos-sec-01": [
    ["Caracteriza-se por uma sequência de acontecimentos com começo, meio e fim, cuja ordem pode ser alterada. É o único tipo textual que necessita ser datado. Apresenta uma presença abundante de verbos.", "Caracteriza-se pela apresentação de acontecimentos situados no tempo, em uma sequência que pode ou não seguir a ordem cronológica. Costuma apresentar verbos de ação e marcadores temporais, mas não exige a indicação explícita de datas."],
  ],
  "outros-topicos-sec-02": [
    ["apresentando seu significado original independentemente do contexto frásico em que aparece", "com sentido literal ou convencional, determinado no contexto em que aparece"],
  ],
  "outros-topicos-sec-03": [
    ["**CERCA DE:** Transmite a ideia de \"durante\" ou \"aproximadamente\".", "**CERCA DE:** Transmite a ideia de proximidade ou de quantidade aproximada."],
    ["(equivalente a: Jogamos durante três horas.)", "(equivalente a: Jogamos aproximadamente três horas.)"],
    ["**HÁ CERCA DE:** Significa \"faz aproximadamente\", indicando tempo passado.", "**HÁ CERCA DE:** Pode indicar tempo decorrido aproximado (*há cerca de dois anos*) ou combinar o verbo *haver* com quantidade aproximada (*há cerca de cem pessoas*)."],
    ["**Infringir**: transgressão, desrespeitar, desobedecer.", "**Infringir**: transgredir, desrespeitar, desobedecer."],
    ["**Estadia**: permanência paga do navio no porto para carga e descarga.", "**Estadia**: permanência temporária em determinado lugar; no uso técnico, também pode designar a permanência de navio no porto."],
  ],
  "sintaxe-sec-01": [
    ["*Nota:* A vírgula poderia ser inserida antes do adjunto, mas é facultativa. Seu uso teria a intenção de dar ênfase.", "*Nota:* Adjuntos adverbiais curtos podem aparecer sem vírgula; a pontuação pode ser usada para realce ou clareza. Adjuntos longos deslocados devem ser isolados."],
    ["O concurseiro, que se dedica, será aprovado**: Ao separar com vírgulas temos uma oração adjetiva explicativa. Dessa forma QUALQUER concurseiro que se dedicar, será aprovado.", "O concurseiro, que se dedica, será aprovado**: com vírgulas, a oração é explicativa e apresenta a dedicação como característica do referente já identificado."],
    ["O concurseiro que se dedica será aprovado**: Por outro lado, sem as vírgulas, estamos diante de uma oração adjetiva restritiva. Assim SOMENTE o concurseiro que se dedicou será aprovado.", "O concurseiro que se dedica será aprovado**: sem vírgulas, a oração é restritiva e delimita o grupo de concurseiros a que a afirmação se aplica."],
    ["9. **Separar OBJETO DIRETO PLEONÁSTICO** (aquele que se repete). Exemplos:\n   * A mim, não me cabe intervir.\n   * Os insensíveis, por que não os ignorar?", "9. **Separar OBJETO PLEONÁSTICO antecipado**, retomado por pronome. Exemplos:\n   * Esses livros, já os li. (objeto direto pleonástico)\n   * A mim, não me cabe intervir. (objeto indireto pleonástico)"],
    ["* É um sujeito muito simples, todavia, cheio de vaidades.", "* Ele não logrou, todavia, êxito."],
    ["**Antes de \"etc.\":** \"Gosto de vôlei, basquete, futebol, e etc.\"", "**Antes de \"etc.\":** \"Gosto de vôlei, basquete, futebol etc.\" Evita-se a combinação redundante *e etc.*; a vírgula antes de *etc.* varia conforme o padrão editorial adotado."],
  ],
  "sintaxe-sec-02": [
    ["O sujeito é a parte da oração sobre a qual a restante oração se refere", "O sujeito é o termo sobre o qual se declara algo na oração"],
    ["* **Verbos conjugados no infinitivo pessoal:**\n  *Exemplo:* É essencial diminuir a desigualdade.", "* **Sujeito oracional:** Uma oração inteira pode exercer a função de sujeito.\n  *Exemplo:* É essencial diminuir a desigualdade. (A oração *diminuir a desigualdade* funciona como sujeito de *é essencial*.)"],
    ["* **Verbos SER, IR (para) e ESTAR quando indicam tempo.**\n  *Exemplo:* Já são 9 horas / Está indo para 1h de prova / Lá está anoitecendo.", "* **Verbo SER em indicações de hora, data ou distância:** concorda com a expressão numérica.\n  *Exemplo:* Já são 9 horas / Hoje é dia 12.\n* **Verbo ESTAR em construções impessoais de tempo ou condição atmosférica:** permanece no singular.\n  *Exemplo:* Está frio / Está tarde."],
  ],
  "sintaxe-sec-03": [
    ["* **Antes do verbo:** Concorda com o termo após o símbolo de porcentagem (%).\n    *Exemplo:* 75% dos brasileiros SÃO favoráveis.\n  * **Após o verbo:** Concorda com o número do percentual.\n    *Exemplo:* Acumularam-se ganhos de 10%.", "* Quando o percentual vem acompanhado de especificador, a concordância pode seguir o número ou o termo especificador, conforme a construção.\n    *Exemplo:* 1% dos candidatos faltou / 1% dos candidatos faltaram.\n  * Sem especificador, o verbo concorda com o número percentual.\n    *Exemplo:* 1% faltou / 75% faltaram."],
    ["* **NÃO antecedido por artigo:** O verbo fica no SINGULAR.\n  *Exemplo:* Calças É um vestuário utilizado há vários anos.", "* **Nome próprio plural sem artigo:** o verbo pode ficar no singular.\n  *Exemplo:* Minas Gerais produz café.\n* Nomes comuns usados normalmente no plural mantêm a concordância plural: *As calças estão no varal*."],
    ["* **O sujeito composto de PRONOMES RETOS.**", "* **Sujeito composto de pronomes retos:** a presença de *eu* leva o verbo à 1ª pessoa do plural (*eu e ela iremos*). Sem *eu*, a norma tradicional prioriza a 2ª pessoa do plural quando há *tu* ou *vós*, embora a 3ª pessoa do plural seja corrente no português brasileiro."],
  ],
  "sintaxe-sec-04": [
    ["| **Ajudar, Satisfazer, Presidir, Preceder** | - | VTD ou VTI | Quando VTI necessita da preposição \"A\". Tanto VTD quanto VTI as expressões terão mesmo sentido | Foi convidada para presidir a sessão (VTD); Foi convidada para presidir à sessão (VTI); Ele satisfez os requisitos (VTD); Ele satisfez aos requisitos (VTI) |", "| **Ajudar** | Prestar auxílio | VTD ou VTI | Admite complemento direto ou introduzido por *a* | Ajudou o colega; Ajudou ao colega |\n| **Satisfazer** | Cumprir / corresponder | VTD ou VTI | Direto no sentido de cumprir; com *a* no sentido de corresponder | Satisfez os requisitos; Satisfez ao pedido |\n| **Presidir** | Dirigir | VTD ou VTI | Admite complemento direto ou introduzido por *a* | Presidiu a sessão; Presidiu à sessão |\n| **Preceder** | Vir antes | VTD | Sem preposição | A introdução precede o desenvolvimento |"],
    ["| **Chegar, Ir, Voltar, Retornar, Comparecer** | - | VI | Preposição \"A\" quando são seguidos por adjunto adverbial de lugar indicando destino. Não admitem a preposição \"em\" e suas variações | ✓ Fomos AO local da colheita; ✗ Fomos no local da colheita; ✗ Chegou em Belo Horizonte; Chegou de BH (origem); Chegou a BH (destino) |", "| **Chegar / Ir** | Movimento com destino | VI | Na norma-padrão, usam *a* ou *para*; *chegar em* é comum na fala, mas evitado em contexto formal | Fomos ao local; Chegou a Belo Horizonte; Foi para Brasília |\n| **Voltar / Retornar / Comparecer** | Movimento ou presença | VI | A preposição depende da construção: *a*, *para* ou *de* | Voltou ao trabalho; Retornou de Brasília; Compareceu à reunião |"],
    ["provas irredutíveis", "provas irrefutáveis"],
    ["| **Custar** | Ser difícil | VTI | [...] custa A algo | Custou ao professor explicar a questão |\n| | Acarretar | VTD | [...] custa algo | O livro custou-me caro |\n| | Ter valor | VTD | [...] custa algo | Apartamentos custam R$100.000 |", "| **Custar** | Ser difícil | VTI | Algo custa a alguém | Custou ao professor explicar a questão |\n| | Acarretar perda | VTDI | Algo custa alguma coisa a alguém | O atraso custou-lhe o emprego |\n| | Ter preço | VI | O preço funciona como expressão de valor | O livro custa R$ 100 |"],
    ["VTD: não admite uso de pronomes átonos (me, te, se, nos, vos); VTI: deve ser usado os pronomes átonos + preposição DE", "Na construção não pronominal, o complemento é direto; na construção pronominal, empregam-se o pronome e a preposição *de*"],
    ["[...] acarreta nisso. Não admite em, e variações (no, na, nas, etc.) | ✓ A decision implicará demissão", "[...] implica algo. No sentido de acarretar, a norma-padrão não emprega a preposição *em* | ✓ A decisão implicará demissão"],
    ["Não admite as construções \"com\" e \"conosco\".", "Na norma-padrão, não se emprega a preposição *com* nesse sentido."],
    ["**Classificação:** VTD (Verbo Transitivo Direto)\n* **Regência:** [...] obsta algo.\n* **Exemplo:** *A oposição obsta o progresso*", "**Classificação:** VTD ou VTI.\n* **Regência:** admite complemento direto ou introduzido pela preposição *a*.\n* **Exemplos:** *A oposição obsta o progresso* / *A oposição obsta ao progresso*"],
    ["✗ *Prefiro estudo que trabalhar*", "✗ *Prefiro estudar do que trabalhar*"],
    ["[...] quer A algo.\n  * **Exemplo:** *Queria AOS colegas", "[...] quer bem A alguém.\n  * **Exemplo:** *Queria bem AOS colegas"],
    ["* **VTI:** refere-se ao receptor da resposta.", "* **VTI:** refere-se ao destinatário ou ao assunto a que se responde."],
    ["* **VTDI:** *Respondi ao convite que recebi*", "* **VTDI:** *Respondi ao diretor que compareceria*"],
  ],
  "sintaxe-sec-07": [
    ["3. **Antes de nome próprio feminino sem sobrenome e sem especificador:**\n   A variação ocorre de acordo com a relação de proximidade ou distanciamento:\n   * *Refiro-me a Ana* (ou *à Ana*): Facultativo devido à ausência de termo especificador.\n   * *Refiro-me à Ana, uma grande amiga:* Crase obrigatória, pois o especificador indica relação de intimidade.\n   * *Refiro-me a Ana, uma funcionária do local:* Sem crase, pois o especificador indica relação de distanciamento.", "3. **Antes de nome próprio feminino:**\n   O uso depende de o nome admitir artigo no padrão linguístico adotado; não é a presença de sobrenome ou aposto que determina, isoladamente, a crase.\n   * *Refiro-me a Ana* / *Refiro-me à Ana*: ambas as formas podem ocorrer, conforme o uso do artigo diante do nome.\n   * Se houver determinante que torne o artigo necessário, ocorre crase: *Refiro-me à Ana da contabilidade*."],
  ],
  "sintaxe-sec-08": [
    ["4. **Antes de nome próprio completo:**\n   * Indica distanciamento ou ausência de intimidade.\n   * Exemplo: *referiu-se a [Nome Completo]*.\n   * *Observação:* Se houver crase antes de nome próprio completo, o uso deve se enquadrar nos casos de tradição (exemplo: *escrevia à moda de José de Alencar*).", "4. **Antes de nome próprio feminino que não admite artigo no uso adotado:**\n   * Exemplo: *referiu-se a Maria da Silva*.\n   * Se o nome admitir artigo ou estiver determinado, poderá ocorrer crase: *referiu-se à Maria da Silva que conhecemos*. A forma *à moda de* também admite crase com o termo subentendido: *escrevia à moda de José de Alencar*."],
    ["ocorre crase, pois a letra maiúscula funciona como uma forma de especificador", "ocorre crase porque *Casa*, no sentido de instituição legislativa, admite artigo definido nessa construção"],
    ["*Education a distância é uma tendência*", "*Educação a distância é uma tendência*"],
    ["* Embora exista divergência na doutrina, para fins de prova deve-se empregar a crase nas locuções adverbiais de instrumento constituídas por palavras femininas.\n   * Exemplos:\n     * *Fogão a gás* (sem crase, pois \"gás\" é palavra masculina);\n     * *Fogão à lenha* (ocorre crase, pois \"lenha\" é palavra feminina);\n     * *Carro a álcool* (sem crase, pois \"álcool\" é palavra masculina);\n     * *Carro à gasolina* (ocorre crase, pois \"gasolina\" é palavra feminina);\n     * *Barco à vela* (ocorre crase, pois \"vela\" é palavra feminina).", "* O uso não é determinado apenas pelo gênero da palavra. Em locuções consagradas de modo ou instrumento, ocorre crase quando há preposição *a* e artigo feminino: *escrito à mão*, *feito à máquina*.\n   * Em expressões que indicam combustível, matéria ou meio de propulsão, é comum não haver artigo: *fogão a lenha*, *carro a gasolina*, *barco a vela*."],
  ],
  "sintaxe-sec-10": [
    ["3. **Integrante:** Apresenta o verbo no modo indicativo e não possui carga semântica ou sentido próprio.\n   * *SE isso é mesmo verdade, ninguém quis afirmar.*", "3. **Integrante:** Introduz oração subordinada substantiva e não possui carga semântica própria; o modo verbal depende do contexto.\n   * *Ninguém quis afirmar se isso era mesmo verdade.*"],
    ["Admite as ideias de \"a si mesmo\" ou \"uns aos outros\".", "Admite a ideia de \"a si mesmo\". Quando exprime \"uns aos outros\", o pronome é recíproco."],
  ],
  "sintaxe-sec-11": [
    ["*Minha amiga que (a qual) viajou este ano.*", "*A amiga que (a qual) viajou este ano já voltou.*"],
    ["**Partícula expletiva e interativa:**", "**Partícula expletiva e construção reiterativa de realce:**"],
    ["**Interativa:** passa por repetição com o objetivo de conferir ênfase.", "**Construção reiterativa:** repete-se o *que* com objetivo de conferir ênfase."],
    ["*Interativa:* Que roupas lindas que ela comprou!", "*Reiterativa:* Que roupas lindas que ela comprou!"],
  ],
  "redacao-oficial-sec-01": [
    ["Ideias secundárias que não acrescentam, exemplificam ou expliquem ideias fundamentais devem ser removidas.", "Ideias secundárias que não acrescentem, exemplifiquem nem expliquem ideias fundamentais devem ser removidas."],
  ],
  "redacao-oficial-sec-03": [
    ["Isso é válido tanto para as comunicações feitas em meio eletrônico, quanto para os eventuais documentos impressos.", "Isso é válido tanto para as comunicações feitas em meio eletrônico quanto para os eventuais documentos impressos."],
  ],
  "redacao-oficial-sec-04": [
    ["é necessário a presença de alguns dados do destinatário, como o vocativo correto, o seu nome, cargo e endereço.", "é necessária a presença de dados do destinatário, como a forma de tratamento, o nome, o cargo e o endereço."],
    ["Deve conter uma introdução, apresentando o objetivo; o desenvolvimento, onde o assunto será detalhado; bem como uma conclusão, de modo a afirmar a posição sobre o assunto.", "Quando não se tratar de mero encaminhamento de documentos, deve conter introdução, desenvolvimento e conclusão. Nos expedientes de mero encaminhamento, a introdução informa o motivo da remessa e os dados do documento encaminhado."],
    ["Todos os ofícios devem conter o signatário, com o seu nome e cargo ocupado.", "Salvo as comunicações assinadas pelo Presidente da República, o expediente deve identificar o signatário, com nome e cargo."],
  ],
  "redacao-oficial-sec-08": [
    ["Devem ser observadas as seguintes considerações:; • Avaliar se o anexo é realmente indispensável;; • Evitar arquivos de tamanho excessivo e o reencaminhamento de anexos em mensagens de resposta;; • Os arquivos devem estar em formatos usuais (como .doc, .pdf, etc.) e apresentar poucos riscos de segurança;; • Quando o documento enviado ainda estiver em fase de discussão, os arquivos devem ser, obrigatoriamente, enviados em formato que permita edição.", "Deve informar minimamente o conteúdo anexado. Convém avaliar se o anexo é indispensável, evitar arquivos excessivos ou repetidos, usar formatos usuais e de baixo risco e, quando o documento estiver em discussão, enviá-lo em formato editável."],
  ],
};

const calloutCorrections = {
  "morfologia-sec-04": [
    ["Se a mudança de posição entre substantivo e adjetivo alterar a classe gramatical dos termos (como em 'menino doente' para 'doente menino'), o sentido da expressão será obrigatoriamente modificado.", "A posição do adjetivo pode alterar o sentido, a ênfase ou a naturalidade da expressão, mas não muda automaticamente a classe gramatical dos termos."],
  ],
  "morfologia-sec-09": [
    ["O pronome 'onde' deve ser utilizado exclusivamente quando o antecedente for um lugar físico. Para ideias abstratas de lugar, utilize 'em que'.", "O pronome 'onde' retoma lugar ou situação concebida como espaço. Com antecedentes que não exprimem lugar, use 'em que' ou forma equivalente, conforme a regência."],
  ],
  "outros-topicos-sec-01": [
    ["O texto narrativo possui progressão temporal e exige datação.", "O texto narrativo apresenta acontecimentos situados no tempo, mas não exige a indicação explícita de datas."],
  ],
  "sintaxe-sec-01": [
    ["A presença ou ausência de vírgulas nas orações adjetivas altera o sentido: com vírgulas é explicativa (aplica-se a todos); sem vírgulas é restritiva (aplica-se apenas a uma parte).", "A presença ou ausência de vírgulas nas orações adjetivas altera o alcance: com vírgulas, a oração acrescenta uma explicação sobre o referente; sem vírgulas, restringe o conjunto a que ele pertence."],
  ],
  "sintaxe-sec-03": [
    ["A concordância com nomes que só existem no plural depende exclusivamente da presença do artigo. Com artigo: verbo no plural ('Os Estados Unidos invadiram'). Sem artigo: verbo no singular ('Estados Unidos invadiu').", "Com nomes próprios de forma plural, a presença de artigo plural normalmente leva o verbo ao plural (*Os Estados Unidos anunciaram*); nomes próprios usados sem artigo podem levar o verbo ao singular (*Minas Gerais produz café*)."],
  ],
  "sintaxe-sec-07": [
    ["Antes de nome próprio feminino, a crase é facultativa. Porém, se houver um especificador que indique intimidade, ela se torna obrigatória; se indicar distanciamento, a crase é proibida.", "Antes de nome próprio feminino, a crase depende de o nome admitir artigo no padrão adotado. Um determinante pode tornar o artigo necessário, mas intimidade ou distanciamento não constituem regra mecânica."],
  ],
  "sintaxe-sec-08": [
    ["As palavras 'casa', 'terra' e 'distância' só admitem crase se estiverem acompanhadas de um termo modificador ou especificador.", "O emprego da crase com *casa*, *terra* e *distância* depende da regência, do sentido e da presença de artigo; um modificador frequentemente favorece o artigo, mas não substitui a análise sintática."],
  ],
};

let applied = 0;
const plannedUpdates = [];

function replaceExact(value, from, to, sectionId, field) {
  if (!value.includes(from)) {
    throw new Error(`Trecho esperado não encontrado em ${sectionId}.${field}: ${from}`);
  }
  applied += 1;
  return value.replace(from, to);
}

const files = [
  "consideracoes-iniciais.json",
  "fonetica.json",
  "morfologia.json",
  "outros-topicos.json",
  "sintaxe.json",
  "redacao-oficial.json",
];

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

const verifyCurrent = args.has("--verify-current");

if (verifyCurrent) {
  const expectedSections = [];
  for (const file of files) {
    const payload = JSON.parse(await readFile(path.join(root, file), "utf8"));
    expectedSections.push(...payload.sections.map((section) => ({
      sectionId: section.section_id,
      content: section.content_markdown,
      callouts: section.callouts ?? [],
    })));
  }
  const verifier = createClient(
    requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await verifier
    .from("sections")
    .select("section_id,content_markdown,callouts")
    .in("section_id", expectedSections.map(({ sectionId }) => sectionId));
  if (error) throw new Error(`Falha ao verificar persistência: ${error.message}`);
  const liveById = new Map(data.map((section) => [section.section_id, section]));
  for (const expected of expectedSections) {
    const live = liveById.get(expected.sectionId);
    if (
      !live ||
      live.content_markdown !== expected.content ||
      JSON.stringify(live.callouts ?? []) !== JSON.stringify(expected.callouts)
    ) {
      throw new Error(`Divergência após persistência em ${expected.sectionId}.`);
    }
  }
  console.log(`Persistência confirmada em ${expectedSections.length} seções de Português.`);
}

if (!verifyCurrent) {
for (const file of files) {
  const filePath = path.join(root, file);
  const payload = JSON.parse(await readFile(filePath, "utf8"));

  for (const section of payload.sections) {
    const originalContent = section.content_markdown;
    const originalCallouts = structuredClone(section.callouts ?? []);
    for (const [from, to] of corrections[section.section_id] ?? []) {
      section.content_markdown = replaceExact(section.content_markdown, from, to, section.section_id, "content_markdown");
    }
    for (const callout of section.callouts ?? []) {
      for (const [from, to] of calloutCorrections[section.section_id] ?? []) {
        if (callout.text.includes(from)) {
          callout.text = replaceExact(callout.text, from, to, section.section_id, "callouts.text");
        }
      }
    }
    if (
      section.content_markdown !== originalContent ||
      JSON.stringify(section.callouts ?? []) !== JSON.stringify(originalCallouts)
    ) {
      plannedUpdates.push({
        sectionId: section.section_id,
        originalContent,
        originalCallouts,
        correctedContent: section.content_markdown,
        correctedCallouts: section.callouts ?? [],
      });
    }
  }

  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

if (applied !== 72) {
  throw new Error(`Quantidade inesperada de correções: ${applied}; esperado: 72`);
}

console.log(`Correções preparadas com sucesso: ${applied} em ${plannedUpdates.length} seções.`);

if (!apply) {
  console.log("Prévia concluída; nenhuma escrita foi feita no Supabase.");
  process.exit(0);
}

const supabase = createClient(
  requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const sectionIds = plannedUpdates.map(({ sectionId }) => sectionId);
const { data: liveSections, error: readError } = await supabase
  .from("sections")
  .select("section_id,content_markdown,callouts")
  .in("section_id", sectionIds);

if (readError) throw new Error(`Falha ao conferir conteúdo atual: ${readError.message}`);
if (liveSections.length !== sectionIds.length) {
  throw new Error(`Foram encontradas ${liveSections.length} de ${sectionIds.length} seções esperadas.`);
}

const liveById = new Map(liveSections.map((section) => [section.section_id, section]));
for (const update of plannedUpdates) {
  const live = liveById.get(update.sectionId);
  const originalMatches =
    live.content_markdown === update.originalContent &&
    JSON.stringify(live.callouts ?? []) === JSON.stringify(update.originalCallouts);
  const correctedMatches =
    live.content_markdown === update.correctedContent &&
    JSON.stringify(live.callouts ?? []) === JSON.stringify(update.correctedCallouts);
  if (!originalMatches && !correctedMatches) {
    throw new Error(`Conteúdo concorrente detectado em ${update.sectionId}; nenhuma escrita iniciada.`);
  }
}

let updatedSections = 0;
for (const update of plannedUpdates) {
  const live = liveById.get(update.sectionId);
  if (
    live.content_markdown === update.correctedContent &&
    JSON.stringify(live.callouts ?? []) === JSON.stringify(update.correctedCallouts)
  ) {
    continue;
  }
  const { error } = await supabase
    .from("sections")
    .update({
      content_markdown: update.correctedContent,
      callouts: update.correctedCallouts,
    })
    .eq("section_id", update.sectionId);
  if (error) throw new Error(`Falha ao atualizar ${update.sectionId}: ${error.message}`);
  updatedSections += 1;
}

console.log(`Supabase atualizado: ${updatedSections} seções; flashcards e demais campos preservados.`);
}
