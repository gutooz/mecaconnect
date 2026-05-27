/**
 * Remove o fundo branco de ceos.png via flood-fill a partir dos cantos.
 * Só pixels conectados ao exterior (fundo real) ficam transparentes.
 * Isso preserva camisas brancas e detalhes claros nas roupas.
 */
import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT  = resolve(__dirname, "../public/ceos.png");
const OUTPUT = resolve(__dirname, "../public/ceos-nobg.png");

const WHITE_THRESHOLD = 210; // pixel >= este valor em R,G,B é "branco"
const FEATHER = 30;          // faixa de suavização da borda (pixels)

async function main() {
  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  const pixels = new Uint8ClampedArray(data.buffer);

  const idx = (x, y) => (y * width + x) * channels;
  const isWhitish = (x, y) => {
    const i = idx(x, y);
    return pixels[i] >= WHITE_THRESHOLD &&
           pixels[i+1] >= WHITE_THRESHOLD &&
           pixels[i+2] >= WHITE_THRESHOLD;
  };

  // Flood-fill BFS a partir das 4 bordas
  const visited = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (x, y) => {
    const k = y * width + x;
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    if (visited[k]) return;
    if (!isWhitish(x, y)) return;
    visited[k] = 1;
    queue.push(x, y);
  };

  // Semear pelas 4 bordas
  for (let x = 0; x < width; x++)  { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }

  // BFS
  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    enqueue(x+1, y); enqueue(x-1, y);
    enqueue(x, y+1); enqueue(x, y-1);
  }

  // Calcular "distância da borda branca" para cada pixel de fundo
  // (para suavizar as bordas do recorte)
  // Passagem simples: distância Manhattan até o pixel não-visitado mais próximo
  const dist = new Float32Array(width * height).fill(Infinity);
  // Inicializa: borda entre fundo e sujeito tem dist=0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = y * width + x;
      if (!visited[k]) continue;
      // Se algum vizinho NÃO é fundo, este pixel está na borda
      if (
        (x > 0        && !visited[k - 1]) ||
        (x < width-1  && !visited[k + 1]) ||
        (y > 0        && !visited[k - width]) ||
        (y < height-1 && !visited[k + width])
      ) {
        dist[k] = 0;
      }
    }
  }
  // Propagação forward e backward
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const k = y * width + x;
      if (!visited[k]) continue;
      if (x > 0)      dist[k] = Math.min(dist[k], dist[k-1] + 1);
      if (y > 0)      dist[k] = Math.min(dist[k], dist[k-width] + 1);
    }
  for (let y = height-1; y >= 0; y--)
    for (let x = width-1; x >= 0; x--) {
      const k = y * width + x;
      if (!visited[k]) continue;
      if (x < width-1)  dist[k] = Math.min(dist[k], dist[k+1] + 1);
      if (y < height-1) dist[k] = Math.min(dist[k], dist[k+width] + 1);
    }

  // Aplicar transparência nos pixels de fundo
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = y * width + x;
      if (!visited[k]) continue;
      const i = k * channels;
      const d = dist[k];
      if (d >= FEATHER) {
        // Interior do fundo: totalmente transparente
        pixels[i+3] = 0;
      } else {
        // Borda: suaviza alpha de 0 (opaco) a 255 (transparente)
        pixels[i+3] = Math.round((d / FEATHER) * 255);
      }
    }
  }

  await sharp(Buffer.from(pixels.buffer), {
    raw: { width, height, channels }
  })
  .png()
  .toFile(OUTPUT);

  console.log(`✅  Salvo em: ${OUTPUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });
