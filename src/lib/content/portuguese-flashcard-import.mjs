const PORTUGUESE_SECTION_IDS = new Set([
  "fonetica-sec-02",
  "fonetica-sec-03",
  "fonetica-sec-04",
  "morfologia-sec-01",
  "morfologia-sec-03",
  "morfologia-sec-04",
  "morfologia-sec-05",
  "morfologia-sec-08",
  "morfologia-sec-09",
  "morfologia-sec-10",
  "outros-topicos-sec-03",
  "redacao-oficial-sec-01",
  "redacao-oficial-sec-02",
  "redacao-oficial-sec-03",
  "redacao-oficial-sec-04",
  "redacao-oficial-sec-08",
  "sintaxe-sec-01",
  "sintaxe-sec-03",
  "sintaxe-sec-05",
  "sintaxe-sec-06",
  "sintaxe-sec-07",
  "sintaxe-sec-08",
  "sintaxe-sec-10",
  "sintaxe-sec-11",
]);

function normalizeForClassification(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[“”'‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matches(text, pattern) {
  return pattern.test(text);
}

export function parseTwoColumnCsv(source) {
  const text = String(source ?? "").replace(/^\uFEFF/u, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  const appendRow = () => {
    row.push(field.replace(/\r$/u, ""));
    if (row.some((value) => value.trim())) rows.push(row);
    row = [];
    field = "";
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      appendRow();
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("CSV inválido: campo entre aspas não foi encerrado.");
  if (field || row.length) appendRow();
  rows.forEach((values, index) => {
    if (values.length !== 2 || values.some((value) => !value.trim())) {
      throw new Error(`CSV inválido na linha ${index + 1}: esperadas duas colunas preenchidas.`);
    }
  });
  return rows.map(([question, answer]) => ({ question: question.trim(), answer: answer.trim() }));
}

export function normalizeAttachedFlashcard(row) {
  const binaryAnswer = row.answer.match(
    /^Gabarito:\s*(CERTO|ERRADO)\.\s*(?:(?:Comentário|Justificativa):\s*)?(.*)$/isu,
  );

  if (!binaryAnswer) {
    return {
      question: `[CERTO/ERRADO] A resposta correta para “${row.question}” é “${row.answer}”.`,
      answer: `Gabarito: CERTO. Justificativa: ${row.answer}`,
    };
  }

  const statement = row.question
    .replace(/^\[CERTO\/ERRADO\]\s*/iu, "")
    .replace(/^(?:Afirmação:|Julgue a assertiva:)\s*/iu, "")
    .trim();
  return {
    question: `[CERTO/ERRADO] ${statement}`,
    answer: `Gabarito: ${binaryAnswer[1].toLocaleUpperCase("pt-BR")}. Justificativa: ${binaryAnswer[2].trim()}`,
  };
}

export function classifyPortugueseFlashcard(row) {
  const text = normalizeForClassification(row.question);

  if (matches(text, /redacao oficial|comunicacoes? oficiais|documentos? oficia(?:l|is)|e-?mail(?:s)? (?:oficia(?:l|is)|institucional)|oficio|presidente da republica|vossa (?:excelencia|senhoria)|pronomes? de tratamento|servico publico|poder publico|signatario|manual de redacao|fecho respeitosamente|fecho utilizado|vocativo utilizado/u)) {
    if (matches(text, /e-?mail|att\.|abs\./u)) return "redacao-oficial-sec-08";
    if (matches(text, /impessoal|subjetiv|impressoes individuais|tratamento igualitario/u)) return "redacao-oficial-sec-02";
    if (matches(text, /formal|padron|linguagem cult|regionalismo|neologismo|abreviacoes/u)) return "redacao-oficial-sec-03";
    if (matches(text, /oficio|documento oficial|signatario|siglas/u)) return "redacao-oficial-sec-04";
    return "redacao-oficial-sec-01";
  }

  if (matches(text, /hifen|prefix|anti-inflamatorio|micro-ondas|micro-onibus|coautor|co-autor|antirrabico|minissaia|sub-regiao|sub-bibliotecario|inter-racial|extraoficial|autoescola|autoestrada|super-homem|pan-americano|vice-presidente|ponte rio-niteroi|mao de obra|mao-de-obra|dia a dia|pe de moleque|pes-de-moleque/u)) {
    if (matches(text, /plural|flexao de substantivos|salario-familia/u)) return "morfologia-sec-03";
    return "fonetica-sec-04";
  }

  if (matches(text, /uso do por que|termo o porque|palavra porque|os porques/u)) return "outros-topicos-sec-03";

  if (matches(text, /a medida que|na medida em que/u)) return "morfologia-sec-10";

  if (matches(text, /crase|acento grave|a\/a sua|a francesa|a moda de/u)) {
    if (matches(text, /facultativ/u)) return "sintaxe-sec-07";
    if (matches(text, /proibid|nunca admite|nao aceita|de segunda a sexta/u)) return "sintaxe-sec-08";
    if (matches(text, /obrigatori|obrigatorio|a francesa|a moda de|assisti a peca/u)) return "sintaxe-sec-06";
    return "sintaxe-sec-05";
  }

  if (matches(text, /acent|proparoxiton|paroxiton|oxiton|ditongo|hiato|tonicidade|pode comparecer|piau[ií]|feiura|heroico|heroi|hierarquico|publico e matematica|bacteria|serie e necessario|paralelepipedo/u)) {
    if (matches(text, /diferencia|ditongo|hiato|novo acordo|piau|feiura|heroico|heroi/u)) return "fonetica-sec-03";
    return "fonetica-sec-02";
  }

  if (matches(text, /pronome que|funcao do que|vocabulo que|o que em|que comprei|necessario que estudemos|conjuncao integrante|eu que resolvi/u)) return "sintaxe-sec-11";
  if (matches(text, /particula se|termo se|vocabulo se|vendem-se|vende-se|aluga-se|precisa-se|suicidou-se|se amam|abracaram-se|sabe-se|voz passiva sintetica|sujeito paciente|indice de indeterminacao|acompanhado de se/u)) return "sintaxe-sec-10";
  if (matches(text, /concordancia|sujeito composto|porcentagens|mais de um|faz dez anos|fazer.*tempo decorrido|lutou pelo titulo/u)) return "sintaxe-sec-03";

  if (matches(text, /pronome relativo|\bcujo\b|\bonde\b|pronome quem/u)) return "morfologia-sec-09";
  if (matches(text, /virgula|aposto|regencia|verbo assistir/u)) return "sintaxe-sec-01";
  if (matches(text, /proclise|pronome obliquo|\blhe\b|nao me |me empresta|colocacao do pronome|inicio de oracao|inicios de oracao|anaforic|cataforic|pronomes indefinidos|sentido vago|alguem, tudo, outrem/u)) return "morfologia-sec-08";
  if (matches(text, /conjuncao|\bmas\b|conquanto|embora|posto que|visto que|a medida que|na medida em que/u)) return "morfologia-sec-10";
  if (matches(text, /adverbio|adverbios/u) && !matches(text, /adjunto adverbial/u)) return "morfologia-sec-01";
  if (matches(text, /adjetiv|justica penal|homem mortal|menino doente|doente menino/u)) return "morfologia-sec-04";
  if (matches(text, /substantiv|^o plural|plural de|flexao de substantivos|salario-familia|beija-flores/u)) return "morfologia-sec-03";
  if (matches(text, /verbo|forma verbal|tempo verbal|preterito|intervir|provir|advir|deter|revir|reviu|revera|prever|aprazer|futuro do subjuntivo/u)) return "morfologia-sec-05";
  if (matches(text, /adjunto adverbial|sintaxe/u)) return "sintaxe-sec-01";

  throw new Error(`Não foi possível classificar o flashcard: ${row.question}`);
}

export function buildPortugueseFlashcards(sources) {
  const entries = sources.flatMap(({ fileName, content }) => (
    parseTwoColumnCsv(content).map((row, index) => ({ ...row, fileName, line: index + 1 }))
  ));

  return entries.map((entry) => {
    const sectionId = classifyPortugueseFlashcard(entry);
    if (!PORTUGUESE_SECTION_IDS.has(sectionId)) {
      throw new Error(`Seção de destino não permitida: ${sectionId}`);
    }
    return {
      sectionId,
      flashcard: normalizeAttachedFlashcard(entry),
      origin: `${entry.fileName}:${entry.line}`,
    };
  });
}
