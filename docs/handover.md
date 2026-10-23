# Handover

HelpDeskFlow contains a working three-role helpdesk, database schema/migration, private fictional development accounts, permission tests, browser workflows, screenshots and a separate public portfolio for Abishek Akash. Built with AI assistance.

## Start it

In one terminal run npm run db:local. In a second run npm start after npm run build, or npm run dev while editing. Open http://127.0.0.1:3000. A fresh checkout first needs the README setup, migration and explicit seed commands.

Private accounts are in .local/demo-credentials.json, which is not on GitHub. Requester submits; agent assigns/responds/resolves; administrator manages categories and other users' roles. Never screen-share the password file.

## Evidence and links

[Actual test results](test-results.md), [user guide and screenshots](user-guide.md), [three-minute demo](demo-script.md), [learning notes](learning-notes.md).

Repository: https://github.com/mrabishekraj2004-cpu/helpdeskflow-portfolio. Upload verification is recorded separately in the results report.

## Remaining setup

A public running demo needs an authorised free Next.js host and persistent PostgreSQL connection. Import the repository, set environment variables, apply migrations, privately provision accounts and verify the main workflow. Follow [deployment guidance](deployment.md). GitHub source hosting is not a running application.

Optional AI, email, attachments, account provisioning UI and multiple organisations are outside version 1. Development-tool audit findings and unperformed security/accessibility checks are stated in the results document.

## Five things to practise before interviews

1. Authentication versus permission and where each is checked.
2. How tickets, users, categories, replies and history relate in the database.
3. Why other users' tickets and private notes must be blocked on the server.
4. How transactions keep changes and history consistent.
5. Which checks actually ran, what they prove and how AI helped.

Use the learning exercises. Describe your understanding honestly; do not claim independent authorship of every line or real customer experience.
