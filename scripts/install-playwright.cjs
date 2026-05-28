#!/usr/bin/env node
// Instala o Chromium em .playwright-browsers/ dentro do projeto.
// Isso garante que o binário esteja disponível tanto no build quanto
// no runtime do Render (que roda em containers separados).
const { execSync } = require("child_process");
const path = require("path");

const browsersPath = path.join(__dirname, "..", ".playwright-browsers");
process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

console.log("Instalando Chromium em:", browsersPath);
execSync("npx playwright install chromium", {
  stdio: "inherit",
  env: process.env,
});
