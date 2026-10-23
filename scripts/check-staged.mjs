import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const gitArgs = ["-c", `safe.directory=${process.cwd().replaceAll("\\", "/")}`];
const git = (...args) => {
  const r = spawnSync("git", [...gitArgs, ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("Git inspection failed.");
  return r.stdout;
};
const paths = git("diff", "--cached", "--name-only")
  .trim()
  .split("\n")
  .filter(Boolean);
assert.ok(paths.length > 0, "No staged files.");
const privateAccounts = JSON.parse(
  readFileSync(".local/demo-credentials.json", "utf8"),
);
const privateLiveAccounts = JSON.parse(
  readFileSync(".local/live-demo-credentials.json", "utf8"),
);
const databasePassword = readFileSync(
  ".local/live-database-password.txt",
  "utf8",
).trim();
const env = readFileSync(".env", "utf8");
const secret = env.match(/BETTER_AUTH_SECRET="([^"]+)"/)?.[1];
for (const path of paths) {
  assert.ok(
    !/^(\.local\/|node_modules\/|\.next\/|test-results\/|playwright-report\/)/.test(
      path,
    ),
    `Excluded directory staged: ${path}`,
  );
  assert.ok(
    !path.startsWith(".env") || path === ".env.example",
    "Real environment file staged.",
  );
  const content = spawnSync("git", [...gitArgs, "show", `:${path}`], {
    maxBuffer: 20 * 1024 * 1024,
  }).stdout;
  for (const account of [
    ...Object.values(privateAccounts),
    ...Object.values(privateLiveAccounts),
  ])
    assert.ok(
      !content.includes(Buffer.from(account.password)),
      `Private seed password found in ${path}`,
    );
  assert.ok(
    !content.includes(Buffer.from(databasePassword)),
    `Private database password found in ${path}`,
  );
  if (secret)
    assert.ok(
      !content.includes(Buffer.from(secret)),
      `Session secret found in ${path}`,
    );
  assert.ok(
    !/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{25,}/.test(
      content.toString(),
    ),
    `Possible secret found in ${path}`,
  );
}
console.log(
  `Reviewed ${paths.length} staged files: private seed passwords, current session secret, environment files, private-key/token patterns, database data, build outputs and test traces excluded.`,
);
