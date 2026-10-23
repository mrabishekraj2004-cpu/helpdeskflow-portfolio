import { spawnSync } from "node:child_process";

const url = new URL(process.env.DATABASE_URL ?? "");
if (process.env.DEMO_MODE !== "true" || !url.hostname.endsWith(".neon.tech")) {
  throw new Error("Initialization requires the authorized Neon demo database.");
}
url.hostname = url.hostname.replace("-pooler.", ".");
const env = { ...process.env, DATABASE_URL: url.toString() };
for (const args of [
  ["node_modules/prisma/build/index.js", "generate"],
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/tsx/dist/cli.mjs", "scripts/bootstrap-demo.ts"],
  ["scripts/rotate-demo-database.mjs"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
