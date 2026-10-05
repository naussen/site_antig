import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("assets do PRO Questões preservam transparência real", async () => {
  const assets = await Promise.all([
    readFile(new URL("../public/brand/pro-questoes-logo.png", import.meta.url)),
    readFile(new URL("../public/brand/pro-questoes-logo-dark.png", import.meta.url)),
    readFile(new URL("../public/brand/pro-questoes-icon.png", import.meta.url)),
  ]);

  for (const asset of assets) {
    assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(asset[25], 6);
  }
});

test("rota de questões exige acesso ao conteúdo e carrega uma questão", async () => {
  const source = await read("src/app/dashboard/questoes/page.tsx");

  assert.match(source, /requireContentAccess\(\)/);
  assert.match(source, /rpc\("list_questions"/);
  assert.match(source, /p_limit:\s*1/);
  assert.match(source, /rpc\("get_question_stats"\)/);
  assert.match(source, /rpc\("list_question_disciplines"\)/);
  assert.doesNotMatch(source, /from\("disciplines"\)/);
  assert.match(source, /initialError=/);
});

test("interface usa RPCs seguras e não consulta gabarito diretamente", async () => {
  const source = await read("src/app/dashboard/questoes/questions-client.tsx");

  assert.match(source, /rpc\("list_questions"/);
  assert.match(source, /"submit_question_answer"/);
  assert.match(source, /"set_question_preference"/);
  assert.match(source, /"get_question_stats"/);
  assert.doesNotMatch(source, /from\(["']question_answer_keys["']\)/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|rehype-raw|innerHTML/);
  assert.match(source, /pro-questions-shell/);
  assert.match(source, /px-3 py-6[\s\S]*sm:py-8[\s\S]*lg:py-8/);
  assert.doesNotMatch(source, /pt-20/);
  assert.match(source, /question-option-markdown/);
  assert.match(source, /question\.question_type === "true_false"/);
  assert.match(source, /aria-label="Questão anterior"/);
  assert.match(source, /aria-label="Próxima questão"/);
  assert.match(source, /setQuestionHistory\(\(history\) => \[\.\.\.history, question\]\)/);
  assert.match(source, /preserveCurrentOnEmpty:\s*true/);
});

test("área do aluno e landing expõem PROQuestões", async () => {
  const [navigation, landing, logo, netlify] = await Promise.all([
    read("src/components/navigation/dashboard-navigation.tsx"),
    read("src/components/landing/landing-page-content.tsx"),
    read("src/components/brand/pro-questions-logo.tsx"),
    read("netlify.toml"),
  ]);

  assert.match(navigation, /href:\s*"\/dashboard\/questoes"/);
  assert.match(navigation, /label:\s*"PRO Questões"/);
  assert.match(navigation, /label:\s*"PRO Questões", icon:\s*"Q"/);
  assert.doesNotMatch(navigation, /CircleHelp/);
  assert.match(navigation, /pathname\.startsWith\("\/dashboard\/questoes"\)/);
  assert.match(navigation, /<ProQuestionsLogo compact=\{isCollapsed\} tone=\{tone\} \/>/);
  assert.match(navigation, /aria-label="Ir para o início do PRO Questões"/);
  assert.match(
    navigation,
    /const primaryNavigationItems[\s\S]*label: "Início"[\s\S]*label: "PRO Questões"[\s\S]*label: "PRO Resumos"[\s\S]*const studyNavigationItems/,
  );
  assert.match(navigation, /href:\s*"\/landing", label:\s*"Início"/);
  assert.match(navigation, /Conta e preferências/);
  assert.match(landing, /function QuestionsPreview\(\)/);
  assert.match(landing, /PROQuestões/);
  assert.match(logo, /aria-label="PRO Questões"/);
  assert.match(logo, /pro-questoes-logo\.png/);
  assert.match(logo, /pro-questoes-logo-dark\.png/);
  assert.match(logo, /pro-questoes-icon\.png/);
  assert.equal((landing.match(/<BrandLogo preload \/>/gu) ?? []).length, 1);
  assert.match(
    netlify,
    /from = "\/favicon\.ico"[\s\S]*to = "\/resumos\/brand\/pro-resumos-favicon\.png"[\s\S]*status = 200/u,
  );
});
