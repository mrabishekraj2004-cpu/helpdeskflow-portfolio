# Test results

Tested version: HelpDeskFlow **1.0.0**, 23 October 2026. Repository history identifies the delivered revision. These are executed checks, not an assumed checklist.

## Local environment

Windows; Node.js 24.17.0; npm 11.13.0; Next.js 16.4.2; Prisma 7.10.1; Better Auth 1.7.12; Playwright 1.64.1 with Chromium 156.0.8078.4. Persistent PGlite 0.5.11 through pglite-socket 0.2.14, using Prisma's PostgreSQL adapter.

| Executed check | Actual outcome | Evidence |
| --- | --- | --- |
| Initial SQL migration | Passed | prisma migrate deploy applied 202610230001_initial |
| Explicit fictional seed | Passed after socket fix | Four accounts and twelve initial tickets; repeat seed preserved data |
| Service integration suite | Passed: 10 tests, 0 failures | npm test; scenarios below |
| Direct HTTP permissions and sessions | Passed | Direct authenticated and unauthenticated HTTP requests |
| Requester browser submission, reply, sign-out | Passed after label fix | Stored ticket/reply visible; desk redirects after sign-out |
| Desktop/mobile browser evidence | Passed | 1440×1000 and 390×844; actual PNG screenshots |
| Full Playwright suite | Passed: 3 tests, 0 failures | npm run test:e2e |
| TypeScript | Passed | npm run typecheck, exit 0 |
| ESLint | Passed after effect/directive corrections | npm run lint, exit 0 with no final findings |
| Production compilation | Passed | npm run build; pages/API routes generated |
| Database restart persistence | Passed | Fifteen tickets and first ticket ID/title/number matched after restart |
| Production dependency audit | Passed | npm audit --omit=dev: 0 vulnerabilities |
| Full dependency audit | Findings remain | Five high findings in development lint dependency chain |
| Staged-file review | Passed before initial publication | Private passwords, session secret, key/token patterns, excluded paths and screenshots reviewed |
| GitHub repository creation | Passed | Personal owner mrabishekraj2004-cpu verified; unused name; public repository created |
| GitHub push and remote contents | Pending verification | Repository creation alone is not a verified source upload |
| Ordinary PostgreSQL CI | Not run yet | Workflow supplied with disposable PostgreSQL 17 |
| Live application hosting | Not run | Authorised host/database connection not configured |

## Service scenarios executed

1. Reject unauthenticated creation, short/missing input, and injected requester ID.
2. Create and read persistent database records.
3. Isolate requester reads/search/writes; deny requester internal notes; omit private note content and existence from requester history.
4. Enforce agent self-assignment, administrator assignment, and staff-only priority changes.
5. Require resolution/reopening reasons; verify status, current resolution and recorded history.
6. Compare scoped dashboard counts with database; reject invalid page numbers.
7. Deny administrator access and escalation; prevent own-role changes; invalidate changed user's sessions; protect shared demo management.
8. Archive category, reject new tickets using it, and preserve existing relationships.
9. Paginate eleven matching fixtures without duplicates or omissions.

The Node runner counts the parent lifecycle test and nine subtests, giving ten total. Fixtures are removed after the suite.

## HTTP/browser scenarios executed

Anonymous access returned 401; another requester's direct read/write returned 404; administration and escalation returned 403. Staff assignment, lifecycle updates, internal-note privacy, foreign-origin rejection, disabled signup, and sign-out were exercised. Browser tests submitted a real form and reply, navigated the app, signed out, captured screenshots, and checked mobile document overflow.

## Observed failures and fixes

- Incorrect local socket package name: npm 404; corrected to the official package.
- Mismatched PGlite peer: ERESOLVE; installed matching versions.
- Initial seed/server tests: P1017/ECONNRESET from one-client socket default; increased development capacity, limited local pool and restarted. Rerun passed. Seed database writes now use a transaction.
- Rapid multi-account browser run: 429 sign-in rate limit. Test helper now waits before retrying; application protection remains enabled.
- Exact Category lookup timed out: explicit accessible names added; final browser run passed.
- Lint found the asynchronous fetch effect and a formatting-moved directive; targeted directive corrected; final lint passed.

See [bug log](bug-log.md) for reproduction and fixes.

## Inspection and limits

Desktop queue, mobile queue and ticket detail screenshots were visually inspected. They show fictional data from the working app. Mobile tables scroll within their panel; the document does not overflow horizontally. A full screen-reader/WCAG audit is not claimed.

The full dependency audit reports an advisory in braces through micromatch, fast-glob and Next's development ESLint tooling. Compatible npm audit fix did not remove it; force proposed downgrading Next lint support and was not applied. Production-only audit returned zero findings. Prisma/pg emits a query-concurrency deprecation warning on pinned pg 8; it did not fail checks and needs review before pg 9.

No load, penetration, independent security, real-user, email, AI-provider, live deployment or production PostgreSQL concurrency test is claimed. Optional runtime AI is not implemented. Traces can contain private credentials, are ignored, and are never uploaded.
