import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const mice = JSON.parse(await readFile(new URL("public/mice-database.json", root), "utf8"));
const shapeData = JSON.parse(await readFile(new URL("public/mouse-shapes.json", root), "utf8"));

test("keeps the complete mouse catalog internally consistent", () => {
  assert.equal(mice.length, 1598);
  assert.equal(new Set(mice.map((mouse) => mouse.handle)).size, mice.length);
  assert.equal(new Set(mice.map((mouse) => mouse.brand)).size, 192);

  for (const mouse of mice) {
    assert.ok(mouse.handle && mouse.brand && mouse.name);
    assert.ok(Number.isFinite(mouse.length) && mouse.length > 0);
    assert.ok(Number.isFinite(mouse.width) && mouse.width > 0);
    assert.ok(Number.isFinite(mouse.height) && mouse.height > 0);
    if (mouse.image) assert.match(mouse.image, /^[a-zA-Z0-9._/+\- ]+$/);
  }
});

test("keeps every mouse connected to the local shape catalog", () => {
  assert.equal(Object.keys(shapeData.shapes).length, mice.length);
  assert.equal(shapeData.total, mice.length);
  assert.equal(shapeData.available, 1590);
  for (const mouse of mice) assert.ok(Object.hasOwn(shapeData.shapes, mouse.handle));
});

test("includes the current flagship comparison defaults", () => {
  const handles = new Set(mice.map((mouse) => mouse.handle));
  assert.ok(handles.has("razer-viper-v4-pro"));
  assert.ok(handles.has("logitech-g-pro-x2-superstrike"));
  assert.ok(handles.has("finalmouse-starlight-x"));

  const viperV4 = mice.find((mouse) => mouse.handle === "razer-viper-v4-pro");
  const gpw5 = mice.find((mouse) => mouse.handle === "logitech-g-pro-x2-superstrike");
  assert.equal(viperV4.releaseDate, "2026-03-24");
  assert.equal(viperV4.polling, 8000);
  assert.equal(viperV4.image, "razer-viper-v4-pro.png");
  assert.equal(viperV4.localImage, "mouse-images/razer-viper-v4-pro-official.jpg");
  assert.match(gpw5.name, /GPW5 雪豹/);
  assert.equal(gpw5.releaseDate, "2026-02-10");
});

test("places every known reference price in a visible tier", () => {
  const tiers = [[0, 199], [200, 299], [300, 399], [400, 499], [500, 699], [700, 999], [1000, 5000]];
  const priced = mice.filter((mouse) => mouse.price != null);
  assert.ok(priced.length > 0);
  for (const mouse of priced) {
    assert.equal(tiers.filter(([min, max]) => mouse.price >= min && mouse.price <= max).length, 1, `${mouse.handle}: ${mouse.price}`);
  }
});
