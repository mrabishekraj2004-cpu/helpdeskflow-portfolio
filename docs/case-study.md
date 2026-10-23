# HelpDeskFlow — portfolio case study

**Abishek Akash · Seeking a trainee IT opportunity in Colombo.**

HelpDeskFlow is a first portfolio project built with AI assistance. It demonstrates application support, testing, and development concepts through a fictional IT ticket workflow. It does not represent customer work or employment experience.

## Problem and solution

A support request needs an owner, a status, a useful conversation, and a clear resolution. HelpDeskFlow offers requester-only tickets, a shared staff queue, private internal notes, administrator controls, and a recorded lifecycle from Open to Resolved and back to Open when a reason is supplied.

## Contribution

Abishek provided the requirements, target roles, and learning goals. AI tools assisted with code, tests, design, and documentation. The repository includes practical exercises so Abishek can inspect, explain, and modify the work. It would be inaccurate to claim independent authorship of every line.

## Architecture

A small Next.js monolith uses Better Auth sessions and Prisma/PostgreSQL. A central service layer validates fields and checks current roles and ticket ownership on the server. Mutations and their audit records use database transactions. Private notes are excluded by database query for requesters.

## Evidence and challenges

Read [test results](test-results.md) for executed service, HTTP, browser, type, lint, and build checks. The [bug log](bug-log.md) lists genuinely observed build and application issues. Real application screenshots are in the repository, not design mockups. Setting up the local PostgreSQL-compatible development adapter required resolving a package-name error and a peer-version conflict.

## Limitations

Fictional data only; private development passwords. No email, uploads, organisations, paid AI integration, or automatic replies. Development verification uses PGlite and must be followed by ordinary PostgreSQL and production-host checks before real use. A GitHub source upload is distinct from a live application deployment. This project supports interview discussion; it does not guarantee employment.
