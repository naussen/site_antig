import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1440]) {
  for (const theme of ["light", "dark", "sepia"]) {
    test(`questões: ${width}px / ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 950 });
      await page.context().addCookies([{ name: "pro-resumos-theme", value: theme, url: "http://127.0.0.1:3199" }]);
      await page.goto("landing/questions-visual-regression", { waitUntil: "networkidle" });
      const card = page.getByRole("article", { name: "Questão 1", exact: true });
      await expect(card).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(card.getByText("ID: visual:planilhas:084", { exact: true })).toBeVisible();
      await expect(card.getByRole("navigation", { name: "Caminho taxonômico da questão" })).toContainText("Planilhas");
      await expect(card.getByText("Assunto:", { exact: true })).toBeVisible();
      await expect(card.getByText("Texto-base", { exact: true })).toHaveCount(0);
      await expect(card.getByText("Enunciado", { exact: true })).toHaveCount(0);
      await expect(card.locator(".question-statement-markdown")).not.toContainText("Gabarito preliminar");
      await expect(card.getByText("Aviso na fonte: Gabarito preliminar divulgado", { exact: true })).toBeVisible();
      const geometry = await card.evaluate((article) => {
        const statement = article.querySelector(".question-statement-markdown")!;
        const option = article.querySelector(".question-option-markdown")!;
        const paragraph = option.querySelector("p")!;
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          statementWidth: statement.getBoundingClientRect().width,
          statementParagraphWidth: statement.querySelector("p")!.getBoundingClientRect().width,
          optionWidth: option.getBoundingClientRect().width,
          paragraphWidth: paragraph.getBoundingClientRect().width,
          optionFontSize: getComputedStyle(option).fontSize,
          headerWidth: article.querySelector("p")!.getBoundingClientRect().width,
          cardWidth: article.getBoundingClientRect().width,
        };
      });
      expect(geometry.overflow).toBe(false);
      expect(Math.abs(geometry.statementWidth - geometry.statementParagraphWidth)).toBeLessThan(2);
      expect(Math.abs(geometry.optionWidth - geometry.paragraphWidth)).toBeLessThan(2);
      expect(geometry.optionFontSize).toBe("16px");
      if (width < 640) expect(geometry.headerWidth).toBeGreaterThan(geometry.cardWidth * 0.7);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.screenshot({ path: `test-results/questions-${width}-${theme}.png`, fullPage: true });
    });
  }
}

test("filtro envia ID exato, mantém demais filtros e limpar remove o ID", async ({ page }) => {
  const calls: Array<{ p_question_identifier: string | null; p_search: string | null; p_exam_year: number | null }> = [];
  await page.route("**/rest/v1/rpc/list_questions_filtered_v2", async (route) => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ json: { items: [], next_cursor: null, total_count: 0 } });
  });
  await page.goto("landing/questions-visual-regression");
  await page.getByLabel("ID da questão", { exact: true }).fill("  visual:planilhas:084  ");
  await page.getByLabel("Buscar", { exact: true }).fill("colunas");
  await page.getByRole("combobox", { name: "Ano", exact: true }).selectOption("2021");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nenhuma questão encontrada" })).toBeVisible();
  expect(calls[0]).toMatchObject({ p_question_identifier: "visual:planilhas:084", p_search: "colunas", p_exam_year: 2021 });
  await page.getByRole("button", { name: "Limpar filtros", exact: true }).first().click();
  await expect.poll(() => calls.length).toBe(2);
  expect(calls[1]).toMatchObject({ p_question_identifier: null, p_search: null, p_exam_year: null });
});

test("revelar e fechar resposta não envia tentativa nem marca alternativa", async ({ page }) => {
  const rpcNames: string[] = [];
  await page.route("**/rest/v1/rpc/**", async (route) => {
    rpcNames.push(new URL(route.request().url()).pathname.split("/").at(-1)!);
    await route.fulfill({ json: { correct_option_id: "33333333-3333-4333-8333-333333333333", explanation_markdown: "Comentário de exemplo." } });
  });
  await page.goto("landing/questions-visual-regression");
  await page.getByRole("button", { name: "Ver resposta", exact: true }).click();
  await expect(page.getByText("Alternativa correta: B", { exact: true })).toBeVisible();
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.locator(".question-option.border-emerald-500")).toHaveCount(0);
  await page.getByRole("button", { name: "Fechar resposta", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ver resposta", exact: true })).toBeVisible();
  expect(rpcNames).toEqual(["get_question_answer"]);
});

test("Voltar e Avançar restauram os filtros e o resultado da lista", async ({ page }) => {
  await page.route("**/rest/v1/rpc/list_questions_filtered_v2", (route) =>
    route.fulfill({ json: { items: [], next_cursor: null, total_count: 0 } }),
  );
  await page.goto("landing/questions-visual-regression");
  const question = page.getByRole("article", { name: "Questão 1", exact: true });
  const identifier = page.getByLabel("ID da questão", { exact: true });
  const empty = page.getByRole("heading", { name: "Nenhuma questão encontrada" });

  await expect(question).toBeVisible();
  await identifier.fill("visual:inexistente");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(empty).toBeVisible();
  await expect(page).toHaveURL(/id=visual%3Ainexistente/);

  await page.goBack();
  await expect(question).toBeVisible();
  await expect(identifier).toHaveValue("");
  await expect(page).not.toHaveURL(/[?&]id=/);

  await page.goForward();
  await expect(empty).toBeVisible();
  await expect(identifier).toHaveValue("visual:inexistente");
  await expect(page).toHaveURL(/id=visual%3Ainexistente/);
});

test("atalhos mantêm filtros e a remoção atualiza somente o filtro escolhido", async ({ page }) => {
  const calls: Array<Record<string, unknown>> = [];
  await page.route("**/rest/v1/rpc/list_questions_filtered_v2", async (route) => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ json: { items: [], next_cursor: null, total_count: 0 } });
  });
  await page.goto("landing/questions-visual-regression");
  await page.getByLabel("Buscar", { exact: true }).fill("colunas");
  await page.getByRole("combobox", { name: "Ano", exact: true }).selectOption("2021");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  const shortcuts = page.getByRole("group", { name: "Atalhos de prática e revisão" });
  await shortcuts.getByRole("button", { name: "Marcadas" }).click();
  await expect(shortcuts.getByRole("button", { name: "Marcadas" })).toHaveAttribute("aria-pressed", "true");
  expect(calls[1]).toMatchObject({ p_review_filter: "marked", p_exam_year: 2021, p_search: "colunas" });
  await page.getByRole("button", { name: "Remover filtro Ano: 2021" }).click();
  await expect(page.getByRole("button", { name: "Remover filtro Ano: 2021" })).toHaveCount(0);
  expect(calls[2]).toMatchObject({ p_review_filter: "marked", p_exam_year: null, p_search: "colunas" });
  await page.goBack();
  await expect(page.getByRole("button", { name: "Remover filtro Ano: 2021" })).toBeVisible();
  await expect(shortcuts.getByRole("button", { name: "Marcadas" })).toHaveAttribute("aria-pressed", "true");
});

test("copia o link direto da questão sem filtros adicionais", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("landing/questions-visual-regression?ano=2021&modo=5", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Copiar link da questão" }).click();
  await expect(page.getByRole("status")).toHaveText("Link copiado");
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).pathname).toBe("/resumos/dashboard/questoes");
  expect(new URL(link).search).toBe("?id=visual%3Aplanilhas%3A084");
});

test("revisão do dia abre fila de cinco e permite deixar para depois", async ({ page }) => {
  const calls: Array<Record<string, unknown>> = [];
  await page.route("**/rest/v1/rpc/list_questions_filtered_v2", async (route) => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ json: { items: [], next_cursor: null, total_count: 0 } });
  });
  await page.goto("landing/questions-visual-regression", { waitUntil: "networkidle" });
  await page.getByRole("group", { name: "Atalhos de prática e revisão" }).getByRole("button", { name: "Revisão do dia" }).click();
  await expect(page.getByRole("heading", { name: "Nenhuma questão pronta para revisão" })).toBeVisible();
  expect(calls).toEqual([expect.objectContaining({ p_review_filter: "routine", p_limit: 5, p_include_hidden: false })]);
  await expect(page.getByRole("button", { name: "Uma por vez" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Revisar mais tarde" })).toHaveAttribute("href", "/resumos/dashboard");
});
