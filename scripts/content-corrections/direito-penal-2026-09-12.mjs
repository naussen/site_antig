import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve("tmp/penal-review-2026-09-12");
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const verifyCurrent = args.has("--verify-current");

if (apply && !args.has("--confirm-direito-penal")) {
  throw new Error("Para aplicar, informe --apply --confirm-direito-penal.");
}

const corrections = {
  "do-crime-sec-02": [[
    "Este é o critério adotado no Código Penal Brasileiro.",
    "Esse critério decorre do art. 1º da Lei de Introdução ao Código Penal e à Lei das Contravenções Penais.",
  ]],
  "parte-especial-do-codigo-penal-sec-01": [[
    "  5. **Homicídio Funcional:** Praticado contra agentes de segurança pública, membros das Forças Armadas ou do sistema prisional, no exercício da função ou em decorrência dela; ou contra cônjuge, companheiro ou parente consanguíneo até o 3º grau, em razão dessa condição.\n  6. **Feminicídio:** Praticado contra a mulher por razões da condição de sexo feminino, caracterizadas por:\n     * Violência doméstica e familiar.\n     * Menosprezo ou discriminação à condição de mulher.\n  7. Praticado com o emprego de arma de fogo de uso restrito ou proibido.\n  8. Praticado contra menor de 14 (quatorze) anos.",
    "  5. **Homicídio funcional:** Praticado contra agentes indicados nos arts. 142 e 144 da Constituição, integrantes do sistema prisional e da Força Nacional de Segurança Pública, no exercício da função ou em decorrência dela, ou contra cônjuge, companheiro ou parente consanguíneo até o 3º grau, em razão dessa condição. A qualificadora também alcança membros do Judiciário, Ministério Público, Defensoria Pública, Advocacia Pública e oficiais de justiça, nas hipóteses legais.\n  6. Praticado com o emprego de arma de fogo de uso restrito ou proibido.\n  7. Praticado contra menor de 14 (quatorze) anos.\n  8. Praticado nas dependências de instituição de ensino.",
  ], [
    "*Nota de relevância:* É juridicamente possível a coexistência de circunstâncias qualificadoras e privilegiadoras no mesmo crime de homicídio (homicídio híbrido).",
    "*Nota de relevância:* É juridicamente possível a coexistência de circunstâncias qualificadoras objetivas e privilegiadoras no mesmo crime de homicídio (homicídio híbrido).\n\n### Feminicídio (Art. 121-A)\nDesde a Lei nº 14.994/2024, o feminicídio é crime autônomo: matar mulher por razões da condição do sexo feminino, presentes violência doméstica e familiar ou menosprezo ou discriminação à condição de mulher.\n* **Pena:** Reclusão, de 20 a 40 anos.\n\n### Vicaricídio (Art. 121-B)\nConsiste em matar descendente, ascendente, dependente, enteado ou pessoa sob guarda ou responsabilidade direta da mulher, com o fim específico de causar-lhe sofrimento, punição ou controle, no contexto de violência doméstica e familiar.\n* **Pena:** Reclusão, de 20 a 40 anos.",
  ]],
  "parte-especial-do-codigo-penal-sec-02": [[
    "*   Durante a gestação ou nos 3 meses posteriores ao parto;\n*   Contra maior de 60 anos, pessoa com deficiência (PCD) ou portadora de doenças degenerativas;\n*   Na presença física ou virtual de descendente ou de ascendente da vítima;\n*   Em descumprimento das medidas protetivas de urgência.",
    "*   Durante a gestação, nos 3 meses posteriores ao parto ou se a vítima é mãe ou responsável por criança, adolescente ou pessoa com deficiência de qualquer idade;\n*   Contra pessoa menor de 14 anos, maior de 60 anos, com deficiência ou portadora de doença degenerativa que acarrete condição limitante ou vulnerabilidade física ou mental;\n*   Na presença física ou virtual de descendente ou de ascendente da vítima;\n*   Em descumprimento das medidas protetivas de urgência previstas no art. 22, I a III, da Lei Maria da Penha;\n*   Com emprego de veneno, fogo, explosivo, asfixia, tortura ou outro meio insidioso ou cruel, mediante recurso que dificulte a defesa da vítima ou com emprego de arma de fogo de uso restrito ou proibido.",
  ]],
  "parte-especial-do-codigo-penal-sec-03": [[
    "*   **Pena aumentada da metade:** Se o agente é líder ou coordenador de grupo ou de rede virtual.",
    "*   **Pena em dobro:** Se o autor é líder, coordenador ou administrador de grupo, comunidade ou rede virtual, ou por estes é responsável.",
  ], [
    "*Exceção:* Se a conduta for praticada contra menor de 14 anos, a pena passa a ser de reclusão, de 2 a 8 anos.",
    "*Regra especial:* Se a conduta contra menor de 14 anos ou pessoa sem discernimento ou resistência resultar lesão gravíssima, o agente responde pelo art. 129, § 2º, do Código Penal.",
  ]],
  "parte-especial-do-codigo-penal-sec-04": [[
    "contra ascendente, descendente, irmão, cônjuge ou companheiro, ou com quem o agente conviva ou tenha convivido, ou, ainda, prevalecendo-se o agente das relações domésticas, de coabitação ou de hospitalidade.",
    "contra ascendente, descendente, irmão, cônjuge ou companheiro, pessoa com relação de trabalho doméstico ou com quem o agente conviva ou tenha convivido, ou, ainda, prevalecendo-se das relações domésticas, de trabalho doméstico, de coabitação ou de hospitalidade.",
  ], [
    "*   **Pena:** Detenção, de 3 meses a 3 anos.",
    "*   **Pena:** Reclusão, de 2 a 5 anos.",
  ], [
    "*   **Pena:** Reclusão, de 1 a 4 anos.",
    "*   **Pena:** Reclusão, de 2 a 5 anos.",
  ]],
  "parte-especial-do-codigo-penal-sec-07": [[
    "### Disposições Comuns",
    "### Disposições Comuns aos Crimes Contra a Honra",
  ], [
    "| **Constrangimento ilegal** (Art. 146) | Constranger alguém, mediante violência ou grave ameaça, ou depois de lhe haver reduzido, por qualquer outro meio, a capacidade de resistência, a não fazer o que a lei permite, ou a fazer o que ela não manda. | |",
    "| **Constrangimento ilegal** (Art. 146) | Constranger alguém, mediante violência ou grave ameaça, ou depois de lhe haver reduzido, por qualquer outro meio, a capacidade de resistência, a não fazer o que a lei permite, ou a fazer o que ela não manda. | Detenção de 3 meses a 1 ano, ou multa. |",
  ], [
    "Reclusão de 2 a 8 anos, multa e pena correspondente à violência.; ; **Aumento de pena de 1/2:**; • Contra criança ou adolescente;; • Por preconceito de raça, cor, etnia, religião ou origem.; ; **Mesma Pena:**; • Cerceia o uso de qualquer meio de transporte por parte do trabalhador, com o fim de retê-lo no local de trabalho.; • Mantém vigilância ostensiva no local de trabalho ou se apodera de documentos ou objetos pessoais do trabalhador, com o fim de retê-lo no local de trabalho.",
    "Reclusão de 2 a 8 anos, multa e pena correspondente à violência. A pena aumenta pela metade se o crime é cometido contra criança ou adolescente ou por preconceito de raça, cor, etnia, religião ou origem. Incorre na mesma pena quem cerceia transporte, mantém vigilância ostensiva ou retém documentos ou objetos pessoais para manter o trabalhador no local.",
  ]],
  "parte-especial-do-codigo-penal-sec-10": [[
    "Se a violência resulta em imagem ou lesão corporal de natureza grave.",
    "Se da violência resulta lesão corporal de natureza grave.",
  ]],
  "parte-especial-do-codigo-penal-sec-16": [[
    "número de chassi, monobloco, motor, placa ou qualquer sinal identificador de veículo, suas combinações, componentes ou equipamentos",
    "número de chassi, monobloco, motor, placa de identificação ou qualquer sinal identificador de veículo automotor, elétrico, híbrido, de reboque, de semirreboque ou de suas combinações, bem como de seus componentes ou equipamentos",
  ], [
    "O funcionário público que contribui para o licensing ou registro do veículo com sinal identificador adulterado ou remarcado, fornecendo insumos, informações ou facilitando a ação.",
    "O funcionário público que contribui para o licenciamento ou registro do veículo remarcado ou adulterado, fornecendo indevidamente material ou informação oficial.",
  ], [
    "Quem adquire, recebe, transporta, conduz, oculta, mantém em depósito, importa, exporta, de qualquer forma utiliza em proveito próprio ou alheio, ou vende instrumento destinado à falsificação ou adulteração.",
    "Quem adquire, recebe, transporta, oculta, mantém em depósito, fabrica, fornece, possui ou guarda maquinismo, aparelho, instrumento ou objeto especialmente destinado à falsificação ou adulteração.",
  ], [
    "  * **Figuras Equiparadas:** Nas mesmas penas incorre quem permite ou facilita, por qualquer meio, o acesso de pessoas não autorizadas às informações mencionadas.\n  * **Causas de Aumento de Pena:**\n    * Aumenta-se a pena de 1/3 se o fato é cometido por funcionário público.\n    * Aumenta-se a pena de 1/3 se o crime é cometido no exercício da função pública.",
    "  * **Pena:** Reclusão, de 1 a 4 anos, e multa.\n  * **Figura equiparada:** Nas mesmas penas incorre quem permite ou facilita, por qualquer meio, o acesso de pessoas não autorizadas às informações mencionadas.\n  * **Forma qualificada:** Se da ação ou omissão resulta dano à Administração Pública, a pena é de reclusão, de 2 a 6 anos, e multa.\n  * **Causa de aumento:** A pena aumenta em 1/3 se o fato é cometido por funcionário público.",
  ]],
  "parte-especial-do-codigo-penal-sec-20": [[
    "*   A comunicação falsa dirigida à Polícia Militar (PM) não configura este delito.",
    "*   A comunicação dirigida à Polícia Militar pode configurar o delito quando provoca atuação da autoridade e o agente sabe que o crime ou a contravenção não ocorreu.",
  ]],
};

