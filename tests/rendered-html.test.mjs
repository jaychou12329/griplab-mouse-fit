import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the mouse database", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /GRIPLAB/);
  assert.match(html, /全部鼠标库/);
  assert.match(html, /搜索全部品牌/);
  assert.match(html, /模具对比/);
  assert.match(html, /真实模具叠加/);
  assert.match(html, /作者：我的手机没电了 p1341026/);
});

test("keeps the legacy shape comparison link inside the same site", async () => {
  const response = await render("/shape-compare");
  assert.ok(response.status === 200 || response.status === 307 || response.status === 308);
  if (response.status !== 200) assert.ok(response.headers.get("location")?.endsWith("/#shape-compare"));
});
