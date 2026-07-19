import { writeFile } from "node:fs/promises";

const key = process.env.ELOSHAPES_SUPABASE_KEY;
if (!key) throw new Error("ELOSHAPES_SUPABASE_KEY is required");

const endpoint = new URL("https://qyjffrmfirkwcwempawu.supabase.co/rest/v1/products_available_v14_c6bo7");
endpoint.searchParams.set("select", "general__handle,mouse__top_view,mouse__side_view,mouse__back_view");
endpoint.searchParams.set("general__category", "eq.mouse");
endpoint.searchParams.set("order", "general__handle.asc");

const rows = [];
for (let offset = 0; ; offset += 1000) {
  const response = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Range: `${offset}-${offset + 999}`,
      "Range-Unit": "items",
    },
  });
  if (!response.ok) throw new Error(`Shape sync failed: ${response.status}`);
  const page = await response.json();
  rows.push(...page);
  if (page.length < 1000) break;
}

const shapes = Object.fromEntries(rows.map((row) => [row.general__handle, {
  top: row.mouse__top_view || null,
  side: row.mouse__side_view || null,
  back: row.mouse__back_view || null,
}]));

await writeFile(new URL("../public/mouse-shapes.json", import.meta.url), JSON.stringify({
  updatedAt: new Date().toISOString(),
  total: rows.length,
  available: rows.filter((row) => row.mouse__top_view && row.mouse__side_view).length,
  shapes,
}));

console.log(`Synced ${rows.length} mice; ${Object.values(shapes).filter((shape) => shape.top && shape.side).length} have top and side outlines.`);