const files = ["da-lei-penal.json", "do-crime.json", "parte-especial-do-codigo-penal.json"];

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function replaceExact(value, from, to, sectionId) {
  const occurrences = value.split(from).length - 1;
  if (occurrences !== 1) throw new Error(`Esperada 1 ocorrência em ${sectionId}; encontradas ${occurrences}: ${from}`);
  return value.replace(from, to);
}

const expectedSections = [];
const plannedUpdates = [];
const payloadFiles = [];
let replacementCount = 0;

for (const file of files) {
  const filePath = path.join(root, file);
  const payload = JSON.parse(await readFile(filePath, "utf8"));
  payloadFiles.push({ filePath, payload });
  for (const section of payload.sections) {
    const originalContent = section.content_markdown;
    if (!verifyCurrent) {
      for (const [from, to] of corrections[section.section_id] ?? []) {
        section.content_markdown = replaceExact(section.content_markdown, from, to, section.section_id);
        replacementCount += 1;
      }
    }
    expectedSections.push({ sectionId: section.section_id, content: section.content_markdown, callouts: section.callouts ?? [] });
    if (!verifyCurrent && section.content_markdown !== originalContent) {
      plannedUpdates.push({ sectionId: section.section_id, originalContent, originalCallouts: structuredClone(section.callouts ?? []), correctedContent: section.content_markdown, correctedCallouts: structuredClone(section.callouts ?? []) });
    }
  }
}

