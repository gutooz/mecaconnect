import path from "path";
import { chromium, type Browser } from "playwright";

// Aponta para o path onde scripts/install-playwright.cjs instalou o Chromium.
// Precisa ser definido antes de chromium.launch() ser chamado.
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(process.cwd(), ".playwright-browsers");

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) return browser;

  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  browser.on("disconnected", () => {
    browser = null;
  });

  return browser;
}
