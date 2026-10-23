"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Headphones,
  LayoutDashboard,
  Ticket as TicketIcon,
  Settings,
  ArrowUpRight,
  Plus,
  Search,
  LogOut,
  ArrowLeft,
  CircleHelp,
  Inbox,
  Clock3,
  CheckCheck,
  CircleDot,
} from "lucide-react";
import { createAuthClient } from "better-auth/react";
type User = { id: string; name: string; role: string; email?: string };
type Category = { id: string; name: string; active: boolean };
type Ticket = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  resolution: string | null;
  createdAt: string;
  category: Category;
  requester: { name: string };
  assignee: { name: string } | null;
  assigneeId: string | null;
  messages: {
    id: string;
    body: string;
    internal: boolean;
    createdAt: string;
    author: { name: string };
  }[];
  activities: {
    id: string;
    detail: string;
    createdAt: string;
    actor: { name: string };
  }[];
};
type Boot = {
  user: User;
  categories: Category[];
  agents: User[];
  dashboard: { total: number; counts: Record<string, number> };
};
const statuses = ["OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const label = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const date = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
async function api(path: string, data?: unknown, method = "POST") {
  const response = await fetch(
    `/api/${path}`,
    data === undefined
      ? { cache: "no-store" }
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
  );
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401)
      window.location.replace(new URL("/login", window.location.origin).href);
    throw new Error(result.error ?? "Request failed.");
  }
  return result;
}
export default function Desk() {
  return (
    <Suspense
      fallback={
        <main id="main" className="empty">
          Loading workspace…
        </main>
      }
    >
      <Workspace />
    </Suspense>
  );
}
function Workspace() {
  const router = useRouter(),
    params = useSearchParams(),
    view = params.get("view") ?? "queue",
    id = params.get("id");
  const [boot, setBoot] = useState<Boot | null>(null),
    [tickets, setTickets] = useState<Ticket[]>([]),
    [ticket, setTicket] = useState<Ticket | null>(null),
    [admin, setAdmin] = useState<{
      users: User[];
      categories: Category[];
      demoMode: boolean;
    } | null>(null);
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [pageInfo, setPageInfo] = useState({ total: 0, page: 1, pages: 1 });
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [priority, setPriority] = useState("");
  const refresh = useCallback(async () => {
    try {
      const b: Boot = await api("bootstrap");
      setBoot(b);
      if (view === "admin") {
        setAdmin(await api("admin"));
      } else if (id) {
        setTicket(await api(`tickets/${id}`));
      } else if (view !== "new") {
        const r = await api(
          `tickets?${new URLSearchParams({ q: params.get("q") ?? "", status: params.get("status") ?? "", priority: params.get("priority") ?? "", page: params.get("page") ?? "1", mine: view === "mine" ? "true" : "false" })}`,
        );
        setTickets(r.tickets);
        setPageInfo({ total: r.total, page: r.page, pages: r.pages });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [view, id, params]);
  // This effect synchronizes URL navigation with asynchronous server data; updates happen after network responses.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);
  const mutate = async (
    path: string,
    data: unknown,
    method = "POST",
    message = "Changes saved.",
  ) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await api(path, data, method);
      setSuccess(message);
      await refresh();
      return result;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  const change = async (data: unknown) =>
    mutate(`tickets/${id}`, data, "PATCH");
  const staff = boot?.user.role !== "REQUESTER";
  const go = (v: string) => {
    setLoading(true);
    setSuccess("");
    setError("");
    router.push(`/desk${v}`);
  };
  const submitFilters = (e: FormEvent) => {
    e.preventDefault();
    go(`?${new URLSearchParams({ view, q, status, priority })}`);
  };
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Headphones size={21} />
          </span>
          HelpDeskFlow
        </Link>
        <div>
          <p className="eyebrow" style={{ paddingLeft: 14 }}>
            Workspace
          </p>
          <nav>
            <Link
              className={`navlink ${view === "queue" && !id ? "active" : ""}`}
              href="/desk"
            >
              <LayoutDashboard size={18} />
              Overview & queue
            </Link>
            {staff && (
              <Link
                className={`navlink ${view === "mine" ? "active" : ""}`}
                href="/desk?view=mine"
              >
                <TicketIcon size={18} />
                Assigned to me
              </Link>
            )}
            <Link
              className={`navlink ${view === "new" ? "active" : ""}`}
              href="/desk?view=new"
            >
              <Plus size={18} />
              New ticket
            </Link>
            {boot?.user.role === "ADMIN" && (
              <Link
                className={`navlink ${view === "admin" ? "active" : ""}`}
                href="/desk?view=admin"
              >
                <Settings size={18} />
                Administration
              </Link>
            )}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <p className="eyebrow">Built to keep things moving</p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Every issue deserves
            <br />a clear next step.
          </p>
          <Link className="back" href="/">
            Project showcase <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div>
        <header className="topbar">
          <span>
            Workspace{" "}
            <span className="muted">
              /{" "}
              {view === "admin"
                ? "Administration"
                : id
                  ? "Ticket detail"
                  : "Support desk"}
            </span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="avatar">
              {boot?.user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("") ?? "…"}
            </span>
            <span>
              {boot?.user.name}
              <small style={{ display: "block", fontSize: 10 }}>
                {boot && label(boot.user.role)}
              </small>
            </span>
            <button
              className="quiet"
              aria-label="Sign out"
              onClick={async () => {
                await createAuthClient().signOut();
                router.replace("/login");
                router.refresh();
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main id="main" className="workspace">
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="success">
              {success}
            </div>
          )}
          {!boot ? (
            <p role="status">
              {loading
                ? "Loading your workspace…"
                : "The workspace could not be loaded."}
            </p>
          ) : (
            <>
              {view === "new" ? (
                <>
                  <Link className="back" href="/desk">
                    <ArrowLeft size={15} />
                    Back to queue
                  </Link>
                  <div className="title-row">
                    <div>
                      <p className="eyebrow">Let’s get it sorted</p>
                      <h1>Submit a ticket</h1>
                      <p>Tell us what happened and how it affects your work.</p>
                    </div>
                  </div>
                  <section className="card card-body narrow">
                    <form
                      className="form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        const result = await mutate(
                          "tickets",
                          Object.fromEntries(f),
                          "POST",
                          "Ticket submitted.",
                        );
                        if (result) go(`?id=${result.id}`);
                      }}
                    >
                      <label>
                        Title
                        <input
                          name="title"
                          minLength={5}
                          maxLength={160}
                          required
                          placeholder="A short, specific summary"
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          name="description"
                          minLength={10}
                          maxLength={10000}
                          required
                          placeholder="What were you trying to do? What happened instead?"
                        />
                      </label>
                      <div className="form-row">
                        <label>
                          Category
                          <select
                            name="categoryId"
                            aria-label="Category"
                            required
                          >
                            <option value="">Choose a category</option>
                            {boot.categories.map((c) => (
                              <option value={c.id} key={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Priority
                          <select
                            name="priority"
                            aria-label="Priority"
                            defaultValue="MEDIUM"
                          >
                            {priorities.map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <small>
                        Use fictional information for this portfolio
                        demonstration. Do not include passwords.
                      </small>
                      <button disabled={busy || !boot.categories.length}>
                        {busy ? "Submitting…" : "Submit ticket"}
                      </button>
                    </form>
                  </section>
                </>
              ) : view === "admin" ? (
                <>
                  <div className="title-row">
                    <div>
                      <p className="eyebrow">Workspace settings</p>
                      <h1>Administration</h1>
                      <p>
                        Manage the categories and people behind your support
                        desk.
                      </p>
                    </div>
                  </div>
                  {admin && (
                    <div className="detail-grid">
                      <section className="card">
                        <div className="card-head">
                          <h2>People & permissions</h2>
                        </div>
                        <div className="card-body stack">
                          {admin.demoMode && (
                            <p className="support-note">
                              Account and role management is disabled on the
                              shared demo.
                            </p>
                          )}
                          {admin.users.map((u) => (
                            <form
                              className="form-row"
                              key={u.id}
                              onSubmit={(e) => {
                                e.preventDefault();
                                void mutate("admin", {
                                  action: "role",
                                  id: u.id,
                                  role: new FormData(e.currentTarget).get(
                                    "role",
                                  ),
                                });
                              }}
                            >
                              <div>
                                <strong>{u.name}</strong>
                                <small style={{ display: "block" }}>
                                  {u.email}
                                </small>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <label
                                  className="sr-only"
                                  htmlFor={`role-${u.id}`}
                                >
                                  Role for {u.name}
                                </label>
                                <select
                                  id={`role-${u.id}`}
                                  name="role"
                                  defaultValue={u.role}
                                  disabled={
                                    u.id === boot.user.id || admin.demoMode
                                  }
                                >
                                  {["REQUESTER", "AGENT", "ADMIN"].map((r) => (
                                    <option key={r}>{r}</option>
                                  ))}
                                </select>
                                <button
                                  disabled={
                                    busy ||
                                    u.id === boot.user.id ||
                                    admin.demoMode
                                  }
                                >
                                  Save
                                </button>
                              </div>
                            </form>
                          ))}
                          <small>
                            Your own role cannot be changed here. Changing
                            someone’s role ends their existing sessions.
                          </small>
                        </div>
                      </section>
                      <section className="card card-body">
                        <h2>Categories</h2>
                        <div className="stack">
                          {admin.categories.map((c) => (
                            <div
                              key={c.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                                alignItems: "center",
                              }}
                            >
                              <span>
                                {c.name}
                                <small style={{ display: "block" }}>
                                  {c.active ? "Active" : "Archived"}
                                </small>
                              </span>
                              <button
                                className="secondary"
                                disabled={busy || admin.demoMode}
                                onClick={() =>
                                  void mutate("admin", {
                                    action: "categoryState",
                                    id: c.id,
                                    active: !c.active,
                                  })
                                }
                              >
                                {c.active ? "Archive" : "Restore"}
                              </button>
                            </div>
                          ))}
                          <form
                            className="form"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const form = e.currentTarget;
                              if (
                                await mutate("admin", {
                                  action: "category",
                                  name: new FormData(form).get("name"),
                                })
                              )
                                form.reset();
                            }}
                          >
                            <label>
                              New category
                              <input
                                name="name"
                                minLength={2}
                                maxLength={60}
                                required
                              />
                            </label>
                            <button disabled={busy || admin.demoMode}>
                              Add category
                            </button>
                          </form>
                        </div>
                      </section>
                    </div>
                  )}
                </>
              ) : id ? (
                <>
                  {loading ? (
                    <p role="status">Loading ticket…</p>
                  ) : (
                    ticket && (
                      <>
                        <Link className="back" href="/desk">
                          <ArrowLeft size={15} />
                          Back to queue
                        </Link>
                        <div className="title-row">
                          <div>
                            <p className="eyebrow">
                              HDF-{String(ticket.number).padStart(4, "0")} ·{" "}
                              {ticket.category.name}
                            </p>
                            <h1>{ticket.title}</h1>
                            <p>
                              Opened by {ticket.requester.name} ·{" "}
                              {date(ticket.createdAt)}
                            </p>
                          </div>
                          <span className={`badge ${ticket.status}`}>
                            {label(ticket.status)}
                          </span>
                        </div>
                        <div className="detail-grid">
                          <div className="stack">
                            <section className="card card-body">
                              <h2>Issue description</h2>
                              <p>{ticket.description}</p>
                              {ticket.resolution && (
                                <div className="support-note">
                                  <div>
                                    <strong>Resolution</strong>
                                    <p>{ticket.resolution}</p>
                                  </div>
                                </div>
                              )}
                            </section>
                            <section className="card card-body">
                              <h2>Conversation</h2>
                              {ticket.messages.length === 0 && (
                                <p className="muted">
                                  No replies yet. Start the conversation below.
                                </p>
                              )}
                              {ticket.messages.map((m) => (
                                <article
                                  className={`message ${m.internal ? "internal" : ""}`}
                                  key={m.id}
                                >
                                  <div className="meta">
                                    <strong>
                                      {m.author.name}{" "}
                                      {m.internal && "· Private internal note"}
                                    </strong>
                                    <time>{date(m.createdAt)}</time>
                                  </div>
                                  <p>{m.body}</p>
                                </article>
                              ))}
                              <form
                                className="form"
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const form = e.currentTarget;
                                  const f = new FormData(form);
                                  if (
                                    await change({
                                      action: "reply",
                                      body: f.get("body"),
                                      internal: f.get("internal") === "on",
                                    })
                                  )
                                    form.reset();
                                }}
                              >
                                <label htmlFor="reply">
                                  {staff
                                    ? "Add a reply or note"
                                    : "Reply to support"}
                                  <textarea
                                    id="reply"
                                    name="body"
                                    required
                                    maxLength={10000}
                                  />
                                </label>
                                {staff && (
                                  <label className="check">
                                    <input type="checkbox" name="internal" />
                                    Private internal note · support staff only
                                  </label>
                                )}
                                <button disabled={busy}>
                                  {busy ? "Saving…" : "Send message"}
                                </button>
                              </form>
                            </section>
                            <section className="card card-body">
                              <h2>Activity history</h2>
                              {ticket.activities.map((a) => (
                                <div className="activity" key={a.id}>
                                  <strong>{a.detail}</strong>
                                  <p className="muted">
                                    {a.actor.name} · {date(a.createdAt)}
                                  </p>
                                </div>
                              ))}
                            </section>
                          </div>
                          <aside className="stack">
                            <section className="card card-body">
                              <h2>Ticket details</h2>
                              <p>
                                <small>Assigned to</small>
                                <br />
                                {ticket.assignee?.name ?? "Unassigned"}
                              </p>
                              <p>
                                <small>Priority</small>
                                <br />
                                {label(ticket.priority)}
                              </p>
                              {staff && (
                                <div className="stack">
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() =>
                                      void change({
                                        action: "assign",
                                        assigneeId: boot.user.id,
                                      })
                                    }
                                  >
                                    Assign to me
                                  </button>
                                  {boot.user.role === "ADMIN" && (
                                    <form
                                      className="form"
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        void change({
                                          action: "assign",
                                          assigneeId: new FormData(
                                            e.currentTarget,
                                          ).get("assigneeId"),
                                        });
                                      }}
                                    >
                                      <label>
                                        Assign an agent
                                        <select
                                          name="assigneeId"
                                          defaultValue={ticket.assigneeId ?? ""}
                                          required
                                        >
                                          <option value="">
                                            Choose an agent
                                          </option>
                                          {boot.agents.map((a) => (
                                            <option key={a.id} value={a.id}>
                                              {a.name}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                      <button
                                        className="secondary"
                                        disabled={busy}
                                      >
                                        Assign agent
                                      </button>
                                    </form>
                                  )}
                                  <form
                                    className="form"
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      void change({
                                        action: "priority",
                                        priority: new FormData(
                                          e.currentTarget,
                                        ).get("priority"),
                                      });
                                    }}
                                  >
                                    <label>
                                      Update priority
                                      <select
                                        name="priority"
                                        defaultValue={ticket.priority}
                                      >
                                        {priorities.map((p) => (
                                          <option key={p}>{p}</option>
                                        ))}
                                      </select>
                                    </label>
                                    <button
                                      className="secondary"
                                      disabled={busy}
                                    >
                                      Save priority
                                    </button>
                                  </form>
                                </div>
                              )}
                            </section>
                            {(staff || ticket.status === "RESOLVED") && (
                              <section className="card card-body">
                                <h2>
                                  {ticket.status === "RESOLVED"
                                    ? "Reopen ticket"
                                    : "Update status"}
                                </h2>
                                <form
                                  className="form"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const f = new FormData(e.currentTarget);
                                    void change({
                                      action: "status",
                                      status:
                                        ticket.status === "RESOLVED"
                                          ? "OPEN"
                                          : f.get("status"),
                                      reason: f.get("reason"),
                                    });
                                  }}
                                >
                                  {ticket.status !== "RESOLVED" && (
                                    <label>
                                      Status
                                      <select
                                        name="status"
                                        defaultValue={ticket.status}
                                      >
                                        {statuses.map((s) => (
                                          <option key={s} value={s}>
                                            {label(s)}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  )}
                                  <label>
                                    {ticket.status === "RESOLVED"
                                      ? "Reason for reopening"
                                      : "Resolution / explanation"}
                                    <textarea
                                      name="reason"
                                      maxLength={10000}
                                      required={ticket.status === "RESOLVED"}
                                    />
                                  </label>
                                  <small>
                                    Resolving or reopening requires at least 10
                                    characters of explanation.
                                  </small>
                                  <button disabled={busy}>
                                    {ticket.status === "RESOLVED"
                                      ? "Reopen ticket"
                                      : "Save status"}
                                  </button>
                                </form>
                              </section>
                            )}
                          </aside>
                        </div>
                      </>
                    )
                  )}
                </>
              ) : (
                <>
                  <div className="title-row">
                    <div>
                      <p className="eyebrow">Your support workspace</p>
                      <h1>
                        {view === "mine"
                          ? "Assigned to me"
                          : staff
                            ? "A clearer view of your queue."
                            : "How can we help?"}
                      </h1>
                      <p>
                        {staff
                          ? "Track the details. Keep things moving. Close the loop."
                          : "Report an issue and follow its progress, all in one place."}
                      </p>
                    </div>
                    <Link className="button" href="/desk?view=new">
                      <Plus size={17} />
                      New ticket
                    </Link>
                  </div>
                  <div className="stats">
                    {[
                      [Inbox, "OPEN", "Open tickets", "Ready for a first look"],
                      [
                        Clock3,
                        "IN_PROGRESS",
                        "In progress",
                        "Support is on it",
                      ],
                      [
                        CircleDot,
                        "WAITING_FOR_REQUESTER",
                        "Waiting for requester",
                        "A little more information",
                      ],
                      [
                        CheckCheck,
                        "RESOLVED",
                        "Resolved",
                        "The loop is closed",
                      ],
                    ].map(([Icon, s, title, sub]) => {
                      const I = Icon as typeof Inbox;
                      return (
                        <section className="stat" key={String(s)}>
                          <div className="stat-label">
                            {String(title)}
                            <I size={16} />
                          </div>
                          <strong>
                            {boot.dashboard.counts[String(s)] ?? 0}
                          </strong>
                          <small>{String(sub)}</small>
                        </section>
                      );
                    })}
                  </div>
                  <section className="card">
                    <div className="card-head">
                      <h2>
                        {view === "mine"
                          ? "Your assigned tickets"
                          : staff
                            ? "Ticket queue"
                            : "Your tickets"}{" "}
                        <span className="badge" style={{ marginLeft: 8 }}>
                          {pageInfo.total}
                        </span>
                      </h2>
                      <small>
                        {boot.dashboard.total} total{" "}
                        {staff ? "in workspace" : "submitted by you"}
                      </small>
                    </div>
                    <form className="filters" onSubmit={submitFilters}>
                      <label className="search">
                        <span className="sr-only">Search tickets</span>
                        <Search size={17} />
                        <input
                          aria-label="Search tickets"
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="Search ticket titles or descriptions…"
                        />
                      </label>
                      <label>
                        <span className="sr-only">Filter by status</span>
                        <select
                          aria-label="Filter by status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <option value="">All statuses</option>
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {label(s)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="sr-only">Filter by priority</span>
                        <select
                          aria-label="Filter by priority"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                        >
                          <option value="">All priorities</option>
                          {priorities.map((p) => (
                            <option key={p} value={p}>
                              {label(p)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="secondary">Apply filters</button>
                    </form>
                    {loading ? (
                      <p className="empty" role="status">
                        Loading tickets…
                      </p>
                    ) : tickets.length === 0 ? (
                      <div className="empty">
                        <TicketIcon
                          size={28}
                          style={{ margin: "0 auto 15px" }}
                        />
                        <h3>No tickets here yet.</h3>
                        <p>Try different filters or submit a new ticket.</p>
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Ticket</th>
                              <th>Status</th>
                              <th>Priority</th>
                              <th>Assigned to</th>
                              <th>Opened</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tickets.map((t) => (
                              <tr key={t.id}>
                                <td>
                                  <Link href={`/desk?id=${t.id}`}>
                                    {t.title}
                                  </Link>
                                  <small>
                                    HDF-{String(t.number).padStart(4, "0")}{" "}
                                    <span style={{ margin: "0 6px" }}>·</span>{" "}
                                    {t.category.name}
                                  </small>
                                </td>
                                <td>
                                  <span className={`badge ${t.status}`}>
                                    {label(t.status)}
                                  </span>
                                </td>
                                <td>
                                  <span className={`priority ${t.priority}`}>
                                    {label(t.priority)}
                                  </span>
                                </td>
                                <td>
                                  {t.assignee?.name ?? (
                                    <span className="muted">Unassigned</span>
                                  )}
                                </td>
                                <td className="muted">{date(t.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="pagination">
                      <span>
                        {pageInfo.total} tickets · Page {pageInfo.page} of{" "}
                        {pageInfo.pages}
                      </span>
                      <div>
                        <button
                          className="secondary"
                          disabled={pageInfo.page <= 1 || loading}
                          onClick={() =>
                            go(
                              `?${new URLSearchParams({ ...Object.fromEntries(params), page: String(pageInfo.page - 1) })}`,
                            )
                          }
                        >
                          Previous
                        </button>
                        <button
                          className="secondary"
                          disabled={pageInfo.page >= pageInfo.pages || loading}
                          onClick={() =>
                            go(
                              `?${new URLSearchParams({ ...Object.fromEntries(params), page: String(pageInfo.page + 1) })}`,
                            )
                          }
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </section>
                  <aside className="support-note">
                    <CircleHelp size={20} />
                    <div>
                      <strong>A useful ticket starts with the details.</strong>
                      <p>
                        Include the steps you took and what you expected to
                        happen. A little context helps support find the right
                        solution.
                      </p>
                    </div>
                  </aside>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
