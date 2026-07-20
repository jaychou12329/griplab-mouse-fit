export type GripKey = "palm" | "relaxedClaw" | "forwardClaw" | "rearClaw" | "claw" | "fingertip";

export type MouseFitInput = {
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  size: string | null;
  shape: string | null;
  hump: string | null;
  sideCurve?: string | null;
};

const rules: Record<GripKey, { ratio: number; tolerance: number }> = {
  palm: { ratio: 0.7, tolerance: 1.2 },
  relaxedClaw: { ratio: 0.68, tolerance: 1.3 },
  forwardClaw: { ratio: 0.65, tolerance: 1.3 },
  rearClaw: { ratio: 0.67, tolerance: 1.3 },
  claw: { ratio: 0.66, tolerance: 1.35 },
  fingertip: { ratio: 0.62, tolerance: 1.55 },
};

export const gripKeys = Object.keys(rules) as GripKey[];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function idealLength(hand: number, grip: GripKey) {
  return hand * 10 * rules[grip].ratio;
}

export function suitableHandRange(mouse: MouseFitInput, grip: GripKey) {
  if (!mouse.length || !mouse.width) return { min: 14, max: 23, estimated: true };
  const lengthCenter = mouse.length / (rules[grip].ratio * 10);
  const widthCenter = mouse.width / 3.45;
  const center = clamp(lengthCenter * 0.78 + widthCenter * 0.22, 14, 23);
  const tolerance = rules[grip].tolerance;
  return {
    min: Math.round(clamp(center - tolerance, 14, 23) * 10) / 10,
    max: Math.round(clamp(center + tolerance, 14, 23) * 10) / 10,
    estimated: true,
  };
}

export function fitScore(mouse: MouseFitInput, hand: number, grip: GripKey) {
  if (!mouse.length || !mouse.width || !mouse.height) return 50;
  const targetL = idealLength(hand, grip);
  const targetW = hand * 3.45;
  const lengthScore = Math.max(20, 100 - Math.abs(mouse.length - targetL) * 4.2);
  const widthScore = Math.max(30, 100 - Math.abs(mouse.width - targetW) * 5.4);
  const hump = mouse.hump || "";
  const sideCurve = mouse.sideCurve || "";
  let shapeScore = 72;

  if (grip === "palm") shapeScore = mouse.shape === "ergonomic" ? 100 : mouse.height >= 40 ? 88 : 66;
  if (grip === "relaxedClaw") shapeScore = hump.includes("back") || mouse.shape === "ergonomic" ? 94 : 80;
  if (grip === "forwardClaw") shapeScore = hump === "center" && mouse.height <= 41 ? 98 : hump.includes("minimal") ? 86 : 68;
  if (grip === "rearClaw") shapeScore = hump.includes("moderate") || hump.includes("aggressive") ? 100 : hump.includes("minimal") ? 82 : 64;
  if (grip === "claw") shapeScore = hump.includes("back") || sideCurve.includes("inward") ? 96 : 82;
  if (grip === "fingertip") shapeScore = (mouse.size === "small" || mouse.size === "fingertip") && mouse.length <= targetL + 5 ? 100 : mouse.length <= targetL + 9 ? 82 : 56;

  const preferredWeight = grip === "palm" ? 78 : grip === "relaxedClaw" ? 68 : 62;
  const weightScore = mouse.weight == null ? 72 : Math.max(42, 100 - Math.max(0, mouse.weight - preferredWeight) * 1.5);
  return Math.round(clamp(lengthScore * 0.42 + widthScore * 0.18 + shapeScore * 0.3 + weightScore * 0.1, 0, 100));
}

export function recommendedGripKeys(mouse: MouseFitInput, hand: number) {
  const ranked = gripKeys
    .map((grip) => ({ grip, score: fitScore(mouse, hand, grip) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ?? 0;
  const suitable = ranked.filter((item) => item.score >= 68 && item.score >= best - 8).slice(0, 3);
  return (suitable.length >= 2 ? suitable : ranked.slice(0, 2)).map((item) => item.grip);
}
