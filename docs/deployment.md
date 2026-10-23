# Deployment preparation — Next.js + managed PostgreSQL

## Public portfolio on GitHub Pages

The `Publish portfolio to GitHub Pages` workflow builds the existing public Next.js page, then `scripts/build-pages.mjs` exports only its static markup, compiled styles and four allowlisted screenshots. GitHub Pages publishes that allowlisted artifact. No API routes, sign-in form, environment files, seed credentials or database records are exported. The buttons link to local setup instructions rather than a non-working online login. The public address is https://mrabishekraj2004-cpu.github.io/helpdeskflow-portfolio/.

This hosts the project showcase. The full helpdesk still requires the server/database deployment described below.

The intended hosting option is Vercel for the Next.js app with a managed PostgreSQL database (for example, a suitable free Neon project). No paid resources are authorised. This is preparation, not a claim that a live deployment exists.

## Remaining access

Connect the verified GitHub repository to an authorised hosting account and provide a free PostgreSQL connection. Confirm current free-plan availability in the provider dashboard before creating resources. Do not expose the local PGlite socket server.

## Configuration

1. Import the repository as a Next.js project, with Node.js 24 and `npm ci`.
2. Set DATABASE_URL, a new random BETTER_AUTH_SECRET, BETTER_AUTH_URL to the exact HTTPS deployment origin, and DEMO_MODE=true for a shared demonstration.
3. Run `npm run db:migrate` against the hosted PostgreSQL database using its recommended migration connection. Build with `npm run build` and start with the platform's Next.js runtime.
4. Provision demonstration accounts privately through a controlled administrator process. The local seed deliberately refuses NODE_ENV=production and should not be used as a production startup task. Do not publish administrator credentials. If a shared requester/agent is provided, use fictional data only and keep all account/role management disabled.
5. Use separate browser sessions to verify sign-in, ticket creation, agent reply, private-note isolation, resolve/reopen, and sign-out on the deployed URL.

## Before real users

Use persistent PostgreSQL with backups, HTTPS, a shared rate-limit store, production account lifecycle procedures, retention rules, and independent permission/accessibility review. Functional checks in a local compatible engine do not establish production concurrency or operational readiness.

Sites hosting was considered, but its default database/runtime is Cloudflare Workers with D1. The requested Next.js/PostgreSQL stack is preserved rather than silently replaced for hosting convenience.
