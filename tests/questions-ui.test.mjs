import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

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
});

test("área do aluno e landing expõem PROQuestões", async () => {
  const [navigation, landing, logo, netlify] = await Promise.all([
    read("src/components/navigation/dashboard-navigation.tsx"),
    read("src/components/landing/landing-page-content.tsx"),
    read("src/components/brand/pro-questions-logo.tsx"),
    read("netlify.toml"),
  ]);

  assert.match(navigation, /href:\s*"\/dashboard\/questoes"/);
  assert.match(navigation, /label:\s*"Questões"/);
  assert.match(landing, /function QuestionsPreview\(\)/);
  assert.match(landing, /PROQuestões/);
  assert.match(logo, /aria-label="PROQuestões"/);
  assert.equal((landing.match(/<BrandLogo preload \/>/gu) ?? []).length, 1);
  assert.match(
    netlify,
    /from = "\/favicon\.ico"[\s\S]*to = "\/resumos\/brand\/pro-resumos-favicon\.png"[\s\S]*status = 200/u,
  );
});