if (!verifyCurrent && replacementCount !== 18) throw new Error(`Quantidade inesperada de correções: ${replacementCount}; esperado: 18.`);

const supabase = createClient(requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"), requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"), { auth: { autoRefreshToken: false, persistSession: false } });

if (verifyCurrent) {
  const { data, error } = await supabase.from("sections").select("section_id,content_markdown,callouts").in("section_id", expectedSections.map(({ sectionId }) => sectionId));
  if (error) throw new Error(`Falha ao verificar persistência: ${error.message}`);
  const liveById = new Map(data.map((section) => [section.section_id, section]));
  for (const expected of expectedSections) {
    const live = liveById.get(expected.sectionId);
    if (!live || live.content_markdown !== expected.content || JSON.stringify(live.callouts ?? []) !== JSON.stringify(expected.callouts)) throw new Error(`Divergência após persistência em ${expected.sectionId}.`);
  }
  console.log(`Persistência confirmada em ${expectedSections.length} seções de Direito Penal.`);
} else {
  for (const { filePath, payload } of payloadFiles) await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Correções preparadas: ${replacementCount} substituições em ${plannedUpdates.length} seções.`);
  if (!apply) {
    console.log("Prévia concluída; nenhuma escrita foi feita no Supabase.");
  } else {
    const sectionIds = plannedUpdates.map(({ sectionId }) => sectionId);
    const { data: liveSections, error: readError } = await supabase.from("sections").select("section_id,content_markdown,callouts").in("section_id", sectionIds);
    if (readError) throw new Error(`Falha ao conferir conteúdo atual: ${readError.message}`);
    if (liveSections.length !== sectionIds.length) throw new Error(`Foram encontradas ${liveSections.length} de ${sectionIds.length} seções esperadas.`);
    const liveById = new Map(liveSections.map((section) => [section.section_id, section]));
    for (const update of plannedUpdates) {
      const live = liveById.get(update.sectionId);
      const originalMatches = live.content_markdown === update.originalContent && JSON.stringify(live.callouts ?? []) === JSON.stringify(update.originalCallouts);
      const correctedMatches = live.content_markdown === update.correctedContent && JSON.stringify(live.callouts ?? []) === JSON.stringify(update.correctedCallouts);
      if (!originalMatches && !correctedMatches) throw new Error(`Conteúdo concorrente detectado em ${update.sectionId}; nenhuma escrita iniciada.`);
    }
    let updatedSections = 0;
    for (const update of plannedUpdates) {
      const live = liveById.get(update.sectionId);
      if (live.content_markdown === update.correctedContent) continue;
      const { error } = await supabase.from("sections").update({ content_markdown: update.correctedContent, callouts: update.correctedCallouts }).eq("section_id", update.sectionId);
      if (error) throw new Error(`Falha ao atualizar ${update.sectionId}: ${error.message}`);
      updatedSections += 1;
    }
    console.log(`Supabase atualizado: ${updatedSections} seções; flashcards e demais campos preservados.`);
  }
}
