"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Headphones, ArrowRight } from "lucide-react";
import { createAuthClient } from "better-auth/react";
const client = createAuthClient();
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main id="main" className="login">
      <section className="login-story">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Headphones size={21} />
          </span>
          HelpDeskFlow
        </Link>
        <div>
          <span className="eyebrow" style={{ color: "#b9d7b9" }}>
            A little structure. A lot less friction.
          </span>
          <h1>Good support starts here.</h1>
          <p>
            One place to report an issue, keep the conversation moving, and find
            a resolution.
          </p>
        </div>
        <footer>Portfolio project · Built with AI assistance</footer>
      </section>
      <section className="login-form">
        <div>
          <span className="eyebrow">Your support workspace</span>
          <h1>Welcome back.</h1>
          <p className="muted">Sign in to pick up where you left off.</p>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          <form
            className="form"
            method="post"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              try {
                const result = await client.signIn.email({
                  email: String(f.get("email")),
                  password: String(f.get("password")),
                });
                if (result.error)
                  setError(result.error.message ?? "Sign-in failed.");
                else {
                  router.replace("/desk");
                  router.refresh();
                }
              } catch {
                setError("Unable to connect. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="muted" style={{ fontSize: 13, marginTop: 24 }}>
            Accounts are provided by the project owner. Development credentials
            are kept private.
          </p>
          <Link className="back" href="/">
            ← Back to project showcase
          </Link>
        </div>
      </section>
    </main>
  );
}
