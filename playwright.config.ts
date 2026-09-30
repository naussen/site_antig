import { defineConfig, devices } from "@playwright/test";

const port = 3199;
const baseURL = `http://127.0.0.1:${port}/resumos/`;

export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "test-results/visual",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.005,
      scale: "css",
    },
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    channel: "chrome",
    colorScheme: "light",
    locale: "pt-BR",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    timezoneId: "America/Sao_Paulo",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}landing/visual-regression`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "visual-regression-placeholder",
    },
  },
});
