// Credentials remain in process memory. Never print the credential helper output.
import { spawnSync } from "node:child_process";
const credential = spawnSync("git", ["credential", "fill"], {
  input: "protocol=https\nhost=github.com\n\n",
  encoding: "utf8",
  windowsHide: true,
});
if (credential.status !== 0)
  throw new Error(
    "GitHub sign-in unavailable. Run: git credential-manager github login",
  );
const fields = Object.fromEntries(
  credential.stdout
    .trim()
    .split("\n")
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
if (!fields.password) throw new Error("No GitHub credential returned.");
async function request(path, method = "GET", body) {
  const r = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${fields.password}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  return { status: r.status, data };
}
const identity = await request("/user");
if (identity.status !== 200)
  throw new Error(`GitHub identity failed: ${identity.status}`);
const owner = identity.data.login;
if (owner !== "mrabishekraj2004-cpu")
  throw new Error("Account changed; confirm owner before publishing.");
console.log(`Verified authenticated personal account: ${owner}`);
const repo = await request(`/repos/${owner}/helpdeskflow-portfolio`);
if (process.argv[2] === "check") {
  console.log(`Repository availability HTTP ${repo.status}`);
  if (repo.status === 200)
    console.log("Repository already exists. Do not overwrite.");
} else if (process.argv[2] === "create") {
  if (repo.status !== 404)
    throw new Error(
      "Repository name unavailable or check failed. Do not overwrite.",
    );
  const created = await request("/user/repos", "POST", {
    name: "helpdeskflow-portfolio",
    private: false,
    description:
      "AI-assisted IT helpdesk portfolio: Next.js, PostgreSQL, Prisma, Better Auth, permission tests and learning documentation.",
  });
  if (created.status !== 201)
    throw new Error(`Repository creation failed: ${created.status}`);
  console.log(`Created: ${created.data.html_url}`);
} else if (process.argv[2] === "actions") {
  const runs = await request(`/repos/${owner}/helpdeskflow-portfolio/actions/runs?per_page=3`);
  if (runs.status !== 200) throw new Error(`Actions inspection failed: ${runs.status}`);
  console.log(JSON.stringify(runs.data.workflow_runs.map(r => ({ id:r.id, sha:r.head_sha, status:r.status, conclusion:r.conclusion, url:r.html_url })), null, 2));
} else if (process.argv[2] === "jobs") {
  const runId = process.argv[3];
  if (!/^\d+$/.test(runId ?? '')) throw new Error('Supply a numeric run ID.');
  const jobs = await request(`/repos/${owner}/helpdeskflow-portfolio/actions/runs/${runId}/jobs`);
  if(jobs.status !== 200) throw new Error(`Job inspection failed: ${jobs.status}`);
  console.log(JSON.stringify(jobs.data.jobs.map(j => ({name:j.name,status:j.status,conclusion:j.conclusion,steps:j.steps.map(s=>({name:s.name,status:s.status,conclusion:s.conclusion}))})),null,2));
} else if (process.argv[2] === "verify") {
  if (repo.status !== 200)
    throw new Error(`Repository unavailable: ${repo.status}`);
  const tree = await request(
    `/repos/${owner}/helpdeskflow-portfolio/git/trees/main?recursive=1`,
  );
  if (tree.status !== 200) throw new Error(`Tree unavailable: ${tree.status}`);
  const paths = tree.data.tree.map((x) => x.path);
  const required = [
    "package-lock.json",
    "README.md",
    "docs/test-results.md",
    "prisma/schema.prisma",
    "tests/integration.test.ts",
    "public/screenshots/agent-desktop.png",
  ];
  for (const p of required)
    if (!paths.includes(p)) throw new Error(`Remote missing ${p}`);
  if (
    paths.some(
      (p) =>
        p === ".env" ||
        p.startsWith(".local/") ||
        p.startsWith("node_modules/"),
    )
  )
    throw new Error("Unexpected private files on remote.");
  console.log(
    `Verified public repository ${repo.data.html_url}; ${paths.length} entries; commit ${tree.data.sha}`,
  );
}
