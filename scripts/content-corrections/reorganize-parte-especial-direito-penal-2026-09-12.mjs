import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Uso: node reorganize-parte-especial-direito-penal-2026-09-12.mjs <entrada.json> <saida.json>");
}

const source = JSON.parse(await readFile(inputPath, "utf8"));
const topicId = "parte-especial-do-codigo-penal";
if (source.topic_id !== topicId) throw new Error(`Tópico inesperado: ${source.topic_id}`);

const byNumber = new Map(source.sections.map((section, index) => [index + 1, section]));
const assembled = new Map();

function clean(markdown) {
  return markdown
    .replace(/^#{1,6} (?:Dos |Das )?Crimes? (?:contra|Contra) .+$/gmu, "")
    .replace(/^#{1,6} (?:Disposições gerais.+|Outras Falsidades|Falsidade de Títulos e Outros Papéis Públicos|Tipos|Crimes)$/gmu, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function add(title, markdown, extras = {}) {
  const content = clean(markdown);
  if (!content) return;
  const current = assembled.get(title) ?? {
    title,
    parts: [],
    callouts: [],
    mnemonics: [],
    flashcards: [],
    mermaid_mindmap: "",
  };
  current.parts.push(content);
  current.callouts.push(...(extras.callouts ?? []));
  current.mnemonics.push(...(extras.mnemonics ?? []));
  current.flashcards.push(...(extras.flashcards ?? []));
  current.mermaid_mindmap ||= extras.mermaid_mindmap ?? "";
  assembled.set(title, current);
}

function splitAtHeadings(markdown, definitions, preambleTarget = definitions[0].title) {
  const lines = markdown.split(/\r?\n/);
  const matches = definitions.map((definition) => {
    const index = lines.findIndex((line) => line.trim() === definition.heading);
    if (index < 0) throw new Error(`Título não localizado: ${definition.heading}`);
    return { ...definition, index };
  }).sort((a, b) => a.index - b.index);

  const preamble = lines.slice(0, matches[0].index).join("\n").trim();
  if (preamble) add(preambleTarget, preamble);
  matches.forEach((match, index) => {
    const nextIndex = matches[index + 1]?.index ?? lines.length;
    add(match.title, lines.slice(match.index + 1, nextIndex).join("\n"));
  });
}

function sectionExtras(section) {
  return {
    callouts: section.callouts,
    mnemonics: section.mnemonics,
    flashcards: section.flashcards,
    mermaid_mindmap: section.mermaid_mindmap,
  };
}

const s1 = byNumber.get(1);
splitAtHeadings(s1.content_markdown, [
  { heading: "### Homicídio Simples", title: "Homicídio" },
  { heading: "### Feminicídio (Art. 121-A)", title: "Feminicídio" },
  { heading: "### Vicaricídio (Art. 121-B)", title: "Vicaricídio" },
]);
const homicide = assembled.get("Homicídio");
homicide.callouts.push(...s1.callouts);
homicide.mermaid_mindmap = s1.mermaid_mindmap;

const s2 = byNumber.get(2);
splitAtHeadings(s2.content_markdown, [
  { heading: "### 1. Causas Gerais de Aumento de Pena no Homicídio", title: "Homicídio" },
  { heading: "### 2. Causas de Aumento de Pena no Feminicídio", title: "Feminicídio" },
  { heading: "### 3. Entendimento do STF sobre Homicídio Privilegiado-Qualificado", title: "Homicídio" },
  { heading: "### 4. Compatibilidade de Qualificadora e Dolo Eventual (STJ)", title: "Homicídio" },
  { heading: "### 5. Causas de Aumento de Pena no Induzimento, Instigação ou Auxílio a Suicídio ou a Automutilação", title: "Induzimento, Instigação ou Auxílio a Suicídio ou a Automutilação" },
]);
assembled.get("Homicídio").callouts.push(...s2.callouts);

add("Induzimento, Instigação ou Auxílio a Suicídio ou a Automutilação", byNumber.get(3).content_markdown, sectionExtras(byNumber.get(3)));
add("Lesão Corporal", byNumber.get(4).content_markdown);

splitAtHeadings(byNumber.get(5).content_markdown, [
  { heading: "### Calúnia", title: "Calúnia" },
  { heading: "### Difamação", title: "Difamação" },
  { heading: "### Injúria", title: "Injúria" },
]);
add("Injúria", byNumber.get(6).content_markdown);

const s7 = byNumber.get(7).content_markdown;
const violationStart = s7.indexOf("# Violação de Domicílio (Art. 150)");
const invasionStart = s7.indexOf("### Invasão de Dispositivo Informático (Art. 154-A)");
const tableStart = s7.indexOf("| Crime | Conduta | Pena |");
if ([violationStart, invasionStart, tableStart].some((index) => index < 0)) throw new Error("Estrutura inesperada na seção 07");
add("Injúria", s7.slice(0, violationStart));
add("Violação de Domicílio", s7.slice(violationStart + "# Violação de Domicílio (Art. 150)".length, invasionStart));
add("Invasão de Dispositivo Informático", s7.slice(invasionStart + "### Invasão de Dispositivo Informático (Art. 154-A)".length, tableStart));
const tableRows = s7.slice(tableStart).split(/\r?\n/).filter((line) => line.startsWith("| **"));
for (const row of tableRows) {
  const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
  const title = cells[0].replace(/\*\*/g, "").replace(/ \(Art\. \d+\)$/, "");
  add(title === "Redução a condição análoga à de escravo" ? "Redução a Condição Análoga à de Escravo" : "Constrangimento Ilegal", `**Conduta:** ${cells[1]}\n\n**Pena:** ${cells[2]}`);
}

splitAtHeadings(byNumber.get(8).content_markdown, [
  { heading: "### Furto", title: "Furto" },
  { heading: "### Roubo", title: "Roubo" },
  { heading: "### Extorsão", title: "Extorsão" },
]);
for (const line of byNumber.get(9).content_markdown.split(/\r?\n/).filter((line) => /^\* \*\*/.test(line))) {
  const match = line.match(/^\* \*\*(Constrangimento Ilegal|Extorsão|Concussão).*?:\*\* (.+)$/);
  if (match) add(match[1], match[2]);
}
splitAtHeadings(byNumber.get(10).content_markdown, [
  { heading: "### Extorsão", title: "Extorsão" },
  { heading: "### Extorsão Mediante Sequestro", title: "Extorsão Mediante Sequestro" },
  { heading: "### Extorsão Indireta", title: "Extorsão Indireta" },
]);
splitAtHeadings(byNumber.get(11).content_markdown, [
  { heading: "### Apropriação Indébita Comum", title: "Apropriação Indébita" },
  { heading: "### Apropriação Indébita Previdenciária", title: "Apropriação Indébita Previdenciária" },
]);

splitAtHeadings(byNumber.get(12).content_markdown, [
  { heading: "### Art. 180 - Receptação", title: "Receptação" },
  { heading: "#### Crimes contra a liberdade sexual", title: "Estupro" },
  { heading: "#### Assédio sexual", title: "Assédio Sexual" },
  { heading: "#### Importunação sexual", title: "Importunação Sexual" },
  { heading: "#### Violação sexual mediante fraude", title: "Violação Sexual Mediante Fraude" },
  { heading: "#### Estupro de vulnerável", title: "Estupro de Vulnerável" },
  { heading: "#### Divulgação de cena de estupro ou de cena de estupro de vulnerável, de cena de sexo ou de pornografia", title: "Divulgação de Cena de Estupro, Sexo ou Pornografia" },
  { heading: "#### Favorecimento da prostituição ou de outra forma de exploração sexual de criança ou adolescente ou de vulnerável", title: "Favorecimento da Prostituição ou Exploração Sexual de Criança, Adolescente ou Vulnerável" },
  { heading: "#### Corrupção de menores", title: "Corrupção de Menores" },
  { heading: "#### Satisfação de lascívia mediante presença de criança ou adolescente", title: "Satisfação de Lascívia Mediante Presença de Criança ou Adolescente" },
]);
add("Divulgação de Cena de Estupro, Sexo ou Pornografia", byNumber.get(13).content_markdown);

add("Incêndio", byNumber.get(14).content_markdown);
splitAtHeadings(byNumber.get(15).content_markdown, [
  { heading: "### Incêndio (Art. 250)", title: "Incêndio" },
  { heading: "### Explosão (Art. 251)", title: "Explosão" },
]);

splitAtHeadings(byNumber.get(16).content_markdown, [
  { heading: "#### Falsificação de Papéis Públicos (Art. 293)", title: "Falsificação de Papéis Públicos" },
  { heading: "#### Petrechos de Falsificação (Art. 294)", title: "Petrechos de Falsificação" },
  { heading: "### Uso de Documento Falso", title: "Uso de Documento Falso" },
  { heading: "### Supressão de Documento", title: "Supressão de Documento" },
  { heading: "### Falsa Identidade", title: "Falsa Identidade" },
  { heading: "#### Adulteração de Sinal Identificador de Veículo", title: "Adulteração de Sinal Identificador de Veículo" },
  { heading: "#### Fraudes em Certames de Interesse Público", title: "Fraudes em Certames de Interesse Público" },
]);
const falseIdentity = assembled.get("Falsa Identidade");
const art308Index = falseIdentity.parts[0].indexOf("* **Art. 308**");
if (art308Index < 0) throw new Error("Art. 308 não localizado");
add("Uso de Documento de Identidade Alheia", falseIdentity.parts[0].slice(art308Index));
falseIdentity.parts[0] = falseIdentity.parts[0].slice(0, art308Index).trim();

splitAtHeadings(byNumber.get(17).content_markdown, [
  { heading: "#### Corrupção Passiva Qualificada", title: "Corrupção Passiva" },
  { heading: "#### Facilitação de Contrabando ou Descaminho", title: "Facilitação de Contrabando ou Descaminho" },
  { heading: "#### Prevaricação (Própria)", title: "Prevaricação" },
  { heading: "#### Prevaricação Imprópria", title: "Prevaricação Imprópria" },
  { heading: "#### Condescendência Criminosa", title: "Condescendência Criminosa" },
  { heading: "#### Advocacia Administrativa", title: "Advocacia Administrativa" },
  { heading: "#### Abandono de Função", title: "Abandono de Função" },
  { heading: "#### Exercício Funcional Ilegalmente Antecipado ou Prolongado", title: "Exercício Funcional Ilegalmente Antecipado ou Prolongado" },
]);
add("Descaminho", byNumber.get(18).content_markdown);
add("Peculato", byNumber.get(19).content_markdown);

splitAtHeadings(byNumber.get(20).content_markdown, [
  { heading: "### Denunciação Caluniosa", title: "Denunciação Caluniosa" },
  { heading: "### Comunicação Falsa de Crime ou de Contravenção", title: "Comunicação Falsa de Crime ou Contravenção" },
  { heading: "### Autoacusação Falsa", title: "Autoacusação Falsa" },
  { heading: "### Exploração de Prestígio", title: "Exploração de Prestígio" },
  { heading: "#### Incitação ao crime", title: "Incitação ao Crime" },
  { heading: "#### Apologia de crime ou criminoso", title: "Apologia de Crime ou Criminoso" },
  { heading: "#### Associação Criminosa", title: "Associação Criminosa" },
  { heading: "#### Constituição de milícia privada", title: "Constituição de Milícia Privada" },
  { heading: "#### Atentado contra a liberdade de trabalho", title: "Atentado Contra a Liberdade de Trabalho" },
  { heading: "#### Atentado contra a liberdade de contrato de trabalho e boicotagem violenta", title: "Atentado Contra a Liberdade de Contrato de Trabalho e Boicotagem Violenta" },
  { heading: "#### Atentado contra a liberdade de associação", title: "Atentado Contra a Liberdade de Associação" },
  { heading: "#### Paralisação de trabalho, seguida de violência ou perturbação da ordem", title: "Paralisação de Trabalho Seguida de Violência ou Perturbação da Ordem" },
  { heading: "#### Paralisação de trabalho de interesse coletivo", title: "Paralisação de Trabalho de Interesse Coletivo" },
  { heading: "#### Invasão de estabelecimento industrial, comercial ou agrícola. Sabotagem", title: "Invasão de Estabelecimento Industrial, Comercial ou Agrícola e Sabotagem" },
  { heading: "#### Frustração de direito assegurado por lei trabalhista", title: "Frustração de Direito Assegurado por Lei Trabalhista" },
  { heading: "#### Frustração de lei sobre a nacionalização do trabalho", title: "Frustração de Lei sobre a Nacionalização do Trabalho" },
  { heading: "#### Exercício de atividade com infração de decisão administrativa", title: "Exercício de Atividade com Infração de Decisão Administrativa" },
  { heading: "#### Aliciamento para o fim de emigração", title: "Aliciamento para o Fim de Emigração" },
  { heading: "#### Aliciamento de trabalhadores de um local para outro do território nacional", title: "Aliciamento de Trabalhadores de um Local para Outro do Território Nacional" },
  { heading: "#### Ultraje a culto e impedimento ou perturbação de ato a ele relativo", title: "Ultraje a Culto e Impedimento ou Perturbação de Ato a Ele Relativo" },
  { heading: "#### Violação de direito autoral", title: "Violação de Direito Autoral" },
  { heading: "#### Fraude em licitação ou contrato", title: "Fraude em Licitação ou Contrato" },
  { heading: "#### Contratação inidônea", title: "Contratação Inidônea" },
  { heading: "#### Impedimento indevido", title: "Impedimento Indevido" },
  { heading: "#### Omissão grave de dado ou de informação por projetista", title: "Omissão Grave de Dado ou Informação por Projetista" },
]);

splitAtHeadings(byNumber.get(21).content_markdown, [
  { heading: "### Atentado à soberania", title: "Atentado à Soberania" },
  { heading: "### Atentado à integridade nacional", title: "Atentado à Integridade Nacional" },
  { heading: "### Espionagem", title: "Espionagem" },
  { heading: "#### Prestação de garantia graciosa", title: "Prestação de Garantia Graciosa" },
  { heading: "#### Não cancelamento de restos a pagar", title: "Não Cancelamento de Restos a Pagar" },
  { heading: "#### Aumento de despesa total com pessoal no último ano do mandato ou legislatura", title: "Aumento de Despesa Total com Pessoal no Último Ano do Mandato ou Legislatura" },
  { heading: "#### Oferta pública ou colocar de títulos no mercado", title: "Oferta Pública ou Colocação de Títulos no Mercado" },
]);

const orderedSections = [...assembled.values()];
const identityDocumentIndex = orderedSections.findIndex((section) => section.title === "Uso de Documento de Identidade Alheia");
const [identityDocument] = orderedSections.splice(identityDocumentIndex, 1);
const falseIdentityIndex = orderedSections.findIndex((section) => section.title === "Falsa Identidade");
orderedSections.splice(falseIdentityIndex + 1, 0, identityDocument);

const sections = orderedSections.map((section, index) => ({
  section_id: `${topicId}-sec-${String(index + 1).padStart(2, "0")}`,
  title: section.title,
  content_markdown: section.parts.filter(Boolean).join("\n\n---\n\n"),
  callouts: section.callouts,
  mnemonics: section.mnemonics,
  flashcards: section.flashcards,
  mermaid_mindmap: section.mermaid_mindmap,
}));

if (sections.length < 70) throw new Error(`Quantidade inesperada de crimes: ${sections.length}`);
if (new Set(sections.map((section) => section.title)).size !== sections.length) throw new Error("Há crimes duplicados");

await writeFile(outputPath, `${JSON.stringify({ ...source, sections }, null, 2)}\n`, "utf8");
console.log(`Arquivo reorganizado: ${outputPath}`);
console.log(`Seções antigas: ${source.sections.length}; crimes individualizados: ${sections.length}`);
