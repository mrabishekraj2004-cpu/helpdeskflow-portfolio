import Link from "next/link";
export default function CaseStudy() {
  return (
    <main id="main" className="portfolio narrow">
      <Link className="back" href="/">
        ← Project showcase
      </Link>
      <p className="eyebrow">HelpDeskFlow / Case study</p>
      <h1>From a support request to a recorded resolution.</h1>
      <p>
        HelpDeskFlow is Abishek Akash’s first AI-assisted portfolio project,
        built to practise application support, testing, and development skills.
      </p>
      <h2>The problem</h2>
      <p>
        Support work needs a clear owner, a visible status, and a conversation
        that preserves the context of an issue.
      </p>
      <h2>The implementation</h2>
      <p>
        A Next.js application uses Better Auth for sign-in and Prisma for
        PostgreSQL data. Every protected server operation checks the current
        database role. Ticket updates and their history are saved together.
      </p>
      <h2>Contribution and AI assistance</h2>
      <p>
        Abishek defined the project goals and learning focus. AI assisted with
        implementation, tests, and documentation. This is not a claim that
        Abishek independently wrote every line. The learning notes provide
        exercises for understanding and modifying the result.
      </p>
      <h2>Verification</h2>
      <p>
        The project contains direct service and HTTP permission tests, browser
        workflows, type and lint checks. The versioned docs/test-results.md file
        records actual executions and any blocked checks.
      </p>
      <h2>Scope and limits</h2>
      <p>
        Fictional development accounts are private. Email, attachments, paid AI,
        and multi-organisation access are outside version 1. GitHub source
        hosting and a running demo are separate delivery steps.
      </p>
      <Link className="button" href="/login">
        Open the application
      </Link>
    </main>
  );
}
