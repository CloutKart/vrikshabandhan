import { defineConfig, devices } from "@playwright/test";

const port = 3000;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    // The subscribe invitation has already been seen in every test; e2e/newsletter.spec.ts opts back in.
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${port}`, localStorage: [{ name: "va-newsletter", value: "seen" }] }] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: `http://localhost:${port}/en`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
