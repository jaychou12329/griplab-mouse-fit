import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const mice = JSON.parse(await readFile(new URL("public/mice-database.json", root), "utf8"));
const shapeData = JSON.parse(await readFile(new URL("public/mouse-shapes.json", root), "utf8"));

test("keeps the complete mouse catalog internally consistent", () => {
  assert.equal(mice.length, 1599);
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
  assert.equal(shapeData.available, 1591);
  for (const mouse of mice) assert.ok(Object.hasOwn(shapeData.shapes, mouse.handle));
});

test("includes the current flagship comparison defaults", () => {
  const handles = new Set(mice.map((mouse) => mouse.handle));
  assert.ok(handles.has("razer-viper-v4-pro"));
  assert.ok(handles.has("logitech-g-pro-x2-superstrike"));
  assert.ok(handles.has("finalmouse-starlight-x"));
  assert.ok(handles.has("pmm-titan-mini"));

  const viperV4 = mice.find((mouse) => mouse.handle === "razer-viper-v4-pro");
  const viperV3 = mice.find((mouse) => mouse.handle === "razer-viper-v3-pro");
  const gpw5 = mice.find((mouse) => mouse.handle === "logitech-g-pro-x2-superstrike");
  const titanMini = mice.find((mouse) => mouse.handle === "pmm-titan-mini");
  assert.equal(viperV4.releaseDate, "2026-03-24");
  assert.equal(viperV4.polling, 8000);
  assert.equal(viperV4.price, 1299);
  assert.equal(viperV4.image, "razer-viper-v4-pro.png");
  assert.equal(viperV4.localImage, "mouse-images/razer-viper-v4-pro-official.jpg");
  assert.deepEqual(
    [viperV4.length, viperV4.width, viperV4.height, viperV4.shape, viperV4.hump, viperV4.frontFlare, viperV4.sideCurve],
    [viperV3.length, viperV3.width, viperV3.height, viperV3.shape, viperV3.hump, viperV3.frontFlare, viperV3.sideCurve],
  );
  assert.equal(shapeData.shapes[viperV4.handle].top, shapeData.shapes[viperV3.handle].top);
  assert.equal(shapeData.shapes[viperV4.handle].side, shapeData.shapes[viperV3.handle].side);
  assert.match(gpw5.name, /GPW5 雪豹/);
  assert.equal(gpw5.releaseDate, "2026-02-10");
  assert.equal(gpw5.price, 1899);
  assert.deepEqual([titanMini.length, titanMini.width, titanMini.height, titanMini.weight], [118.4, 61.2, 38.6, 31]);
  assert.equal(titanMini.globalMsrp, 139.9);
  assert.equal(titanMini.globalCurrency, "EUR");
  assert.equal(titanMini.priceStatus, "china-price-unverified");
});

test("places every mouse reference price in exactly one visible tier", () => {
  const tiers = [[0, 199], [200, 299], [300, 399], [400, 499], [500, 699], [700, 999], [1000, 5000]];
  const priced = mice.filter((mouse) => mouse.price != null);
  assert.equal(priced.length, mice.length);
  for (const mouse of priced) {
    assert.ok(Number.isFinite(mouse.price));
    assert.ok(mouse.price >= 0 && mouse.price <= 5000, `${mouse.handle}: ${mouse.price}`);
    assert.equal(tiers.filter(([min, max]) => mouse.price >= min && mouse.price <= max).length, 1, `${mouse.handle}: ${mouse.price}`);
    if (mouse.priceType != null) {
      assert.ok(["listed", "estimated"].includes(mouse.priceType), `${mouse.handle}: ${mouse.priceType}`);
      assert.ok(mouse.priceSource, `${mouse.handle}: missing price source`);
      assert.ok(mouse.priceCheckedAt, `${mouse.handle}: missing price checked date`);
    }
  }

  assert.ok(mice.filter((mouse) => mouse.priceType === "listed").length > 500);
  assert.ok(mice.some((mouse) => mouse.priceType === "estimated"));
});
