import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dbPath = path.join(root, "public", "mice-database.json");
const mice = JSON.parse(await readFile(dbPath, "utf8"));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const checkedAt = new Date().toISOString().slice(0, 10);

const home = await (await fetch("https://www.eloshapes.com/")).text();
const apiKey = home.match(/supabase:\{url:"[^"]+",key:"([^"]+)"/)?.[1];
if (!apiKey) throw new Error("Could not read the public EloShapes data key");

const endpoint = new URL("https://qyjffrmfirkwcwempawu.supabase.co/rest/v1/products_available_v14_c6bo7");
endpoint.searchParams.set("select", "general__handle,general__affiliate_links");
endpoint.searchParams.set("general__category", "eq.mouse");
const upstream = [];
for (let offset = 0; ; offset += 1000) {
  const response = await fetch(endpoint, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Range: `${offset}-${offset + 999}`, "Range-Unit": "items" },
  });
  if (!response.ok) throw new Error(`EloShapes price-link fetch failed: ${response.status}`);
  const page = await response.json();
  upstream.push(...page);
  if (page.length < 1000) break;
}

const linksByHandle = new Map(upstream.map((row) => [row.general__handle, row.general__affiliate_links || []]));
const rateResponse = await fetch("https://api.frankfurter.app/latest?from=CNY");
const rateData = rateResponse.ok ? await rateResponse.json() : { rates: {} };
const cnyRates = { CNY: 1, ...rateData.rates, TWD: 4.5, KRW: 190, PHP: 8.1, HKD: 1.08, INR: 12.0, IDR: 2250, MYR: 0.59, THB: 4.55 };

function normalizeCurrency(value) {
  const currency = String(value || "").trim().toUpperCase();
  return currency === "RMB" || currency === "CNH" ? "CNY" : currency;
}

function priceFromProduct(value) {
  if (!value || typeof value !== "object") return null;
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  if (types.some((type) => String(type).toLowerCase() === "product")) {
    const offers = Array.isArray(value.offers) ? value.offers : [value.offers];
    for (const offer of offers.filter(Boolean)) {
      const price = Number(offer.price ?? offer.lowPrice ?? offer.highPrice);
      const currency = normalizeCurrency(offer.priceCurrency);
      if (Number.isFinite(price) && price > 0 && currency) return { price, currency };
    }
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      if (Array.isArray(child)) {
        for (const item of child) {
          const found = priceFromProduct(item);
          if (found) return found;
        }
      } else {
        const found = priceFromProduct(child);
        if (found) return found;
      }
    }
  }
  return null;
}

function parsePrice(html) {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const found = priceFromProduct(JSON.parse(match[1].replaceAll("&quot;", '"')));
      if (found) return found;
    } catch {}
  }
  const amount = html.match(/property=["']product:price:amount["'][^>]+content=["']([0-9.,]+)["']/i)?.[1]
    ?? html.match(/content=["']([0-9.,]+)["'][^>]+property=["']product:price:amount["']/i)?.[1];
  const currency = html.match(/property=["']product:price:currency["'][^>]+content=["']([A-Z]{3})["']/i)?.[1]
    ?? html.match(/content=["']([A-Z]{3})["'][^>]+property=["']product:price:currency["']/i)?.[1];
  if (amount && currency) {
    const price = Number(amount.replace(/,(?=\d{3}\b)/g, "").replace(",", "."));
    if (Number.isFinite(price) && price > 0) return { price, currency: normalizeCurrency(currency) };
  }
  return null;
}

function linkPriority(link) {
  const host = (() => { try { return new URL(link.url).hostname; } catch { return ""; } })();
  if (/amazon|amzn|aliexpress|bit\.ly|awin1|goaff/i.test(host)) return 3;
  if (/maxgaming|maxesport|mechanicalkeyboards|deskhero|minixpc/i.test(host)) return 2;
  return 1;
}

async function research(mouse) {
  const links = [...(linksByHandle.get(mouse.handle) || [])].sort((a, b) => linkPriority(a) - linkPriority(b)).slice(0, 4);
  for (const link of links) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(link.url, { redirect: "follow", signal: controller.signal, headers: { "user-agent": "Mozilla/5.0 GRIPLAB price research" } });
      if (!response.ok) continue;
      const html = await response.text();
      const found = parsePrice(html);
      if (!found || !cnyRates[found.currency]) continue;
      const converted = found.currency === "CNY" ? found.price : found.price / cnyRates[found.currency];
      if (!Number.isFinite(converted) || converted < 10 || converted > 10000) continue;
      return {
        price: converted >= 100 ? Math.round(converted / 10) * 10 : Math.round(converted),
        priceOriginal: found.price,
        priceCurrency: found.currency,
        priceSource: response.url || link.url,
        priceType: "listed",
        priceCheckedAt: checkedAt,
      };
    } catch {
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

const targets = mice.filter((mouse) => mouse.price == null).slice(0, limit);
let cursor = 0;
let found = 0;
async function worker() {
  while (cursor < targets.length) {
    const mouse = targets[cursor++];
    const result = await research(mouse);
    if (result) {
      Object.assign(mouse, result);
      found++;
    }
    if (cursor % 50 === 0) process.stdout.write(`Checked ${cursor}/${targets.length}; found ${found}\n`);
  }
}
await Promise.all(Array.from({ length: 32 }, worker));
await writeFile(dbPath, JSON.stringify(mice));
console.log(JSON.stringify({ checked: targets.length, found, remaining: mice.filter((mouse) => mouse.price == null).length }));
