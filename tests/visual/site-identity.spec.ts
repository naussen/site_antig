import { expect, test } from "@playwright/test";

const themes = ["light", "dark", "sepia"] as const;
const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
] as const;

for (const viewport of viewports) {
  for (const theme of themes) {
    test(`${viewport.name}px — ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const response = await page.goto("landing/visual-regression", {
        waitUntil: "networkidle",
      });
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId("visual-regression-fixture")).toBeVisible();
      await page.evaluate((selectedTheme) => {
        document.documentElement.setAttribute("data-theme", selectedTheme);
        localStorage.setItem("study-platform-theme", selectedTheme);
      }, theme);
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-delay: 0s !important;
            animation-duration: 0s !important;
            caret-color: transparent !important;
            transition: none !important;
          }
          nextjs-portal { display: none !important; }
        `,
      });
      await page.evaluate(async () => {
        await document.fonts.ready;
      });

      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

      await expect(page).toHaveScreenshot(
        `site-${viewport.name}-${theme}.png`,
        { fullPage: true },
      );
    });
  }
}
