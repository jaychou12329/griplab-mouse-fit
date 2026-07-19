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
});

test("renders the shape comparison lab", async () => {
  const response = await render("/shape-compare");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /模具实验室/);
  assert.match(html, /俯视/);
  assert.match(html, /侧视/);
  assert.match(html, /模具参数横向比较/);
});
