# Deployment — Next.js + managed PostgreSQL

## Public portfolio on GitHub Pages

The `Publish portfolio to GitHub Pages` workflow builds the existing public Next.js page, then `scripts/build-pages.mjs` exports only its static markup, compiled styles and four allowlisted screenshots. GitHub Pages publishes that allowlisted artifact. No API routes, sign-in form, environment files, seed credentials or database records are exported. The workspace buttons link to the live application sign-in page. The public address is https://mrabishekraj2004-cpu.github.io/helpdeskflow-portfolio/.

GitHub Pages hosts the showcase. The full helpdesk is live at https://helpdeskflow-portfolio.vercel.app, running on Vercel with the existing helpdeskflow Neon project.

The existing Vercel Hobby project and Neon Free database were used. No paid resources were provisioned. The database password exposed during setup was replaced; secret values are excluded from source and logs.

## Verified live setup

Production origin: https://helpdeskflow-portfolio.vercel.app. Node.js 24, Next.js, DATABASE_URL as a Secret, BETTER_AUTH_SECRET as a Secret, BETTER_AUTH_URL at that origin, DEMO_MODE=true. Schema migrations used a direct Neon connection; application traffic uses the pooled connection.

A one-time staged build ran scripts/initialize-demo.mjs to apply the migration, create four fictional accounts and twelve tickets, and replace the exposed database password. scripts/bootstrap-demo.ts refuses an existing-user database and requires explicitly supplied private passwords. The ordinary build remains npm run build; initialization and password replacement never run on normal builds. Temporary bootstrap secrets were removed before the final deployment. Never run the development seed in production.

Keep live login details in the ignored local handover file. Share only the requester/agent credentials with demo visitors; keep the administrator password private.

## Configuration

1. Import the repository as a Next.js project, with Node.js 24 and `npm ci`.
2. Set DATABASE_URL, a new random BETTER_AUTH_SECRET, BETTER_AUTH_URL to the exact HTTPS deployment origin, and DEMO_MODE=true for a shared demonstration.
3. Run `npm run db:migrate` against the hosted PostgreSQL database using its recommended migration connection. Build with `npm run build` and start with the platform's Next.js runtime.
4. Provision demonstration accounts privately through a controlled administrator process. The local seed deliberately refuses NODE_ENV=production and should not be used as a production startup task. Do not publish administrator credentials. If a shared requester/agent is provided, use fictional data only and keep all account/role management disabled.
5. Use separate browser sessions to verify sign-in, ticket creation, agent reply, private-note isolation, resolve/reopen, and sign-out on the deployed URL.

## Before real users

Use persistent PostgreSQL with backups, HTTPS, a shared rate-limit store, production account lifecycle procedures, retention rules, and independent permission/accessibility review. Functional checks in a local compatible engine do not establish production concurrency or operational readiness.

Sites hosting was considered, but its default database/runtime is Cloudflare Workers with D1. The requested Next.js/PostgreSQL stack is preserved rather than silently replaced for hosting convenience.
