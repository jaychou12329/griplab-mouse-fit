import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dbPath = path.join(process.cwd(), "public", "mice-database.json");
const mice = JSON.parse(await readFile(dbPath, "utf8"));
const priced = mice.filter((mouse) => Number.isFinite(mouse.price));
const checkedAt = new Date().toISOString().slice(0, 10);

const tokens = (mouse) => new Set(`${mouse.model || ""} ${mouse.variant || ""}`.toLowerCase().match(/[a-z]+|\d+/g) || []);
const tokenCache = new Map(mice.map((mouse) => [mouse.handle, tokens(mouse)]));

function similarity(target, candidate) {
  let score = 0;
  if (target.brand === candidate.brand) score += 60;
  const left = tokenCache.get(target.handle);
  const right = tokenCache.get(candidate.handle);
  for (const token of left) if (right.has(token)) score += token.length > 2 ? 12 : 5;
  if (target.wireless === candidate.wireless) score += 8;
  if (target.shape === candidate.shape) score += 4;
  if (target.material === candidate.material) score += 5;
  if (target.sensor && candidate.sensor && target.sensor === candidate.sensor) score += 12;
  if (target.polling && candidate.polling) score += Math.max(0, 8 - Math.abs(Math.log2(target.polling / candidate.polling)) * 3);
  if (target.weight && candidate.weight) score += Math.max(0, 8 - Math.abs(target.weight - candidate.weight) / 8);
  return score;
}

function weightedEstimate(mouse) {
  const sameBrand = priced.filter((candidate) => candidate.brand === mouse.brand);
  const pool = sameBrand.length >= 2 ? sameBrand : priced;
  const nearest = pool
    .map((candidate) => ({ candidate, score: similarity(mouse, candidate) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, sameBrand.length >= 2 ? 5 : 8);
  const values = nearest.map(({ candidate }) => candidate.price).sort((a, b) => a - b);
  let estimate = values[Math.floor(values.length / 2)] || 299;

  if (mouse.material?.includes("magnesium")) estimate = Math.max(estimate, 899);
  if (mouse.material?.includes("carbon")) estimate = Math.max(estimate, 1099);
  if (mouse.polling >= 8000) estimate = Math.max(estimate, 299);
  if (!mouse.wireless && mouse.polling <= 1000 && mouse.dpi <= 16000) estimate = Math.min(estimate, 499);
  return Math.max(29, Math.min(2999, Math.round(estimate / 10) * 10));
}

let estimated = 0;
for (const mouse of mice) {
  if (Number.isFinite(mouse.price)) continue;
  mouse.price = weightedEstimate(mouse);
  mouse.priceType = "estimated";
  mouse.priceSource = "GRIPLAB 同品牌与同规格价格估算（官网及历史售价未找到）";
  mouse.priceCheckedAt = checkedAt;
  estimated++;
}

await writeFile(dbPath, JSON.stringify(mice));
console.log(JSON.stringify({ total: mice.length, researched: mice.filter((mouse) => mouse.priceType === "listed").length, legacy: mice.filter((mouse) => !mouse.priceType).length, estimated }));
