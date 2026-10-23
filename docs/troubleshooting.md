# Troubleshooting

## No database connection

Check that `npm run db:local` is running in another terminal and DATABASE_URL points to port 54329 for the local adapter. Then run `npm run db:migrate`. The local adapter has no SSL; do not copy that configuration to a remote database. Verification: `npm test` can create and read isolated records.

## Sign-in fails

Check the email and password in the ignored `.local/demo-credentials.json`. Use the exact origin http://127.0.0.1:3000, not a mixture of localhost and 127.0.0.1. BETTER_AUTH_URL must match. Seed once after applying migrations. Role changes remove the user's sessions, so sign in again. No email password reset is implemented.

## Prisma client missing

Run `npm run db:generate`. The generated client is intentionally not committed. Verification: `npm run typecheck` resolves the database imports.

## Category cannot be used

An archived category remains visible on old tickets but is excluded from creation. An administrator can restore it. Duplicate category names are rejected rather than overwritten.

## Access denied

Check the signed-in role. Requesters cannot view another person's ticket, internal notes, or administration. Agents can assign only themselves. Own-role changes and shared-demo management are blocked. These are intended permission rules.

## Browser test cannot launch

Install the matching Playwright browser with `npx playwright install chromium`, then run the suite against a running app. Browser executable failures are infrastructure failures, not passing application tests.

## Hosting advice (not yet deployment-tested)

For a managed PostgreSQL URL, use the provider's recommended SSL connection and pooled/direct migration URLs where required. Set the exact HTTPS application origin and a new secret on the host. Apply migrations before serving traffic. See deployment.md. These hosting instructions remain unverified until an actual deployment is exercised.
