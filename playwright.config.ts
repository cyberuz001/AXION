import { defineConfig } from "@playwright/test";

const port = 3130;

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: `http://127.0.0.1:${port}`, channel: process.env.AXION_BROWSER_CHANNEL },
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/api/tournaments`,
    env: { BLOB_READ_WRITE_TOKEN: "", AXION_ADMIN_PASSWORD: "", AXION_SESSION_SECRET: "" },
    timeout: 30000,
  },
});
