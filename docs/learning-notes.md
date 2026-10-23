# Learning notes

## Five things to practise explaining

1. **Authentication and permission are different.** Authentication answers “Who signed in?” Permission answers “May this person read or change this ticket?” Better Auth supplies identity; the service reloads the role and checks ownership.
2. **A database makes work persistent.** Tickets are rows related to users and categories. Refreshing the page does not recreate sample records. The seed is separate from app startup.
3. **Hiding a button is not security.** A person can call an API directly. Explain why the server returns 404 for someone else's ticket and never queries internal notes for requesters.
4. **A transaction keeps a story accurate.** A ticket status and its history record should commit together. If a change fails, neither should pretend it happened. The ticket row lock also orders competing changes.
5. **Tests are evidence with limits.** Describe a tested input and the expected output. Explain that PGlite functional tests do not prove real PostgreSQL concurrency or internet security.

## Read the code in this order

`prisma/schema.prisma` → `src/lib/auth.ts` → `src/lib/service.ts` → `src/lib/http.ts` → API routes → `src/app/desk/page.tsx` → tests.

The schema describes the stored information. A migration changes the database structure. Prisma is the bridge between TypeScript and database queries. Zod checks data at runtime because a browser request may not follow TypeScript's types. A session is temporary proof of sign-in. A role controls capabilities. An internal message is a staff-only record, not a hidden CSS element.

## Practical exercises

- Create an issue and find the same title in a database query or API response.
- Try accessing its URL from the other requester profile. Explain the 404.
- Add a new test rejecting a blank reply. Run it and explain the result.
- Add a new category through administration, then archive it and inspect the creation form.
- Change one helper message in the form, run lint/type checks, and inspect the result.
- Read the resolve/reopen branch and explain why ten characters are required.
- Explain which files must never go into Git: environment secrets, private seed credentials, dependencies, and database data.

## Interview practice

- “What did you do and what did AI do?” State the actual scope: requirements and learning goals from you; AI-assisted implementation, tests, and documents. Describe only code you have personally studied as understood.
- “How would you investigate a failed sign-in?” Check credentials, application origin, session/database connectivity, and safe server errors without logging passwords.
- “What bug did you observe?” Use the real bug log. Explain reproduction, fix, and actual retest; do not invent an incident.
- “What would you improve next?” Ordinary PostgreSQL deployment verification, shared rate limiting, account provisioning, and broader accessibility testing before optional AI.
- “Why no automated AI replies?” The first version prioritises predictable permissions and traceable support work. Optional AI would require article references and explicit staff approval.
