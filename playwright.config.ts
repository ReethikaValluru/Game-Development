import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3197",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: process.env.CHROMIUM_PATH
        ? [
            "--no-sandbox",
            "--no-zygote",
            "--single-process",
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
          ]
        : [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
          ],
    },
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3197/api/health",
    timeout: 30000,
    reuseExistingServer: false,
    env: { NODE_ENV: "production", PORT: "3197", ENABLE_AI: "false" },
  },
});
