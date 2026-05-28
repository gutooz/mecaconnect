import { existsSync, readdirSync } from "fs";
import path from "path";
import { chromium, type Browser } from "playwright";

// Playwright inicializa o registro de browsers no import, antes de qualquer
// atribuição ao process.env. Por isso usamos executablePath para apontar
// diretamente ao binário instalado pelo scripts/install-playwright.cjs.
function findChromiumExecutable(): string | undefined {
  const browsersDir = path.join(process.cwd(), ".playwright-browsers");
  if (!existsSync(browsersDir)) {
    console.warn("[browser] .playwright-browsers/ não encontrado em", process.cwd());
    return undefined;
  }

  for (const entry of readdirSync(browsersDir)) {
    const candidates = [
      path.join(browsersDir, entry, "chrome-headless-shell-linux64", "chrome-headless-shell"),
      path.join(browsersDir, entry, "chrome-linux64", "chrome"),
      path.join(browsersDir, entry, "chrome-linux", "chrome"),
    ];
    const found = candidates.find((c) => existsSync(c));
    if (found) return found;
  }

  console.warn("[browser] Nenhum executável encontrado em", browsersDir);
  return undefined;
}

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) return browser;

  const executablePath = findChromiumExecutable();
  if (executablePath) {
    console.log("[browser] Chromium em:", executablePath);
  } else {
    console.warn("[browser] Usando path padrão do Playwright (pode falhar)");
  }

  browser = await chromium.launch({
    executablePath,
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
