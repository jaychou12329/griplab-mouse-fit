import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const catalog = JSON.parse(await readFile(path.join(root, "public", "mice-database.json"), "utf8"));
const response = await fetch("https://www.eloshapes.com/__sitemap__/compareMice.xml", {
  headers: { "user-agent": "GRIPLAB catalog monitor/1.0" },
});
if (!response.ok) throw new Error(`EloShapes sitemap request failed: ${response.status}`);

const xml = await response.text();
const upstream = new Set(
  [...xml.matchAll(/\/mouse\/compare\?p=([^<&]+)/g)].map((match) => decodeURIComponent(match[1])),
);
const local = new Set(catalog.map((mouse) => mouse.handle));
const newHandles = [...upstream].filter((handle) => !local.has(handle)).sort();
const removedHandles = [...local].filter((handle) => !upstream.has(handle)).sort();
const report = {
  checkedAt: new Date().toISOString(),
  upstreamCount: upstream.size,
  localCount: local.size,
  newHandles,
  removedHandles,
};

await mkdir(path.join(root, "work"), { recursive: true });
await writeFile(path.join(root, "work", "catalog-watch.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (process.env.GITHUB_OUTPUT) {
  await writeFile(process.env.GITHUB_OUTPUT, `new_count=${newHandles.length}\n`, { flag: "a" });
}
