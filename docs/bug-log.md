# Observed bug log

Only observed defects and their retest results are listed here. No fictional production incidents or customers are claimed.

## BUILD-01 — Incorrect local database package name

- Reproduction: install `@electric-sql/pglite-server`.
- Expected: install a PostgreSQL socket adapter for local development.
- Actual: npm returned HTTP 404; the package does not exist under that name.
- Cause: incorrect package name in initial implementation.
- Fix: use the official `@electric-sql/pglite-socket` and matching PGlite peer version.
- Retest: recorded in test-results.md after installation and database startup.

## BUILD-02 — Mismatched development database peer versions

- Reproduction: install the latest socket adapter alongside an older installed PGlite.
- Expected: compatible dependency resolution.
- Actual: npm returned ERESOLVE for the required PGlite peer version.
- Cause: socket package required PGlite 0.5.11 while the existing dependency was 0.4.x.
- Fix: install the matching versions together.
- Retest: recorded in test-results.md.

## DB-01 — Local socket connection limit

- Reproduction: migrate, then seed using the local socket server's default connection limit.
- Expected: subsequent clients and the Prisma pool can connect.
- Actual: seed failed with P1017 and subsequent clients received ECONNRESET.
- Cause: the socket server defaults to one client connection.
- Fix: allow twenty development socket clients, limit the local application pool to one connection, and restart the adapter. Make the seed database writes transactional so a failure does not leave partial account records.
- Retest: seed and all nine service checks passed after restart; direct HTTP permission test passed.

## UI-01 — Category selector accessible label

- Reproduction: browser test fills the new-ticket form and selects Category by its exact accessible label.
- Expected: the select has the simple name Category.
- Actual: the exact label lookup timed out while the field was visible.
- Cause: the wrapped select label included option text in the test's label text lookup.
- Fix: give category and initial priority selects explicit accessible names.
- Retest: final browser submission test passed; all three Playwright tests passed.

## TEST-01 — Rapid test sign-ins hit the real rate limiter

- Reproduction: sign into four demonstration accounts rapidly in the HTTP test.
- Expected: tests authenticate while respecting production protections.
- Actual: Better Auth correctly returned 429; the dependent browser login then failed.
- Cause: the initial test helper ignored the authentication rate limit.
- Fix: retry rate-limited test sign-ins after eleven seconds; retain the application protection.
- Retest: direct HTTP permission test passed on rerun.
