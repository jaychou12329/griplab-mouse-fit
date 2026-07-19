import { rename } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const route = path.join(root, "app", "api", "mouse-image", "route.ts");
const disabledRoute = `${route}.disabled`;
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

await rename(route, disabledRoute);
try {
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, GITHUB_PAGES: "true" },
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) process.exitCode = exitCode;
} finally {
  await rename(disabledRoute, route);
}
