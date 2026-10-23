import Link from "next/link";
import Image from "next/image";
import {
  Headphones,
  ArrowUpRight,
  ShieldCheck,
  Workflow,
  ListChecks,
} from "lucide-react";
export default function Portfolio() {
  return (
    <main id="main" className="portfolio">
      <nav>
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Headphones size={21} />
          </span>
          HelpDeskFlow
        </Link>
        <Link className="button secondary" href="/login">
          Open workspace <ArrowUpRight size={16} />
        </Link>
      </nav>
      <section className="hero">
        <div>
          <p className="eyebrow">Abishek Akash / Portfolio project 01</p>
          <h1>
            Support issues.
            <br />
            Clear next steps.
          </h1>
          <p>
            A focused IT helpdesk that takes an issue from the first report to a
            recorded resolution.
          </p>
          <div className="actions">
            <Link href="/login" className="button">
              Explore the app <ArrowUpRight size={17} />
            </Link>
            <a href="/case-study" className="button secondary">
              Read the case study
            </a>
          </div>
        </div>
        <aside>
          <span className="badge">AI-assisted development</span>
          <h2 style={{ marginTop: 20 }}>
            Learning by building something useful.
          </h2>
          <p>Seeking a trainee IT opportunity in Colombo.</p>
          <p>
            I used AI tools to help create the code, tests, and documentation. I
            am practising the workflows and learning how the application works
            so I can explain and demonstrate it honestly.
          </p>
        </aside>
      </section>
      <section className="showcase">
        <Image
          unoptimized
          src="/screenshots/agent-desktop.png"
          alt="HelpDeskFlow support queue showing fictional tickets, status totals, and filters"
          width="1440"
          height="1000"
        />
      </section>
      <section>
        <p className="eyebrow">Small scope. Complete workflows.</p>
        <h2>Built around the work of a support team.</h2>
        <div className="portfolio-grid">
          {[
            [
              ShieldCheck,
              "Three roles, clear boundaries",
              "Requesters see their own tickets. Support staff handle the queue. Administrators manage categories and roles.",
            ],
            [
              Workflow,
              "A traceable resolution",
              "Public replies, private notes, assignment, resolution explanations, and reopening reasons keep the work understandable.",
            ],
            [
              ListChecks,
              "Evidence you can inspect",
              "The repository includes permission tests, browser checks, migrations, a test-results report, and practical learning notes.",
            ],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <article className="card card-body" key={String(title)}>
                <I size={22} />
                <h3 style={{ marginTop: 18 }}>{String(title)}</h3>
                <p className="muted" style={{ fontSize: 14 }}>
                  {String(body)}
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="card card-body">
        <span className="eyebrow">Project status & limitations</span>
        <h2>Version 1 · Live application</h2>
        <p>
          Built for a portfolio demonstration with fictional data. See the case
          study and repository test-results document for executed checks and
          limitations. The full application is hosted on Vercel with a
          persistent PostgreSQL database. Ask the project owner for a demo
          account.
        </p>
        <div className="actions">
          <a
            className="button secondary"
            href="https://github.com/mrabishekraj2004-cpu/helpdeskflow-portfolio"
          >
            View source code <ArrowUpRight size={16} />
          </a>
          <a
            className="button secondary"
            href="https://github.com/mrabishekraj2004-cpu/helpdeskflow-portfolio/blob/main/docs/test-results.md"
          >
            Testing evidence
          </a>
        </div>
        <p className="muted">
          No email delivery, uploads, payments, multi-organisation support, or
          AI-generated replies. The application works without a paid AI account.
        </p>
      </section>
      <footer>
        Abishek Akash · Seeking a trainee IT opportunity in Colombo.
        <br />
        AI-assisted project. No customer or employment claims.
      </footer>
    </main>
  );
}
