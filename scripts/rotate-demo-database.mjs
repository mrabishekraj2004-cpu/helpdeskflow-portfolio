import pg from "pg";

// One-time operator command; never runs during the normal application build.
if (process.env.DEMO_MODE !== "true") throw new Error("Demo mode required.");
const url = new URL(process.env.DATABASE_URL ?? "");
if (!url.hostname.endsWith(".neon.tech") || url.username !== "neondb_owner") {
  throw new Error("Unexpected database target.");
}
const password = process.env.HELPDESK_DATABASE_PASSWORD;
if (!password || !/^[A-Za-z0-9_-]{48,}$/.test(password)) {
  throw new Error("A new generated database password is required.");
}
url.hostname = url.hostname.replace("-pooler.", ".");
const client = new pg.Client({ connectionString: url.toString() });
try {
  await client.connect();
  // Both the role and password are constrained above; DDL cannot bind a password parameter.
  await client.query(`ALTER ROLE "neondb_owner" PASSWORD '${password}'`);
  console.log("Replaced the exposed demonstration database password.");
} catch {
  throw new Error(
    "Database password replacement failed; no credentials were logged.",
  );
} finally {
  await client.end();
}
