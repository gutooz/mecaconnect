import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getBrowser } from "@/lib/browser";

const KEPLACA_URL = "https://www.keplaca.com/placa/";

const CAMPOS_DESEJADOS = new Set([
  "Marca", "Modelo", "Importado", "Ano", "Combustível",
  "Chassi", "UF", "Município", "Cor",
]);

// Usa Playwright (Chromium real) para bypass do Cloudflare.
// O TLS fingerprint e os headers são idênticos a um Chrome legítimo.
async function buscarPagina(url: string): Promise<{ status: number; html: string }> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    const status = response?.status() ?? 200;
    const html = await page.content();
    return { status, html };
  } finally {
    await page.close();
  }
}

// HTML do keplaca.com: <table class="fipeTablePriceDetail">
//   <tr><td><b>Marca:</b></td><td>HONDA</td></tr> ...
function parsearHTML(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const dados: Record<string, string> = {};

  $("table.fipeTablePriceDetail").first().find("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 2) return;
    const label = tds.eq(0).text().trim().replace(/:$/, "");
    const valor = tds.eq(1).text().trim();
    if (CAMPOS_DESEJADOS.has(label) && valor) {
      dados[label] = valor;
    }
  });

  return dados;
}

function normalizarCombustivel(valor: string): string {
  const v = valor.toLowerCase();
  if (v.includes("flex") || (v.includes("gasolina") && v.includes("álcool"))) return "Flex";
  if (v.includes("gasolina")) return "Gasolina";
  if (v.includes("álcool") || v.includes("etanol")) return "Etanol";
  if (v.includes("diesel")) return "Diesel";
  if (v.includes("gnv") || v.includes("gás natural")) return "GNV";
  if (v.includes("elétrico") || v.includes("eletrico")) return "Elétrico";
  if (v.includes("híbrido") || v.includes("hibrido")) return "Híbrido";
  return valor;
}

export async function GET(request: NextRequest) {
  const placa = request.nextUrl.searchParams.get("placa");
  if (!placa) {
    return NextResponse.json({ error: "Placa não informada" }, { status: 400 });
  }

  const normalizada = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(normalizada)) {
    return NextResponse.json({ error: "Formato de placa inválido" }, { status: 400 });
  }

  try {
    const { status, html } = await buscarPagina(`${KEPLACA_URL}${normalizada}`);

    if (status === 404) {
      return NextResponse.json({ error: "Placa não encontrada" }, { status: 404 });
    }
    if (status !== 200) {
      console.error(`[consultar-placa] keplaca.com retornou HTTP ${status} para ${normalizada}`);
      return NextResponse.json(
        { error: `Serviço de consulta indisponível (HTTP ${status})` },
        { status: 502 }
      );
    }

    const campos = parsearHTML(html);

    if (Object.keys(campos).length === 0) {
      return NextResponse.json({ error: "Placa não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      placa: normalizada,
      brand: campos["Marca"] ?? null,
      model: campos["Modelo"] ?? null,
      year: campos["Ano"] ? parseInt(campos["Ano"], 10) || null : null,
      fuel_type: campos["Combustível"] ? normalizarCombustivel(campos["Combustível"]) : null,
      chassis: campos["Chassi"] ?? null,
      color: campos["Cor"] ?? null,
      uf: campos["UF"] ?? null,
      municipio: campos["Município"] ?? null,
      importado: campos["Importado"] ?? null,
    });
  } catch (err) {
    console.error("[consultar-placa] Erro:", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao serviço de consulta de placas" },
      { status: 503 }
    );
  }
}
