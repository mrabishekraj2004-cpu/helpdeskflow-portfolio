# HelpDeskFlow

An IT helpdesk portfolio project by **Abishek Akash**, seeking a trainee IT opportunity in Colombo. Created with AI assistance to practise application support, testing, and development.

![Working support queue](public/screenshots/agent-desktop.png)

## Status

The public portfolio is live on [GitHub Pages](https://mrabishekraj2004-cpu.github.io/helpdeskflow-portfolio/). It shows the project, screenshots, source and evidence links. GitHub Pages does not run the protected helpdesk or its database. The full application remains available through local setup below.

Version 1 is a database-backed application. See [actual test results](docs/test-results.md) for executed verification. [GitHub source](https://github.com/mrabishekraj2004-cpu/helpdeskflow-portfolio) stores the code; a public running demo is not configured yet. Start with the [handover](docs/handover.md).

## Features

- Private requester tickets, public replies, and resolution progress.
- Search, status/priority filters, ten-ticket pagination, and assigned-to-me queue.
- Staff self-assignment, public replies, internal notes, priority and status updates.
- Resolution explanations, reopening reasons, and transactional activity history.
- Administrator category creation/archive/restore, assignment, protected role changes, and status counts.
- Better Auth sign-in/sign-out, password hashing, database sessions, server-side role checks, and same-origin mutation checks.
- A separate public portfolio at `/` and case study at `/case-study`.

## Technology

Next.js App Router, React, TypeScript, Tailwind CSS, Prisma 7 with the PostgreSQL driver, Better Auth, Zod, Node test runner, and Playwright. Exact installed versions are in package-lock.json. The local development database uses PGlite's PostgreSQL engine and socket adapter; production must use a real PostgreSQL service. This local adapter is not a substitute for production concurrency testing.

## Local setup

Use Node.js 24 LTS and npm. In the project folder:

```sh
npm ci
node scripts/setup-local.mjs
npm run db:generate
```

Start the development database in one terminal and leave it running:

```sh
npm run db:local
```

In another terminal:

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:3000. Read `.local/demo-credentials.json` locally for the four fictional account credentials. This file is deliberately ignored by Git. Do not publish it or place its passwords in documentation. The seed is an explicit development command; it never runs automatically at startup. Re-running it preserves existing credentials and data.

`npm run db:local` persists data in `.local/postgres`. Stop and restart it to check persistence. Never expose this development database outside your machine. To use ordinary PostgreSQL, replace DATABASE_URL in your local `.env`, apply the migrations, and use the same application commands without `db:local`.

## Environment variables

| Variable           | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| DATABASE_URL       | PostgreSQL connection string; keep credentials private      |
| BETTER_AUTH_SECRET | Random session secret, at least 32 characters               |
| BETTER_AUTH_URL    | Exact application origin, such as http://127.0.0.1:3000     |
| DEMO_MODE          | `true` blocks category and role management on a shared demo |

`.env.example` contains placeholders only. `setup-local.mjs` creates an ignored local environment file with a random secret. HTTPS deployments use Better Auth secure cookies. Development loopback uses HTTP. Sessions expire after eight hours; changing a role invalidates the affected user's sessions. Public registration is disabled.

## Migrations and accounts

`prisma/migrations` is the versioned database history. Apply with `npm run db:migrate`; do not replace migrations with schema push in deployment. Prisma client is generated during builds and is excluded from source control. Development passwords use Better Auth's password hashing helper and are randomly generated, not hardcoded.

## Verification

With the local database running and seeded:

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm start
# In another terminal, against the running app:
npm run test:e2e
```

Playwright requires a Chromium browser: `npx playwright install chromium`. Tests use the ignored seeded credentials. Integration tests create isolated users and remove their records. Browser tests intentionally leave fictional demonstration tickets so persistence can be inspected. Use a development database, never a customer database. See the results document for the exact checks performed on the delivered version.

## Documentation

- [Requirements and permissions](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Test plan](docs/test-plan.md) · [Test results](docs/test-results.md) · [Observed bug log](docs/bug-log.md)
- [User guide](docs/user-guide.md) · [Troubleshooting](docs/troubleshooting.md)
- [Case study](docs/case-study.md) · [Three-minute demonstration](docs/demo-script.md)
- [Learning notes](docs/learning-notes.md) · [Deployment](docs/deployment.md)
- [Implementation checklist](CHECKLIST.md)

## AI use and limitations

AI helped create the implementation, tests, and documents. Abishek supplied the scope and learning goals; this does not claim independent authorship of every line. There is no runtime AI feature or provider integration. No AI key or paid account is required. Suggestions and drafted replies are deferred until after the core delivery.

There is no email, password reset delivery, account creation UI, file upload, multiple organisation support, or live chat. Local rate limiting is process-local; a multi-instance internet deployment needs a shared rate-limit store. This portfolio has not undergone an independent security audit, load test, screen-reader audit, or production PostgreSQL concurrency test. See deployment guidance before sharing it publicly.
