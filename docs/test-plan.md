# Test plan

Use only a development database with fictional accounts. Service tests create isolated data. Browser tests use the explicit seed credentials from the ignored local file.

| Scenario             | Steps                                                                         | Expected result                                            |
| -------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Valid creation       | Sign in; submit title, description, active category and priority              | Stored ticket owned by authenticated user                  |
| Invalid creation     | Submit short text, missing fields, invalid enum or extra owner field directly | Rejected; no ticket created                                |
| Persistence          | Read through a fresh database query; restart local DB and read again          | Same stored ticket data remains                            |
| Requester isolation  | Use requester B to list/read/update A's ticket directly                       | No listing; detail and mutation return 404                 |
| Private note         | Agent adds note; requester fetches detail as JSON                             | Body and private-note event absent                         |
| Assignment           | Agent assigns self, then tries another agent; admin assigns agent             | Self/admin pass; assigning other agent denied for agent    |
| Priority/status      | Requester and agent send direct update requests                               | Requester denied; agent update stored                      |
| Administration       | Requester/agent call admin endpoint; admin changes own role                   | 403; no elevation or self-role mutation                    |
| Session invalidation | Admin changes another user's role                                             | Existing sessions for that user removed                    |
| Demo protection      | Enable DEMO_MODE and call admin mutation                                      | 403 even for admin                                         |
| Resolve/reopen       | Resolve without/with explanation; reopen without/with reason                  | Short reasons rejected; valid transitions and audit stored |
| Dashboard            | Compare counts against direct database count; requester checks totals         | Correct totals and ownership scope                         |
| Category archive     | Archive category; create new ticket with it                                   | New creation rejected; old ticket readable                 |
| Sign-out             | Sign in then sign out, call API with old context                              | No authenticated access                                    |
| Signup/CSRF          | Call signup or write from foreign origin                                      | Signup disabled; foreign-origin mutation denied            |
| Browser workflow     | Fill login, creation and reply forms; sign out                                | Stored content visible; logged-out desk redirects          |
| Responsive layout    | Inspect at 1440×1000 and 390×844                                              | Readable layout; no document-level horizontal overflow     |

Automated entry points: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, `npm run build`. Actual results belong in test-results.md. A passing UI test does not prove permission enforcement; the service and HTTP suites exercise the server directly.
