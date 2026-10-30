import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("scratch/snapshot_quantitativas_82.json", "utf8"));

// Regras semânticas básicas para classificação:
// 1. Matematica: aritmetica, algebra, fracoes, porcentagem simples, geometria, trigonometria, funcoes, matrizes, combinatoria/probabilidade basica (contexto matematico).
// 2. Raciocinio Logico: proposicoes, conectivos (se entao, ou, e, se e somente se), tautologias, silogismos, diagramas de Venn, sequencias logicas, verdade/mentira.
// 3. Estatistica: media, mediana, moda, variancia, desvio padrao, distribuicoes (normal, binomial, poisson), estimadores, regressao, teste de hipoteses, covariancia, amostragem.
// 4. Matematica Financeira: juros simples, juros compostos, taxa nominal/efetiva, amortizacao (SAC, Price), valor presente liquido (VPL), TIR, descontos (comercial, racional).

console.log(`Classificando semanticamente ${data.length} questoes...\n`);

const counts = {
  matematica: 0,
  "raciocinio-logico": 0,
  estatistica: 0,
  "matematica-financeira": 0,
};

const doubts = [];
const summaryByTopic = {
  matematica: [],
  "raciocinio-logico": [],
  estatistica: [],
  "matematica-financeira": [],
};

for (const q of data) {
  counts[q.proposed_slug] = (counts[q.proposed_slug] || 0) + 1;
  const item = {
    external_id: q.external_id,
    subject: q.subject,
    topic: q.topic_id,
    proposed_discipline: q.proposed_slug,
    snippet: q.statement_markdown.substring(0, 140).replace(/\n/g, " "),
    board: q.exam_board,
    inst: q.institution,
  };
  summaryByTopic[q.proposed_slug]?.push(item);
}

console.log("Contagens por disciplina proposta:", counts);

fs.writeFileSync("scratch/semantic_review_summary.json", JSON.stringify(summaryByTopic, null, 2));
console.log("Resumo salvo em scratch/semantic_review_summary.json");
