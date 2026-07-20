import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fitScore, gripKeys, recommendedGripKeys, suitableHandRange } from "../app/mouse-fit.ts";

const mice = JSON.parse(await readFile(new URL("../public/mice-database.json", import.meta.url), "utf8"));

test("calculates valid hand ranges and grip scores for the complete catalog", () => {
  for (const mouse of mice) {
    for (const grip of gripKeys) {
      const range = suitableHandRange(mouse, grip);
      assert.ok(range.min >= 14 && range.min <= 23, `${mouse.handle} ${grip} min`);
      assert.ok(range.max >= 14 && range.max <= 23, `${mouse.handle} ${grip} max`);
      assert.ok(range.min <= range.max, `${mouse.handle} ${grip} range`);
      for (const hand of [14, 17, 18.5, 20, 23]) {
        const score = fitScore(mouse, hand, grip);
        assert.ok(Number.isInteger(score) && score >= 0 && score <= 100, `${mouse.handle} ${grip} ${hand}`);
      }
    }
    const recommendations = recommendedGripKeys(mouse, 18.5);
    assert.ok(recommendations.length >= 2 && recommendations.length <= 3, mouse.handle);
    assert.equal(new Set(recommendations).size, recommendations.length, mouse.handle);
  }
});

test("keeps representative grip recommendations sensible", () => {
  const deathAdder = mice.find((mouse) => mouse.handle === "razer-deathadder-v3-pro");
  const viper = mice.find((mouse) => mouse.handle === "razer-viper-v3-pro");
  assert.ok(recommendedGripKeys(deathAdder, 19).includes("palm"));
  assert.ok(recommendedGripKeys(viper, 18.5).some((grip) => ["claw", "forwardClaw", "relaxedClaw"].includes(grip)));
});
