import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rows = JSON.parse(await readFile(path.join(root, "public", "mice-database.json"), "utf8"));
const output = path.join(root, "public", "mouse-images");
const base = "https://qyjffrmfirkwcwempawu.supabase.co/storage/v1/render/image/public/images/products/";
await mkdir(output, { recursive: true });

const jobs = rows.filter((mouse) => mouse.image && mouse.handle);
let cursor = 0;
let downloaded = 0;
let skipped = 0;
let failed = 0;

async function worker() {
  while (cursor < jobs.length) {
    const mouse = jobs[cursor++];
    const target = path.join(output, `${mouse.handle}.webp`);
    try {
      await access(target);
      skipped++;
      continue;
    } catch {}
    const encodedFile = mouse.image.split("/").map(encodeURIComponent).join("/");
    const url = `${base}${encodedFile}?width=560&height=560&resize=contain`;
    let success = false;
    for (let attempt = 0; attempt < 3 && !success; attempt++) {
      try {
        const response = await fetch(url, { headers: { Accept: "image/webp,image/*" } });
        if (!response.ok) throw new Error(String(response.status));
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length < 100) throw new Error("empty image");
        await writeFile(target, bytes);
        downloaded++;
        success = true;
      } catch {
        if (attempt === 2) failed++;
      }
    }
    if ((downloaded + failed) % 100 === 0) process.stdout.write(`Processed ${downloaded + failed}/${jobs.length}\n`);
  }
}

await Promise.all(Array.from({ length: 12 }, worker));
process.stdout.write(`Finished: ${downloaded} downloaded, ${skipped} already present, ${failed} failed.\n`);
if (failed) process.exitCode = 1;
